import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CANTEEN_CATEGORIES,
  CANTEEN_PRODUCTS,
  INITIAL_WALLET_DATA,
  INITIAL_TRANSACTIONS,
} from '../constants/canteenData';
import { walletApi } from '../api/walletApi';
import { useAuth } from './AuthContext';

const CanteenContext = createContext(null);

export const CanteenProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [categories, setCategories] = useState(CANTEEN_CATEGORIES);
  const [products, setProducts] = useState(CANTEEN_PRODUCTS);
  const [wallet, setWallet] = useState(() => ({
    ...INITIAL_WALLET_DATA,
    holderName: user?.name || '',
    nisn: user?.nrs || (user?.role === 'siswa' ? 'NISN Belum Diisi' : (user?.role ? String(user.role).toUpperCase() : '—')),
    cardNumber: user?.id ? `CARD-${String(user.id).padStart(6, '0')}` : '—',
  }));
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [walletError, setWalletError] = useState(null);

  /**
   * Fetch live wallet info and transaction history from Laravel Sanctum API
   */
  const fetchWalletData = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingWallet(true);
    setWalletError(null);

    try {
      // 1. Fetch live wallet details
      const walletRes = await walletApi.getWallet();
      if (walletRes?.success && walletRes?.data?.wallet) {
        const w = walletRes.data.wallet;
        const u = walletRes.data.user || user || {};

        setWallet({
          id: w.id,
          balance: Number(w.balance) || 0,
          formattedBalance: w.formatted_balance || `Rp ${Number(w.balance || 0).toLocaleString('id-ID')}`,
          dailyLimit: Number(w.daily_limit) || 50000,
          formattedDailyLimit: w.formatted_daily_limit || `Rp ${Number(w.daily_limit || 50000).toLocaleString('id-ID')}`,
          spentToday: Number(w.today_spent) || 0,
          formattedSpentToday: w.formatted_today_spent || `Rp ${Number(w.today_spent || 0).toLocaleString('id-ID')}`,
          remainingDailyLimit: Number(w.remaining_daily_limit) || 0,
          formattedRemainingLimit: w.formatted_remaining_limit || `Rp ${Number(w.remaining_daily_limit || 0).toLocaleString('id-ID')}`,
          cardNumber: w.card_number || `CARD-${String(u.id || user?.id || 0).padStart(6, '0')}`,
          holderName: u.name || user?.name || 'Pengguna Siswa',
          nisn: u.nrs || user?.nrs || (u.role === 'siswa' ? 'NISN Belum Diisi' : (u.role ? String(u.role).toUpperCase() : '—')),
          isBlocked: Boolean(w.is_blocked),
          blockedReason: w.blocked_reason,
          hasStudentPin: Boolean(w.has_student_pin),
          hasParentPin: Boolean(w.has_parent_pin),
          failedPinAttempts: Number(w.failed_pin_attempts) || 0,
          qrPayload: w.qr_payload || w.card_number,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(w.qr_payload || w.card_number)}`,
        });
      }

      // 2. Fetch live transactions
      const txRes = await walletApi.getTransactions({ per_page: 25 });
      if (txRes?.success && Array.isArray(txRes?.data?.items)) {
        const mappedTx = txRes.data.items.map((item) => ({
          id: item.transaction_number,
          dbId: item.id,
          stall: item.type === 'topup' ? 'Top Up Saldo E-Kantin' : (item.description || 'Kantin Sekolah'),
          items: item.description || item.type_label,
          amount: Math.abs(Number(item.amount)),
          formattedAmount: item.formatted_amount,
          type: item.type,
          date: item.date_formatted || item.date_human,
          status: item.type === 'purchase' ? 'Selesai' : 'Berhasil',
          orderNumber: item.reference_id || `#${item.transaction_number.slice(-6)}`,
          balanceBefore: item.balance_before,
          balanceAfter: item.balance_after,
        }));

        // Set live user transactions list (clears dummy data if user has no transactions)
        setTransactions(mappedTx);
      } else {
        setTransactions([]);
      }

      // 3. Fetch live products and categories from backend
      try {
        const prodRes = await walletApi.getCanteenProducts();
        if (prodRes?.success && Array.isArray(prodRes?.data?.products) && prodRes.data.products.length > 0) {
          const apiProducts = prodRes.data.products.map((p) => ({
            id: p.id,
            backendId: p.id,
            code: p.code,
            name: p.name,
            price: Number(p.price),
            formattedPrice: p.formatted_price,
            stock: p.stock,
            isUnlimitedStock: p.is_unlimited_stock,
            isOpenPrice: p.is_open_price,
            imageUrl: p.image || 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=80',
            stall: p.canteen_name || 'Kantin Sekolah',
            category: p.category_name?.toLowerCase() || 'meals',
            isAvailable: p.stock > 0 || p.is_unlimited_stock,
            rating: 4.9,
            ordersCount: 120,
            prepTime: '5 mnt',
            badge: p.stock < 10 && !p.is_unlimited_stock ? 'Sisa Sedikit' : null,
          }));
          setProducts(apiProducts);

          if (Array.isArray(prodRes?.data?.categories) && prodRes.data.categories.length > 0) {
            const apiCats = [
              { id: 'all', name: 'Semua', icon: 'restaurant-outline' },
              ...prodRes.data.categories.map((c) => ({
                id: c.slug || String(c.id),
                name: c.name,
                icon: c.icon || 'fast-food-outline',
              })),
            ];
            setCategories(apiCats);
          }
        }
      } catch (prodErr) {
        console.log('Using default canteen products fallback');
      }

    } catch (err) {
      console.log('Error fetching live wallet data:', err?.message || err);
      setWalletError(err?.message || 'Gagal memuat data dompet dari server');
    } finally {
      setIsLoadingWallet(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // Synchronize wallet and transactions whenever authenticated user changes
  useEffect(() => {
    if (user && user.id) {
      setWallet((prev) => ({
        ...prev,
        holderName: user.name || 'Pengguna',
        nisn: user.nrs || (user.role === 'siswa' ? 'NISN Belum Diisi' : (user.role ? String(user.role).toUpperCase() : '—')),
        cardNumber: prev.cardNumber && prev.cardNumber !== '—' ? prev.cardNumber : `CARD-${String(user.id).padStart(6, '0')}`,
      }));
      fetchWalletData(false);
    } else if (!isAuthenticated) {
      setWallet(INITIAL_WALLET_DATA);
      setTransactions([]);
    }
  }, [user?.id, isAuthenticated, fetchWalletData]);

  // Pull-to-refresh handler
  const refreshWallet = useCallback(async () => {
    setIsRefreshing(true);
    await fetchWalletData(true);
  }, [fetchWalletData]);

  // Cart operations
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, note: '' }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const updateItemNote = (productId, note) => {
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, note } : item))
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  /**
   * Initiate Midtrans Snap Top-Up Session
   */
  const initiateTopUp = async (amount) => {
    try {
      const res = await walletApi.createTopupSnap(amount);
      if (res?.success && res?.data) {
        return {
          success: true,
          data: res.data,
        };
      }
      return {
        success: false,
        message: res?.message || 'Gagal membuat sesi pembayaran Midtrans.',
      };
    } catch (err) {
      return {
        success: false,
        message: err?.message || 'Gagal menghubungi server pembayaran.',
      };
    }
  };

  /**
   * Check status of Midtrans order and auto-credit wallet if settled
   */
  const checkTopUpStatus = async (orderId, options = {}) => {
    try {
      const res = await walletApi.checkTopupStatus(orderId, options);
      if (res?.success) {
        // Automatically sync fresh balance
        await fetchWalletData(true);
        return {
          success: true,
          isSettled: res.data?.is_settled,
          status: res.data?.status,
          data: res.data,
        };
      }
      return {
        success: false,
        message: res?.message || 'Gagal memverifikasi status pembayaran.',
      };
    } catch (err) {
      return {
        success: false,
        message: err?.message || 'Gagal memeriksa status pembayaran.',
      };
    }
  };

  /**
   * Set 6-digit transaction PIN (supports direct (pin, pinConfirmation) or with password)
   */
  const setTransactionPin = async (arg1, arg2, arg3) => {
    let pin, pinConfirmation, password;
    if (typeof arg3 !== 'undefined') {
      if (typeof arg1 === 'string' && /^\d{6}$/.test(arg1)) {
        pin = arg1;
        pinConfirmation = arg2 || arg1;
        password = arg3;
      } else {
        password = arg1;
        pin = arg2;
        pinConfirmation = arg3 || arg2;
      }
    } else if (typeof arg2 !== 'undefined') {
      pin = arg1;
      pinConfirmation = arg2;
      password = null;
    } else {
      pin = arg1;
      pinConfirmation = arg1;
      password = null;
    }

    try {
      const res = await walletApi.setPin({
        password: password || undefined,
        pin,
        pin_confirmation: pinConfirmation || pin,
      });
      if (res?.success) {
        await fetchWalletData(true);
        return { success: true, message: res.message };
      }
      return { success: false, message: res?.message || 'Gagal mengatur PIN.' };
    } catch (err) {
      return { success: false, message: err?.message || 'Gagal menghubungi server.' };
    }
  };

  /**
   * Verify 6-digit transaction PIN
   */
  const verifyTransactionPin = async (pin) => {
    try {
      const res = await walletApi.verifyPin(pin);
      return res;
    } catch (err) {
      return {
        success: false,
        code: err?.code || 'ERROR',
        message: err?.message || 'PIN transaksi salah atau verifikasi gagal.',
      };
    }
  };

  /**
   * Checkout with Wallet (via Backend API with PIN & DB lock)
   */
  const checkoutCart = async (pin, notes = '') => {
    if (cart.length === 0) {
      return { success: false, message: 'Keranjang belanja kosong.' };
    }

    if (!pin) {
      return { success: false, message: 'Harap masukkan PIN 6-digit untuk otorisasi pembayaran.' };
    }

    // Prepare items payload
    const itemsPayload = cart.map((item) => ({
      id: typeof item.backendId === 'number' ? item.backendId : (Number(item.id) || 1),
      quantity: item.quantity,
    }));

    try {
      const res = await walletApi.payCanteen({
        pin,
        items: itemsPayload,
        notes,
      });

      if (res?.success) {
        clearCart();
        await fetchWalletData(true);
        return {
          success: true,
          orderNumber: res.data?.order_number,
          transactionNumber: res.data?.transaction_number,
          totalAmount: res.data?.total_amount,
          balanceAfter: res.data?.balance_after,
          message: res.message || 'Pembayaran kantin berhasil! Saldo dompet telah terpotong.',
        };
      }

      return {
        success: false,
        message: res?.message || 'Pembayaran gagal diproses.',
      };
    } catch (err) {
      return {
        success: false,
        message: err?.message || 'Terjadi kesalahan saat memproses pembayaran kantin.',
      };
    }
  };

  return (
    <CanteenContext.Provider
      value={{
        categories,
        products,
        wallet,
        transactions,
        cart,
        cartCount,
        cartTotal,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        addToCart,
        updateQuantity,
        updateItemNote,
        clearCart,
        initiateTopUp,
        checkTopUpStatus,
        setTransactionPin,
        verifyTransactionPin,
        checkoutCart,
        fetchWalletData,
        refreshWallet,
        isLoadingWallet,
        isRefreshing,
        walletError,
      }}
    >
      {children}
    </CanteenContext.Provider>
  );
};

export const useCanteen = () => {
  const context = useContext(CanteenContext);
  if (!context) {
    throw new Error('useCanteen must be used within a CanteenProvider');
  }
  return context;
};

export default CanteenContext;

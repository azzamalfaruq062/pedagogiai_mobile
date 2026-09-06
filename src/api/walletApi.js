import { apiClient } from './client';

export const walletApi = {
  /**
   * Get authenticated user's digital wallet info (balance, limit, card, QR, status).
   */
  getWallet: async () => {
    return apiClient('/wallet');
  },

  /**
   * Get paginated wallet transaction mutations with optional filters.
   */
  getTransactions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/wallet/transactions${query ? `?${query}` : ''}`);
  },

  /**
   * Get single transaction detail / invoice.
   */
  getTransactionDetail: async (id) => {
    return apiClient(`/wallet/transactions/${id}`);
  },

  /**
   * Create Midtrans Snap top-up session (min Rp 10.000).
   */
  createTopupSnap: async (amount) => {
    return apiClient('/wallet/topup/snap', {
      method: 'POST',
      body: { amount: Number(amount) },
    });
  },

  /**
   * Verify top-up status from Midtrans Core API and credit wallet if settled.
   */
  checkTopupStatus: async (orderId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/wallet/topup/check-status/${orderId}${query ? `?${query}` : ''}`);
  },

  /**
   * Set or change student 6-digit transaction PIN (requires account password).
   */
  setPin: async ({ password, pin, pin_confirmation }) => {
    return apiClient('/wallet/pin/set', {
      method: 'POST',
      body: {
        password,
        pin,
        pin_confirmation: pin_confirmation || pin,
      },
    });
  },

  /**
   * Verify 6-digit transaction PIN before authorizing payments.
   */
  verifyPin: async (pin) => {
    return apiClient('/wallet/pin/verify', {
      method: 'POST',
      body: { pin },
    });
  },

  /**
   * Process Canteen purchase checkout with wallet balance atomically.
   */
  payCanteen: async ({ pin, items, notes, canteenId }) => {
    return apiClient('/wallet/pay-canteen', {
      method: 'POST',
      body: {
        pin,
        items,
        notes: notes || undefined,
        canteen_id: canteenId || undefined,
      },
    });
  },

  /**
   * Get active canteen categories and product catalog from database.
   */
  getCanteenProducts: async () => {
    return apiClient('/wallet/canteen/products');
  },
};

export default walletApi;

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useCanteen } from '../../hooks/useCanteen';
import AppButton from '../../components/common/AppButton';

import ModernPinSheet from '../../components/common/ModernPinSheet';

export default function CanteenCartModal({ visible, onClose, onOpenWallet }) {
  const { theme, isDark } = useTheme();
  const {
    cart,
    cartTotal,
    cartCount,
    updateQuantity,
    checkoutCart,
    clearCart,
    wallet,
    setTransactionPin,
  } = useCanteen();

  const [orderNotes, setOrderNotes] = useState('');
  const [showPinRequiredModal, setShowPinRequiredModal] = useState(false);
  const [showPinSheet, setShowPinSheet] = useState(false);
  const [pinSheetMode, setPinSheetMode] = useState('verify'); // 'setup' | 'verify'

  const handleStartCheckout = () => {
    // 1. Validasi Saldo
    if (wallet.balance < cartTotal) {
      Alert.alert(
        'Saldo Tidak Mencukupi',
        `Saldo dompet Anda saat ini Rp ${wallet.balance.toLocaleString('id-ID')}, sedangkan total pesanan Rp ${cartTotal.toLocaleString('id-ID')}.\n\nSilakan lakukan Top Up saldo terlebih dahulu.`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Top Up Sekarang',
            onPress: () => {
              onClose();
              if (onOpenWallet) onOpenWallet();
            },
          },
        ]
      );
      return;
    }

    // 2. Validasi Kartu Diblokir
    if (wallet.isBlocked) {
      Alert.alert(
        'Kartu Dompet Terkunci',
        `Kartu/dompet Anda saat ini tidak dapat digunakan: ${wallet.blockedReason || 'Ditangguhkan oleh sekolah'}.\n\nSilakan hubungi bagian keuangan/admin sekolah.`
      );
      return;
    }

    // 3. Validasi Limit Harian Jajan
    const projectedSpent = (wallet.spentToday || 0) + cartTotal;
    if (projectedSpent > (wallet.dailyLimit || 50000)) {
      const remainingLimit = Math.max(0, (wallet.dailyLimit || 50000) - (wallet.spentToday || 0));
      Alert.alert(
        'Batas Limit Harian Terlampaui',
        `Total belanja akan melebihi batas jajan harian Anda (Maks: Rp ${(wallet.dailyLimit || 50000).toLocaleString('id-ID')}/hari).\n\nSisa kuota jajan Anda hari ini: Rp ${remainingLimit.toLocaleString('id-ID')}.`
      );
      return;
    }

    // 4. Validasi Keberadaan PIN Transaksi
    if (!wallet.hasStudentPin) {
      setShowPinRequiredModal(true);
      return;
    }

    // Tampilkan Sheet Otorisasi PIN dengan Keypad Alami Modern
    setPinSheetMode('verify');
    setShowPinSheet(true);
  };

  const handlePinSheetComplete = async (pin, confirmPin) => {
    if (pinSheetMode === 'setup') {
      const res = await setTransactionPin(pin, confirmPin);
      return res;
    } else {
      // mode === 'verify' (Checkout Cart)
      const res = await checkoutCart(pin, orderNotes);
      if (res?.success) {
        setOrderNotes('');
        onClose();
        Alert.alert(
          'Pesanan Berhasil Dibuat! 🎉',
          `Nomor Pesanan: ${res.orderNumber || '-'}\nTotal: Rp ${cartTotal.toLocaleString('id-ID')}\n\nSilakan ambil pesanan Anda di stan kantin sekolah dengan menunjukkan nomor pesanan ini.`
        );
      }
      return res;
    }
  };

  const handlePinSetupSuccessClose = () => {
    // Setelah PIN berhasil dibuat, otomatis buka otorisasi untuk bayar belanjaan langsung
    setPinSheetMode('verify');
    setShowPinSheet(true);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                Keranjang Jajan
              </Text>
              <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
                {cartCount} item pesanan kantin sekolah
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? '#1C243B' : '#F1F5F9' },
              ]}
            >
              <Ionicons name="close" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cart-outline" size={36} color={theme.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                Keranjang Kosong
              </Text>
              <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                Pilih makanan atau minuman favoritmu dari daftar menu kantin.
              </Text>
              <AppButton
                title="Lihat Menu Kantin"
                onPress={onClose}
                style={{ marginTop: 16 }}
              />
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.itemsList}
                showsVerticalScrollIndicator={false}
              >
                {cart.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.cartItemRow,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <View style={styles.itemInfo}>
                      <Text
                        style={[styles.itemName, { color: theme.textPrimary }]}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[styles.itemStall, { color: theme.textMuted }]}
                      >
                        {item.stall} • Rp {item.price.toLocaleString('id-ID')}
                      </Text>
                    </View>

                    {/* Quantity Stepper */}
                    <View
                      style={[
                        styles.stepperWrap,
                        {
                          backgroundColor: isDark ? '#161D32' : '#F1F5F9',
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, -1)}
                        style={styles.stepBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                          size={14}
                          color={item.quantity === 1 ? theme.accentRose : theme.textPrimary}
                        />
                      </TouchableOpacity>

                      <Text
                        style={[styles.stepCount, { color: theme.textPrimary }]}
                      >
                        {item.quantity}
                      </Text>

                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, 1)}
                        style={styles.stepBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="add" size={14} color={theme.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Catatan Tambahan */}
                <View style={styles.notesSection}>
                  <Text style={[styles.notesLabel, { color: theme.textSecondary }]}>
                    Catatan untuk Penjual (Opsional):
                  </Text>
                  <TextInput
                    value={orderNotes}
                    onChangeText={setOrderNotes}
                    placeholder="Contoh: Tidak pakai sambal, es sedikit..."
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.notesInput,
                      {
                        backgroundColor: isDark ? '#141A2D' : '#F8FAFC',
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                </View>

                {/* Wallet Balance Notification */}
                <View
                  style={[
                    styles.walletNotice,
                    {
                      backgroundColor: isDark ? '#141E36' : '#EFF6FF',
                      borderColor: isDark ? '#1E2B4D' : '#BFDBFE',
                    },
                  ]}
                >
                  <View style={styles.walletNoticeHeader}>
                    <Ionicons
                      name="card-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.walletNoticeTitle,
                        { color: theme.primary },
                      ]}
                    >
                      Metode: Dompet Digital E-Kantin
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.walletBalanceText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Saldo saat ini: Rp {wallet.balance.toLocaleString('id-ID')}
                    {wallet.balance < cartTotal && (
                      <Text style={{ color: theme.accentRose, fontWeight: '700' }}>
                        {' '}(Saldo Kurang)
                      </Text>
                    )}
                  </Text>
                </View>
              </ScrollView>

              {/* Footer Summary & Checkout */}
              <View
                style={[
                  styles.footerContainer,
                  { borderTopColor: theme.border },
                ]}
              >
                <View style={styles.totalRow}>
                  <Text
                    style={[styles.totalLabel, { color: theme.textSecondary }]}
                  >
                    Total Pembayaran
                  </Text>
                  <Text
                    style={[styles.totalAmount, { color: theme.textPrimary }]}
                  >
                    Rp {cartTotal.toLocaleString('id-ID')}
                  </Text>
                </View>

                <AppButton
                  title="Bayar dengan Saldo E-Kantin"
                  icon="checkmark-circle"
                  onPress={handleStartCheckout}
                />
              </View>
            </>
          )}
        </View>

        {/* ── 1. DIALOG KEAMANAN: PIN BELUM DIBUAT (MODERN MOBILE FINTECH ALERT) ── */}
        {showPinRequiredModal && (
          <View style={styles.fullscreenOverlayBackdrop}>
            <View
              style={[
                styles.pinRequiredCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: isDark ? '#2D3B5F' : '#E2E8F0',
                },
              ]}
            >
              {/* Floating Shield with Glowing Amber Ring */}
              <View style={styles.shieldWrapper}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706', '#B45309']}
                  style={styles.securityShieldCircle}
                >
                  <Ionicons name="shield-checkmark" size={38} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.shieldLockBadge}>
                  <Ionicons name="lock-closed" size={13} color="#FFFFFF" />
                </View>
              </View>

              {/* Security Pill Badge */}
              <View
                style={[
                  styles.securityBadge,
                  {
                    backgroundColor: isDark ? 'rgba(245,158,11,0.18)' : '#FEF3C7',
                    borderColor: isDark ? 'rgba(245,158,11,0.35)' : '#FDE68A',
                  },
                ]}
              >
                <Ionicons name="shield" size={12} color="#D97706" />
                <Text style={styles.securityBadgeText}>
                  PROTEKSI DOMPET SISWA
                </Text>
              </View>

              <Text style={[styles.pinRequiredTitle, { color: theme.textPrimary }]}>
                PIN Transaksi Belum Diatur
              </Text>

              <Text style={[styles.pinRequiredDesc, { color: theme.textSecondary }]}>
                Untuk melindungi saldo dompet Anda saat jajan di kantin dan mencegah transaksi tanpa izin, silakan aktifkan 6-digit PIN keamanan terlebih dahulu.
              </Text>

              {/* Benefit Cards Checklist */}
              <View
                style={[
                  styles.securityBenefitsBox,
                  {
                    backgroundColor: isDark ? '#141A2D' : '#F8FAFC',
                    borderColor: isDark ? '#233054' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.securityBenefitItem}>
                  <View style={[styles.benefitIconWrap, { backgroundColor: isDark ? 'rgba(16,185,129,0.18)' : '#D1FAE5' }]}>
                    <Ionicons name="lock-closed" size={14} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.benefitItemTitle, { color: theme.textPrimary }]}>
                      Proteksi Saldo 100%
                    </Text>
                    <Text style={[styles.benefitItemDesc, { color: theme.textMuted }]}>
                      Saldo terkunci aman dari pemakaian orang lain
                    </Text>
                  </View>
                </View>

                <View style={styles.securityBenefitItem}>
                  <View style={[styles.benefitIconWrap, { backgroundColor: isDark ? 'rgba(59,130,246,0.18)' : '#DBEAFE' }]}>
                    <Ionicons name="flash" size={14} color="#3B82F6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.benefitItemTitle, { color: theme.textPrimary }]}>
                      Otorisasi Belanja Super Praktis
                    </Text>
                    <Text style={[styles.benefitItemDesc, { color: theme.textMuted }]}>
                      Cukup 6 digit angka untuk bayar pesanan kilat
                    </Text>
                  </View>
                </View>

                <View style={styles.securityBenefitItem}>
                  <View style={[styles.benefitIconWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.18)' : '#FEF3C7' }]}>
                    <Ionicons name="bag-check" size={14} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.benefitItemTitle, { color: theme.textPrimary }]}>
                      Keranjang Belanja Tetap Tersimpan
                    </Text>
                    <Text style={[styles.benefitItemDesc, { color: theme.textMuted }]}>
                      Pesanan Anda tidak akan hilang saat pasang PIN
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                onPress={() => {
                  setShowPinRequiredModal(false);
                  setPinSheetMode('setup');
                  setShowPinSheet(true);
                }}
                style={styles.btnCreatePinCTA}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#1E3A8A', '#2563EB', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtn}
                >
                  <Ionicons name="key" size={18} color="#FFFFFF" />
                  <Text style={styles.gradientBtnText}>Buat PIN 6-Digit Sekarang</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowPinRequiredModal(false)}
                style={styles.btnLater}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnLaterText, { color: theme.textMuted }]}>
                  Nanti Saja (Kembali ke Keranjang)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* ── 2. MODERN MINIMALIST PIN SHEET (Custom Keypad, 6 Spaced Dots, Eye Toggle, Layered Shield Success Modal) ── */}
      <ModernPinSheet
        visible={showPinSheet}
        onClose={() => setShowPinSheet(false)}
        mode={pinSheetMode}
        amount={cartTotal}
        onComplete={handlePinSheetComplete}
        onSuccessClose={handlePinSetupSuccessClose}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    maxHeight: '85%',
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
  itemsList: {
    maxHeight: 280,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemStall: {
    fontSize: 11,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
  },
  stepBtn: {
    padding: 4,
  },
  stepCount: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  walletNotice: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  walletNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  walletNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  walletBalanceText: {
    fontSize: 11,
  },
  footerContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  notesSection: {
    marginTop: 10,
    marginBottom: 4,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
  },
  fullscreenOverlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 10, 24, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    zIndex: 9999,
    elevation: 20,
  },
  pinModalCard: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 26,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  pinIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pinModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  pinModalSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 6,
  },
  pinModalAmount: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 14,
  },
  pinActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 10,
  },
  pinCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pinConfirmBtn: {
    flex: 1.5,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // ── Modern Mobile Security Alert Styles ──
  pinRequiredCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  shieldWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  securityShieldCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  shieldLockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D97706',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  securityBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.6,
  },
  pinRequiredTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 6,
  },
  pinRequiredDesc: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  securityBenefitsBox: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  securityBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 1,
  },
  benefitItemDesc: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  btnCreatePinCTA: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gradientBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  btnLater: {
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  btnLaterText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── In-Cart PIN Setup Sheet Styles ──
  inCartPinCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 26,
    borderWidth: 1.5,
    padding: 20,
    maxHeight: '92%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150, 160, 180, 0.4)',
    alignSelf: 'center',
    marginBottom: 10,
  },
  inCartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  pinSetupIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inCartTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  inCartSub: {
    fontSize: 11,
    marginTop: 1,
  },
  inCartCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginBottom: 10,
  },
  inlineErrorText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#EF4444',
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInputStyle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  btnSavePinInCart: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // ── 6-Cell Interactive PIN Display ──
  pinCellsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  pinCellBox: {
    width: 44,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCellDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pinCellCursor: {
    width: 2,
    height: 18,
    borderRadius: 1,
  },
  pinHiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    zIndex: 10,
  },
});

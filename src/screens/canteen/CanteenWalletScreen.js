import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useCanteen } from '../../hooks/useCanteen';
import ModernPinSheet from '../../components/common/ModernPinSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOPUP_PRESETS = [20000, 50000, 100000, 200000];

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function CanteenWalletScreen({ onNavigateToMenu, onNavigateToHistory }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const {
    wallet,
    transactions,
    initiateTopUp,
    checkTopUpStatus,
    setTransactionPin,
    fetchWalletData,
    refreshWallet,
    isLoadingWallet,
    isRefreshing,
  } = useCanteen();

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const dynamicPaddingTop = safeTop + 62;
  const dynamicPaddingBottom = Math.max(insets.bottom || 0, 14) + 86;

  const [selectedTopup, setSelectedTopup] = useState(50000);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);

  // Live top-up & PIN states
  const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [countdownSeconds, setCountdownSeconds] = useState(86399); // 24 hours

  // Refresh wallet data whenever screen is active or user changes
  useEffect(() => {
    fetchWalletData(true);
  }, [user?.id, fetchWalletData]);

  // Auto-poll status every 7 seconds while pending payment modal is visible
  useEffect(() => {
    let pollTimer = null;
    if (showPendingModal && pendingPayment?.orderId) {
      pollTimer = setInterval(async () => {
        try {
          const res = await checkTopUpStatus(pendingPayment.orderId);
          if (res?.isSettled) {
            setShowPendingModal(false);
            setPendingPayment(null);
            Alert.alert(
              'Pembayaran Berhasil! 🎉',
              `Saldo sebesar ${pendingPayment.formattedAmount || `Rp ${pendingPayment.amount?.toLocaleString('id-ID')}`} telah berhasil masuk ke dompet digital Anda.`
            );
          }
        } catch (e) {
          // silent auto poll
        }
      }, 7000);
    }
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [showPendingModal, pendingPayment?.orderId]);

  // Countdown timer effect
  useEffect(() => {
    if (!showPendingModal) return;
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showPendingModal]);

  const formatCountdown = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return {
      hours: String(h).padStart(2, '0'),
      minutes: String(m).padStart(2, '0'),
      seconds: String(s).padStart(2, '0'),
    };
  };

  const copyToClipboard = (text, field) => {
    setCopiedField(field);
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };


  const spendingRatio = Math.min((wallet.spentToday || 0) / (wallet.dailyLimit || 50000), 1);
  const remaining = Math.max(0, (wallet.dailyLimit || 50000) - (wallet.spentToday || 0));

  const selectPreset = (amt) => {
    setIsCustom(false);
    setSelectedTopup(amt);
    setCustomAmount('');
  };

  const onCustomChange = (val) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    setCustomAmount(cleaned);
    setIsCustom(true);
    const num = parseInt(cleaned, 10);
    if (!isNaN(num)) {
      setSelectedTopup(num);
    } else {
      setSelectedTopup(0);
    }
  };

  const currentTopupAmount = isCustom ? (parseInt(customAmount, 10) || 0) : selectedTopup;

  const handleTopup = async () => {
    if (currentTopupAmount < 10000) {
      Alert.alert('Perhatian', 'Nominal top up minimal Rp 10.000.');
      return;
    }

    setIsSubmittingTopup(true);
    try {
      const res = await initiateTopUp(currentTopupAmount);
      setIsSubmittingTopup(false);

      if (res?.success && res?.data) {
        setShowTopupModal(false);
        setPendingPayment({
          orderId: res.data.order_id,
          amount: res.data.amount,
          formattedAmount: res.data.formatted_amount,
          redirectUrl: res.data.redirect_url,
          snapToken: res.data.snap_token,
        });
        setShowPendingModal(true);

        // Buka halaman pembayaran Midtrans di browser / WebView
        if (res.data.redirect_url) {
          Linking.openURL(res.data.redirect_url).catch(() => {
            Alert.alert(
              'Petunjuk Pembayaran',
              'Silakan buka browser atau salin link pembayaran untuk menyelesaikan tagihan.'
            );
          });
        }
      } else {
        Alert.alert('Gagal', res?.message || 'Gagal membuat sesi pembayaran Midtrans.');
      }
    } catch (err) {
      setIsSubmittingTopup(false);
      Alert.alert('Error', err?.message || 'Terjadi kesalahan sistem gateway pembayaran.');
    }
  };

  const handleCheckPaymentStatus = async (forceConfirm = false) => {
    if (!pendingPayment?.orderId) return;

    setIsCheckingStatus(true);
    try {
      const res = await checkTopUpStatus(pendingPayment.orderId, forceConfirm ? { confirm_settled: 1 } : {});
      setIsCheckingStatus(false);

      if (res?.isSettled) {
        setShowPendingModal(false);
        setPendingPayment(null);
        Alert.alert(
          'Pembayaran Berhasil! 🎉',
          `Saldo sebesar ${pendingPayment.formattedAmount || `Rp ${pendingPayment.amount?.toLocaleString('id-ID')}`} telah berhasil masuk ke dompet digital Anda.`
        );
      } else {
        if (!forceConfirm) {
          Alert.alert(
            'Status Pembayaran',
            `Status transaksi saat ini: ${res?.status || 'Menunggu Pembayaran'}.\n\nJika Anda sudah menyelesaikan pembayaran di Midtrans tetapi saldo belum masuk, tekan tombol 'Saya Sudah Bayar'.`,
            [
              { text: 'Tunggu', style: 'cancel' },
              {
                text: 'Saya Sudah Bayar',
                onPress: () => handleCheckPaymentStatus(true),
              }
            ]
          );
        } else {
          Alert.alert(
            'Status Pembayaran',
            `Status transaksi saat ini: ${res?.status || 'Menunggu Pembayaran'}.\n\nMohon tunggu beberapa detik lalu coba kembali.`
          );
        }
      }
    } catch (err) {
      setIsCheckingStatus(false);
      Alert.alert('Info', 'Gagal memverifikasi status pembayaran. Silakan coba lagi.');
    }
  };




  // ─── Card gradient — purple-indigo deep ───────────────────────────────────
  // Dark navy card — same as the original premium look
  const cardGradient = ['#0F172A', '#1E293B', '#0B0F19'];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshWallet}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        contentContainerStyle={{
          paddingTop: dynamicPaddingTop,
          paddingBottom: dynamicPaddingBottom,
        }}
      >
        {/* ════════════════════════════════════
            HERO SECTION — gradient card area
            ════════════════════════════════════ */}
        <LinearGradient
          colors={isDark ? ['#0F1732', '#141A2D'] : ['#EEF2FF', '#F8FAFC']}
          style={styles.heroArea}
        >
          {/* ── Virtual Card ─────────────────── */}
          <LinearGradient
            colors={cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Decorative circles */}
            <View style={styles.cardDecorCircle1} />
            <View style={styles.cardDecorCircle2} />

            {/* Card Header */}
            <View style={styles.cardTop}>
              <View style={styles.cardBrandRow}>
                <View style={styles.cardLogoBox}>
                  <Ionicons name="card" size={14} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.cardBrandName}>INOBEL E-MONEY</Text>
                  <Text style={styles.cardBrandSub}>Student Debit Card</Text>
                </View>
              </View>
              {/* EMV Metallic Smart Chip + Contactless */}
              <View style={styles.chipRow}>
                {/* Amber gradient chip */}
                <LinearGradient
                  colors={['#92400E', '#D97706', '#FCD34D', '#FEF3C7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.simChip}
                >
                  {/* Internal 2×2 circuit grid */}
                  <View style={styles.chipGrid}>
                    <View style={[styles.chipCell, styles.chipCellBR]} />
                    <View style={[styles.chipCell, styles.chipCellB]} />
                    <View style={[styles.chipCell, styles.chipCellR]} />
                    <View style={styles.chipCell} />
                  </View>
                </LinearGradient>
                {/* Contactless RFID icon */}
                <Ionicons name="wifi" size={18} color="rgba(165,180,252,0.85)" style={{ transform: [{ rotate: '90deg' }] }} />
              </View>
            </View>

            {/* Balance */}
            <View style={styles.cardMid}>
              <Text style={styles.balanceLabel}>SALDO TERSEDIA</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceValue}>
                  {balanceHidden
                    ? 'Rp ••••••'
                    : `Rp ${wallet.balance.toLocaleString('id-ID')}`}
                </Text>
                <TouchableOpacity
                  onPress={() => setBalanceHidden(!balanceHidden)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ marginLeft: 8, marginTop: 2 }}
                >
                  <Ionicons
                    name={balanceHidden ? 'eye-outline' : 'eye-off-outline'}
                    size={16}
                    color="rgba(255,255,255,0.7)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Card Footer */}
            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.cardNumLabel}>NOMOR KARTU</Text>
                <Text style={styles.cardNum}>
                  {wallet.cardNumber && wallet.cardNumber !== '—'
                    ? wallet.cardNumber
                    : (user?.id ? `CARD-${String(user.id).padStart(6, '0')}` : '—')}
                </Text>
              </View>
              <View style={styles.cardHolderRight}>
                <Text style={styles.cardHolderLabel}>NISN</Text>
                <Text style={styles.cardHolderVal}>
                  {user?.nrs || (wallet.nisn && wallet.nisn !== '0087429110' ? wallet.nisn : (user?.role === 'siswa' ? 'NISN Belum Diisi' : (user?.role ? String(user.role).toUpperCase() : '—')))}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Holder Name below card */}
          <View style={styles.holderNameRow}>
            <Ionicons name="person-circle-outline" size={15} color={theme.textMuted} />
            <Text style={[styles.holderNameText, { color: theme.textSecondary }]}>
              {user?.name || wallet.holderName || 'Pengguna Siswa'}
            </Text>
          </View>

          {/* Card Blocked Alert Banner */}
          {wallet.isBlocked && (
            <View style={[styles.blockedBanner, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2', borderColor: '#EF4444' }]}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.blockedBannerTitle}>Kartu Dompet Digital Terkunci</Text>
                <Text style={styles.blockedBannerSub}>{wallet.blockedReason || 'Akses ditangguhkan oleh sistem/sekolah'}</Text>
              </View>
            </View>
          )}

          {/* PIN Setup Recommendation Banner */}
          {!wallet.hasStudentPin && (
            <TouchableOpacity
              onPress={() => setShowPinSetupModal(true)}
              style={{
                marginTop: 14,
                borderRadius: 18,
                padding: 14,
                backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : '#FFFBEB',
                borderWidth: 1.5,
                borderColor: isDark ? '#B45309' : '#FCD34D',
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDark ? 0.25 : 0.12,
                shadowRadius: 6,
                elevation: 3,
              }}
              activeOpacity={0.88}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: isDark ? 'rgba(245,158,11,0.25)' : '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="shield-half" size={15} color="#D97706" />
                  </View>
                  <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: isDark ? '#78350F' : '#FEF3C7' }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? '#FDE68A' : '#92400E', letterSpacing: 0.5 }}>
                      KEAMANAN DOMPET
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706' }}>Pasang Sekarang</Text>
                  <Ionicons name="arrow-forward" size={12} color="#D97706" />
                </View>
              </View>

              <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#FDE68A' : '#92400E', marginBottom: 2 }}>
                PIN Transaksi Belum Dibuat
              </Text>
              <Text style={{ fontSize: 11, color: isDark ? '#FCD34D' : '#78350F', lineHeight: 15 }}>
                Aktifkan 6-digit PIN untuk otorisasi belanja di kantin dan melindungi saldo Anda.
              </Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* ════════════════════════════════════
            SCROLLABLE BODY
            ════════════════════════════════════ */}
        <View style={styles.body}>
          {/* ── Quick Actions — icon-first pill row ── */}
          <View style={styles.qaRow}>
            <TouchableOpacity style={styles.qaItem} onPress={() => setShowQrModal(true)} activeOpacity={0.75}>
            <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.qaIconCircle}>
              <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.qaLabel, { color: theme.textSecondary }]}>Bayar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.qaItem} onPress={() => setShowTopupModal(true)} activeOpacity={0.75}>
            <LinearGradient colors={['#059669', '#34D399']} style={styles.qaIconCircle}>
              <Ionicons name="add" size={26} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.qaLabel, { color: theme.textSecondary }]}>Top Up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.qaItem} onPress={onNavigateToMenu} activeOpacity={0.75}>
            <LinearGradient colors={['#D97706', '#FBBF24']} style={styles.qaIconCircle}>
              <Ionicons name="restaurant-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.qaLabel, { color: theme.textSecondary }]}>Pesan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.qaItem} onPress={onNavigateToHistory} activeOpacity={0.75}>
            <LinearGradient colors={['#E11D48', '#FB7185']} style={styles.qaIconCircle}>
              <Ionicons name="receipt-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.qaLabel, { color: theme.textSecondary }]}>Riwayat</Text>
          </TouchableOpacity>
        </View>

        {/* ── 1. Pemakaian Hari Ini — Harmonized Card ── */}
        <View style={[styles.webCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header with Divider */}
          <View style={[styles.webCardHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.webCardHeaderLeft}>
              <Text style={[styles.webCardTitle, { color: theme.textPrimary }]}>PEMAKAIAN HARI INI</Text>
            </View>
            <View style={[styles.webBadgeSubtle, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
              <Text style={[styles.webCardLimitText, { color: theme.primary }]}>
                Max Rp {wallet.dailyLimit.toLocaleString('id-ID')} / hari
              </Text>
            </View>
          </View>

          {/* Body Content */}
          <View style={styles.webCardBody}>
            {/* Terpakai Row */}
            <View style={styles.spendRowBetween}>
              <Text style={[styles.spendRowLabel, { color: theme.textSecondary }]}>Terpakai Hari Ini:</Text>
              <Text style={[styles.spendRowVal, { color: theme.textPrimary }]}>
                Rp {wallet.spentToday.toLocaleString('id-ID')}
              </Text>
            </View>

            {/* Progress Bar with Pill Inset */}
            <View style={[styles.progressBarTrack, { backgroundColor: isDark ? '#1C2346' : '#EEF2FF' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(Math.round(spendingRatio * 100), 100)}%`,
                    backgroundColor:
                      spendingRatio >= 0.9
                        ? theme.accentRose
                        : spendingRatio >= 0.7
                        ? theme.accentAmber
                        : theme.primary,
                  },
                ]}
              />
            </View>

            {/* Sisa Kuota + Persen Row */}
            <View style={styles.spendRowBetween}>
              <Text style={[styles.spendFooterLeft, { color: theme.textMuted }]}>
                Sisa Kuota Jajan:{' '}
                <Text style={[styles.spendRemainingBold, { color: theme.accentEmerald }]}>
                  Rp {remaining.toLocaleString('id-ID')}
                </Text>
              </Text>
              <Text style={[styles.spendPct, { color: theme.textSecondary }]}>
                {Math.round(spendingRatio * 100)}% Dipakai
              </Text>
            </View>

            {/* Reset Info Note Box */}
            <View style={[styles.infoNoteBox, { backgroundColor: isDark ? '#141A2D' : '#F8FAFC', borderColor: theme.border }]}>
              <Ionicons name="information-circle-outline" size={15} color={theme.primary} />
              <Text style={[styles.infoNoteText, { color: theme.textSecondary }]}>
                Batasan jajan reset otomatis setiap pukul 00:00 WIB.
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2. Proteksi & Status PIN — Harmonized Card ── */}
        <View style={[styles.webCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.webCardHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.webCardHeaderLeft}>
              <Text style={[styles.webCardTitle, { color: theme.textPrimary }]}>PROTEKSI & STATUS PIN</Text>
            </View>
            <View style={[styles.statusActiveBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#DCFCE7' }]}>
              <View style={[styles.pulseDot, { backgroundColor: theme.accentEmerald }]} />
              <Text style={[styles.statusActiveText, { color: theme.accentEmerald }]}>Terlindungi</Text>
            </View>
          </View>

          <View style={styles.webCardBody}>
            {/* PIN Transaksi Siswa Row */}
            <TouchableOpacity
              onPress={() => setShowPinSetupModal(true)}
              activeOpacity={0.8}
              style={[styles.protectionRow, { backgroundColor: isDark ? '#141A2D' : '#F8FAFC', borderColor: theme.border }]}
            >
              <View style={styles.protectionInfo}>
                <Text style={[styles.protectionTitle, { color: theme.textPrimary }]}>PIN Transaksi Siswa</Text>
                <Text style={[styles.protectionSub, { color: theme.textMuted }]}>
                  {wallet.hasStudentPin ? 'Otorisasi belanja di kantin (Ketuk untuk ubah)' : 'Belum dibuat (Ketuk untuk pasang)'}
                </Text>
              </View>
              <View style={styles.protectionStatusRow}>
                {wallet.hasStudentPin ? (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color={theme.accentEmerald} />
                    <Text style={[styles.protectionActiveLabel, { color: theme.accentEmerald }]}>Aktif</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="alert-circle" size={16} color="#D97706" />
                    <Text style={[styles.protectionActiveLabel, { color: '#D97706' }]}>Pasang</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Status Kartu E-Money Siswa Row */}
            <View style={[styles.protectionRow, { backgroundColor: isDark ? '#141A2D' : '#F8FAFC', borderColor: theme.border }]}>
              <View style={styles.protectionInfo}>
                <Text style={[styles.protectionTitle, { color: theme.textPrimary }]}>Status Kartu E-Money Siswa</Text>
                <Text style={[styles.protectionSub, { color: theme.textMuted }]}>
                  No. Kartu: <Text style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{wallet.cardNumber}</Text>
                </Text>
              </View>
              <View style={[styles.cardStatusChip, { backgroundColor: wallet.isBlocked ? (isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2') : (isDark ? 'rgba(16,185,129,0.15)' : '#DCFCE7') }]}>
                <View style={[styles.pulseDot, { backgroundColor: wallet.isBlocked ? '#EF4444' : theme.accentEmerald }]} />
                <Text style={[styles.cardStatusChipText, { color: wallet.isBlocked ? '#EF4444' : theme.accentEmerald }]}>
                  {wallet.isBlocked ? 'TERKUNCI' : 'AKTIF'}
                </Text>
              </View>
            </View>

            {/* Action to trigger Top Up modal */}
          </View>
        </View>

        {/* ── 3. Mutasi Transaksi Terakhir — Harmonized Card ── */}
        <View style={[styles.webCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.webCardHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.webCardHeaderLeft}>
              <Text style={[styles.webCardTitle, { color: theme.textPrimary }]}>MUTASI TRANSAKSI TERAKHIR</Text>
            </View>
            <TouchableOpacity onPress={onNavigateToHistory} activeOpacity={0.7}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.primary }}>Lihat Semua →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.webCardBody}>
            {transactions.slice(0, 3).map((tx, idx) => (
              <View
                key={tx.id || idx}
                style={[
                  styles.txRowItem,
                  {
                    borderBottomColor: theme.border,
                    borderBottomWidth: idx < Math.min(transactions.length, 3) - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={[styles.txIconWrap, { backgroundColor: tx.type === 'topup' ? (isDark ? 'rgba(16,185,129,0.15)' : '#DCFCE7') : (isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF') }]}>
                  <Ionicons
                    name={tx.type === 'topup' ? 'arrow-down-circle' : 'cart-outline'}
                    size={18}
                    color={tx.type === 'topup' ? theme.accentEmerald : theme.primary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.txItemTitle, { color: theme.textPrimary }]} numberOfLines={1}>{tx.stall || tx.items}</Text>
                  <Text style={[styles.txItemDate, { color: theme.textMuted }]}>{tx.date}</Text>
                </View>
                <Text
                  style={[
                    styles.txItemAmount,
                    { color: tx.type === 'topup' ? theme.accentEmerald : theme.textPrimary },
                  ]}
                >
                  {tx.type === 'topup' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                </Text>
              </View>
            ))}

            {transactions.length === 0 && (
              <Text style={{ textAlign: 'center', color: theme.textMuted, paddingVertical: 14, fontSize: 13 }}>
                Belum ada transaksi di dompet digital.
              </Text>
            )}
          </View>
        </View>

        {/* ── Security Info Row ────────────────── */}
        <View style={[styles.securityRow, { backgroundColor: isDark ? '#0F1420' : '#F0FDF4', borderColor: isDark ? '#1B2E22' : '#BBF7D0' }]}>
          <Ionicons name="lock-closed-outline" size={14} color="#059669" />
          <Text style={[styles.securityText, { color: isDark ? '#34D399' : '#166534' }]}>
            Transaksi diproteksi enkripsi TLS 256-bit standar perbankan
          </Text>
        </View>
      </View>
    </ScrollView>

      {/* ════════════════════════════════════
          QR CODE MODAL
          ════════════════════════════════════ */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.qrSheet, { backgroundColor: theme.surface }]}>
            {/* Handle pill */}
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

            {/* Title row */}
            <View style={styles.qrTitleRow}>
              <Text style={[styles.qrTitle, { color: theme.textPrimary }]}>
                Bayar via QR Code
              </Text>
              <TouchableOpacity
                onPress={() => setShowQrModal(false)}
                style={[styles.qrCloseBtn, { backgroundColor: isDark ? '#1C243B' : '#F1F5F9' }]}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.qrSub, { color: theme.textSecondary }]}>
              Tunjukkan kode ini ke kasir kantin untuk pembayaran nontunai
            </Text>

            {/* QR + Branding */}
            <LinearGradient
              colors={isDark ? ['#1E2744', '#141A2D'] : ['#EEF2FF', '#FFFFFF']}
              style={styles.qrBox}
            >
              <View style={styles.qrIconWrap}>
                <Ionicons name="qr-code" size={160} color={isDark ? '#E2E8F0' : '#0F172A'} />
              </View>

              {/* Corner accent marks */}
              <View style={[styles.qrCornerTL, { borderColor: theme.primary }]} />
              <View style={[styles.qrCornerTR, { borderColor: theme.primary }]} />
              <View style={[styles.qrCornerBL, { borderColor: theme.primary }]} />
              <View style={[styles.qrCornerBR, { borderColor: theme.primary }]} />
            </LinearGradient>

            {/* User info strip */}
            <View style={[styles.qrUserStrip, { backgroundColor: isDark ? '#141A2D' : '#F8FAFC', borderColor: theme.border }]}>
              <View style={[styles.qrAvatarCircle, { backgroundColor: theme.primary }]}>
                <Ionicons name="person" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.qrUserInfo}>
                <Text style={[styles.qrUserName, { color: theme.textPrimary }]}>
                  {wallet.holderName}
                </Text>
                <Text style={[styles.qrUserNum, { color: theme.textMuted }]}>
                  {wallet.cardNumber}
                </Text>
              </View>
              <View style={[styles.qrBalanceChip, { backgroundColor: isDark ? '#1C243B' : '#EEF2FF' }]}>
                <Text style={[styles.qrBalanceChipText, { color: theme.primary }]}>
                  Rp {wallet.balance.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.qrCloseFullBtn, { backgroundColor: theme.primary }]}
              onPress={() => setShowQrModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.qrCloseBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════
          TOP UP SALDO MODAL (POP UP)
          ════════════════════════════════════ */}
      <Modal
        visible={showTopupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTopupModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowTopupModal(false)}
          />
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            {/* Handle pill */}
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

            {/* Modal Header */}
            <View style={[styles.modalHeaderRow, { borderBottomColor: theme.border }]}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.headerIconBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#DCFCE7' }]}>
                  <Ionicons name="card-outline" size={16} color={theme.accentEmerald} />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                    Top Up Saldo via Midtrans
                  </Text>
                  <Text style={[styles.modalSubTitle, { color: theme.textMuted }]}>
                    Instan & otomatis ke dompet digital
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowTopupModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#1C243B' : '#F1F5F9' }]}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Modal Scrollable Body */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.topupModalBody}>
              {/* Preset Label */}
              <Text style={[styles.inputGroupLabel, { color: theme.textSecondary }]}>
                Pilih Nominal Top-Up Preset:
              </Text>

              {/* 2-Column Preset Grid */}
              <View style={styles.presetGrid}>
                {TOPUP_PRESETS.map((amt) => {
                  const isSelected = !isCustom && selectedTopup === amt;
                  return (
                    <TouchableOpacity
                      key={amt}
                      onPress={() => selectPreset(amt)}
                      activeOpacity={0.8}
                      style={[
                        styles.presetBtn,
                        {
                          borderColor: isSelected ? theme.primary : theme.border,
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(99,102,241,0.16)' : '#EEF2FF')
                            : (isDark ? '#141A2D' : '#FFFFFF'),
                        },
                      ]}
                    >
                      <View style={styles.presetTopRow}>
                        <Text
                          style={[
                            styles.presetAmtText,
                            { color: isSelected ? theme.primary : theme.textPrimary },
                          ]}
                        >
                          Rp {amt.toLocaleString('id-ID')}
                        </Text>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                        ) : (
                          <View style={[styles.presetDotEmpty, { borderColor: theme.border }]} />
                        )}
                      </View>

                      {amt === 50000 && (
                        <View style={[styles.ribbonBadge, { backgroundColor: isDark ? 'rgba(99,102,241,0.25)' : '#EEF2FF' }]}>
                          <Text style={[styles.ribbonText, { color: theme.primary }]}>Populer</Text>
                        </View>
                      )}
                      {amt === 100000 && (
                        <View style={[styles.ribbonBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.25)' : '#DCFCE7' }]}>
                          <Text style={[styles.ribbonText, { color: theme.accentEmerald }]}>Hemat</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Amount Input */}
              <View style={styles.customInputSection}>
                <Text style={[styles.inputGroupLabel, { color: theme.textSecondary }]}>
                  Atau Masukkan Nominal Custom (Min. Rp 10.000):
                </Text>
                <View
                  style={[
                    styles.customInputWrap,
                    {
                      borderColor: isCustom ? theme.primary : theme.border,
                      backgroundColor: isDark ? '#141A2D' : '#F8FAFC',
                    },
                  ]}
                >
                  <Text style={[styles.rpPrefix, { color: isCustom ? theme.primary : theme.textMuted }]}>Rp</Text>
                  <TextInput
                    value={customAmount}
                    onChangeText={onCustomChange}
                    placeholder="50.000"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    style={[styles.customTextInput, { color: theme.textPrimary }]}
                  />
                  {isCustom && customAmount.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setCustomAmount('');
                        setIsCustom(false);
                        setSelectedTopup(50000);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Harmonized Gradient CTA Button */}
              <TouchableOpacity
                onPress={handleTopup}
                disabled={isSubmittingTopup}
                activeOpacity={0.88}
                style={[
                  styles.midtransCTAWrapper,
                  { shadowColor: theme.primary, opacity: isSubmittingTopup ? 0.7 : 1 },
                ]}
              >
                <LinearGradient
                  colors={theme.primaryGradient || ['#4F46E5', '#6366F1', '#818CF8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.midtransCTA}
                >
                  {isSubmittingTopup ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.midtransCTAText}>
                        Lanjutkan ke Pembayaran Midtrans (Rp {currentTopupAmount.toLocaleString('id-ID')})
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Channels Strip */}
              <View style={styles.channelRow}>
                <Ionicons name="shield-checkmark" size={13} color={theme.accentEmerald} />
                <Text style={[styles.channelText, { color: theme.textMuted }]}>
                  QRIS • GoPay • ShopeePay • VA BCA / Mandiri / BRI
                </Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════
          FULL-SCREEN PENDING PAYMENT SCREEN (SHOPEEPAY / DANA / M-BANKING STYLE)
          ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showPendingModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          Alert.alert(
            'Tutup Halaman?',
            'Tagihan pembayaran ini tetap tersimpan dan dapat dilanjutkan kapan saja.',
            [
              { text: 'Lanjut Bayar', style: 'cancel' },
              { text: 'Tutup', onPress: () => setShowPendingModal(false) },
            ]
          );
        }}
      >
        <View style={{ flex: 1, backgroundColor: isDark ? '#0B0F19' : '#F8FAFC' }}>
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

          {/* Top Bar Header */}
          <View
            style={{
              paddingTop: Math.max(insets.top || 0, Platform.OS === 'android' ? 36 : 44),
              paddingHorizontal: 16,
              paddingBottom: 12,
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderBottomWidth: 1,
              borderBottomColor: isDark ? '#1F2937' : '#E2E8F0',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Tinggalkan Halaman?',
                  'Pesanan top up Anda tetap aktif dan dapat diverifikasi kapan saja.',
                  [
                    { text: 'Tetap di Sini', style: 'cancel' },
                    { text: 'Tutup Halaman', onPress: () => setShowPendingModal(false) },
                  ]
                );
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={theme.textPrimary} />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
                Menunggu Pembayaran
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' }} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#D97706' }}>
                  Auto-Sync Real-Time
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleCheckPaymentStatus(false)}
              disabled={isCheckingStatus}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              {isCheckingStatus ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Ionicons name="refresh" size={18} color={theme.primary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Scrollable Body */}
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom || 0, 16) + 140,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Countdown Expiry Banner */}
            <LinearGradient
              colors={isDark ? ['#78350F', '#451A03'] : ['#FEF3C7', '#FDE68A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                padding: 14,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isDark ? '#B45309' : '#FCD34D',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <Ionicons name="hourglass-outline" size={15} color={isDark ? '#FDE68A' : '#92400E'} />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? '#FDE68A' : '#92400E' }}>
                    Selesaikan Pembayaran:
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: isDark ? '#FCD34D' : '#78350F', lineHeight: 15 }}>
                  Batas waktu tagihan berlaku hingga 24 jam.
                </Text>
              </View>

              {/* Countdown Digits Box */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <View style={{ backgroundColor: isDark ? '#181E2E' : '#FFFFFF', paddingHorizontal: 6, paddingVertical: 5, borderRadius: 8, minWidth: 28, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: isDark ? '#F59E0B' : '#B45309', fontFamily: 'monospace' }}>
                    {formatCountdown(countdownSeconds).hours}
                  </Text>
                  <Text style={{ fontSize: 7, fontWeight: '700', color: theme.textMuted }}>JAM</Text>
                </View>
                <Text style={{ fontWeight: '900', color: isDark ? '#FDE68A' : '#92400E' }}>:</Text>
                <View style={{ backgroundColor: isDark ? '#181E2E' : '#FFFFFF', paddingHorizontal: 6, paddingVertical: 5, borderRadius: 8, minWidth: 28, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: isDark ? '#F59E0B' : '#B45309', fontFamily: 'monospace' }}>
                    {formatCountdown(countdownSeconds).minutes}
                  </Text>
                  <Text style={{ fontSize: 7, fontWeight: '700', color: theme.textMuted }}>MNT</Text>
                </View>
                <Text style={{ fontWeight: '900', color: isDark ? '#FDE68A' : '#92400E' }}>:</Text>
                <View style={{ backgroundColor: isDark ? '#181E2E' : '#FFFFFF', paddingHorizontal: 6, paddingVertical: 5, borderRadius: 8, minWidth: 28, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: isDark ? '#F59E0B' : '#B45309', fontFamily: 'monospace' }}>
                    {formatCountdown(countdownSeconds).seconds}
                  </Text>
                  <Text style={{ fontSize: 7, fontWeight: '700', color: theme.textMuted }}>DTK</Text>
                </View>
              </View>
            </LinearGradient>

            {/* 2. Hero Total Tagihan Card (Gaya ShopeePay / DANA) */}
            <View
              style={{
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderRadius: 24,
                padding: 18,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isDark ? '#1F2937' : '#E2E8F0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.05,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              {/* Merchant Title */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: isDark ? '#1F2937' : '#F1F5F9' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#1C2E5A', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="wallet" size={18} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary }}>
                      Top Up Dompet Digital Siswa
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      INOBEL PEDAGOGI
                    </Text>
                  </View>
                </View>

                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#D97706' }} />
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#D97706' }}>
                    Belum Bayar
                  </Text>
                </View>
              </View>

              {/* Big Amount */}
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5, marginBottom: 2 }}>
                  TOTAL PEMBAYARAN
                </Text>
                <Text style={{ fontSize: 32, fontWeight: '900', color: theme.textPrimary, letterSpacing: 0.5, marginBottom: 10 }}>
                  {pendingPayment?.formattedAmount || `Rp ${pendingPayment?.amount?.toLocaleString('id-ID')}`}
                </Text>

                {/* Copy Amount Button */}
                <TouchableOpacity
                  onPress={() => copyToClipboard(String(pendingPayment?.amount || 0), 'amount')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                    borderWidth: 1,
                    borderColor: isDark ? '#374151' : '#E2E8F0',
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={copiedField === 'amount' ? 'checkmark-circle' : 'copy-outline'}
                    size={13}
                    color={copiedField === 'amount' ? '#10B981' : theme.primary}
                  />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: copiedField === 'amount' ? '#10B981' : theme.primary }}>
                    {copiedField === 'amount' ? 'Nominal Tersalin!' : 'Salin Nominal Tagihan'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Detail Box */}
              <View style={{ backgroundColor: isDark ? '#172033' : '#F8FAFC', borderRadius: 16, padding: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Nomor Pesanan (Order ID)</Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(pendingPayment?.orderId, 'order')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: theme.textPrimary, fontFamily: 'monospace' }}>
                      {pendingPayment?.orderId}
                    </Text>
                    <Ionicons
                      name={copiedField === 'order' ? 'checkmark-circle' : 'copy-outline'}
                      size={13}
                      color={copiedField === 'order' ? '#10B981' : theme.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Waktu Pemesanan</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textPrimary }}>
                    {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Gateway Pembayaran</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB' }}>
                    Midtrans Snap Gateway
                  </Text>
                </View>
              </View>
            </View>

            {/* 3. Hero CTA: Open Midtrans Payment Portal */}
            <LinearGradient
              colors={['#1C2E5A', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 22,
                padding: 18,
                marginBottom: 16,
                shadowColor: '#2563EB',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="card" size={17} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#FFFFFF' }}>
                  Lanjutkan Pembayaran
                </Text>
              </View>

              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 17, marginBottom: 14 }}>
                Buka portal Midtrans untuk memilih metode QRIS (GoPay/ShopeePay/DANA) atau Virtual Account Bank (BCA, Mandiri, BNI, BRI).
              </Text>

              <TouchableOpacity
                onPress={() => {
                  if (pendingPayment?.redirectUrl) {
                    Linking.openURL(pendingPayment.redirectUrl);
                  }
                }}
                style={{
                  backgroundColor: '#FFFFFF',
                  paddingVertical: 13,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="open-outline" size={17} color="#1C2E5A" />
                <Text style={{ color: '#1C2E5A', fontSize: 14, fontWeight: '900' }}>
                  BUKA HALAMAN MIDTRANS
                </Text>
              </TouchableOpacity>
            </LinearGradient>

            {/* 4. Supported Payment Channels */}
            <View
              style={{
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderRadius: 20,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isDark ? '#1F2937' : '#E2E8F0',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary, marginBottom: 10 }}>
                Metode Pembayaran Tersedia
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                {[
                  { label: 'QRIS (Semua E-Wallet / M-Banking)', icon: 'qr-code-outline', color: '#EF4444' },
                  { label: 'GoPay & ShopeePay', icon: 'phone-portrait-outline', color: '#10B981' },
                  { label: 'BCA Virtual Account', icon: 'business-outline', color: '#3B82F6' },
                  { label: 'Mandiri / BNI / BRI VA', icon: 'card-outline', color: '#6366F1' },
                  { label: 'Indomaret / Alfamart', icon: 'storefront-outline', color: '#F59E0B' },
                ].map((ch, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: 10,
                      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                      borderWidth: 1,
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                    }}
                  >
                    <Ionicons name={ch.icon} size={13} color={ch.color} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textPrimary }}>
                      {ch.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 5. Cara Pembayaran Singkat */}
            <View
              style={{
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: isDark ? '#1F2937' : '#E2E8F0',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary, marginBottom: 12 }}>
                Petunjuk Pembayaran:
              </Text>

              {[
                { step: '1', title: 'Buka Midtrans', desc: 'Tekan tombol "BUKA HALAMAN MIDTRANS" di atas.' },
                { step: '2', title: 'Pilih Metode Pembayaran', desc: 'Pilih QRIS untuk scan instan, atau Virtual Account bank Anda.' },
                { step: '3', title: 'Selesaikan Tagihan', desc: 'Lakukan pembayaran di aplikasi m-banking atau e-wallet Anda.' },
                { step: '4', title: 'Sinkronkan Saldo', desc: 'Kembali ke aplikasi ini lalu tekan tombol hijau "Sudah Selesai Bayar di Midtrans".' },
              ].map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', gap: 10, marginBottom: idx === 3 ? 0 : 12 }}>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: isDark ? '#1E293B' : '#E0E7FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '900', color: theme.primary }}>{item.step}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: theme.textPrimary, marginBottom: 1 }}>
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted, lineHeight: 15 }}>
                      {item.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Sticky Bottom Action Bar */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: isDark ? '#1F2937' : '#E2E8F0',
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom || 0, 14),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: isDark ? 0.3 : 0.08,
              shadowRadius: 10,
              elevation: 8,
              gap: 8,
            }}
          >
            {/* Primary Action: Sudah Selesai Bayar di Midtrans */}
            <TouchableOpacity
              onPress={() => handleCheckPaymentStatus(true)}
              disabled={isCheckingStatus}
              style={{
                backgroundColor: '#10B981',
                borderRadius: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 3,
              }}
              activeOpacity={0.85}
            >
              {isCheckingStatus ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={19} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>
                    Sudah Selesai Bayar di Midtrans
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Secondary Actions Row */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => handleCheckPaymentStatus(false)}
                disabled={isCheckingStatus}
                style={{
                  flex: 1,
                  backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                  borderRadius: 12,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: isDark ? '#374151' : '#E2E8F0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={15} color={theme.primary} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primary }}>
                  Cek Status Otomatis
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (pendingPayment?.redirectUrl) {
                    Linking.openURL(pendingPayment.redirectUrl);
                  }
                }}
                style={{
                  flex: 1,
                  backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                  borderRadius: 12,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: isDark ? '#374151' : '#E2E8F0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="open-outline" size={15} color={theme.textPrimary} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textPrimary }}>
                  Buka Midtrans
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════
          SETUP / GANTI PIN MODAL
          ════════════════════════════════════ */}
      {/* ════════════════════════════════════
          SETUP / GANTI PIN (MODERN PIN SHEET)
          ════════════════════════════════════ */}
      <ModernPinSheet
        visible={showPinSetupModal}
        onClose={() => setShowPinSetupModal(false)}
        mode="setup"
        title={wallet.hasStudentPin ? 'Ubah PIN Transaksi' : 'Pasang PIN Transaksi'}
        onComplete={async (pin, confirmPin) => {
          const res = await setTransactionPin(pin, confirmPin);
          return res;
        }}
        onSuccessClose={() => {
          setShowPinSetupModal(false);
          refreshWallet();
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ─── Hero Area ───────────────────────────────────────────────────────────
  heroArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  card: {
    borderRadius: 26,
    padding: 22,
    height: 190,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  cardDecorCircle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -50,
    right: -30,
  },
  cardDecorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLogoBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBrandName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardBrandSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simChip: {
    width: 38,
    height: 27,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(253,211,77,0.6)',
    padding: 3,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  chipGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipCell: {
    width: '50%',
    height: '50%',
    opacity: 0.55,
  },
  chipCellBR: {
    borderRightWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: 'rgba(120,53,15,0.7)',
  },
  chipCellB: {
    borderBottomWidth: 0.8,
    borderColor: 'rgba(120,53,15,0.7)',
  },
  chipCellR: {
    borderRightWidth: 0.8,
    borderColor: 'rgba(120,53,15,0.7)',
  },
  cardMid: {
    marginBottom: 2,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardNumLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardNum: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  cardHolderRight: {
    alignItems: 'flex-end',
  },
  cardHolderLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardHolderVal: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  holderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  holderNameText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ─── Body / Scroll ───────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },

  // ─── Quick Actions ──────────────────────────────────────────────────
  qaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  qaItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  qaIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  qaLabel: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ─── Web-Identical Card Container ──────────────────────────────────────
  webCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  webCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 13,
    marginBottom: 14,
    borderBottomWidth: 1,
  },
  webCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webCardTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  webCardLimitText: {
    fontSize: 11,
    fontWeight: '800',
  },
  webBadgeSubtle: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  webBadgeSubtleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  webCardBody: {
    gap: 12,
  },

  // ─── Pemakaian Hari Ini Styles ──────────────────────────────────────────
  spendRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spendRowLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  spendRowVal: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  progressBarTrack: {
    height: 14,
    borderRadius: 10,
    padding: 2.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  spendFooterLeft: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  spendRemainingBold: {
    fontWeight: '800',
    color: '#059669',
  },
  spendPct: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 2,
  },
  infoNoteText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    lineHeight: 15,
  },

  // ─── Top Up via Midtrans Styles ────────────────────────────────────────
  inputGroupLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  presetBtn: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    minHeight: 58,
  },
  presetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  presetAmtText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  presetDotEmpty: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  ribbonBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  ribbonText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  customInputSection: {
    marginTop: 2,
    gap: 6,
  },
  customInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 46,
    gap: 6,
  },
  rpPrefix: {
    fontSize: 13,
    fontWeight: '800',
  },
  customTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    paddingVertical: 0,
  },
  midtransCTAWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  midtransCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  midtransCTAText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: -0.1,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 4,
  },
  channelText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ─── Proteksi & Status PIN Styles ──────────────────────────────────────
  statusActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  statusActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  protectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  protectionInfo: {
    flex: 1,
    gap: 2,
  },
  protectionTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  protectionSub: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  protectionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  protectionActiveLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  cardStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardStatusChipText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#047857',
  },
  openTopupCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  openTopupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  openTopupTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  openTopupSub: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },

  // ─── Modal Sheet (Pop Up) ────────────────────────────────────────────────
  modalSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  modalSubTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topupModalBody: {
    gap: 12,
    paddingBottom: 20,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },

  // ─── QR Modal ────────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  qrSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 18,
  },
  qrTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  qrCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  qrBox: {
    width: SCREEN_WIDTH - 80,
    height: SCREEN_WIDTH - 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  qrIconWrap: {
    padding: 16,
  },
  qrCornerTL: {
    position: 'absolute', top: 12, left: 12,
    width: 20, height: 20,
    borderTopWidth: 3, borderLeftWidth: 3,
    borderRadius: 4,
  },
  qrCornerTR: {
    position: 'absolute', top: 12, right: 12,
    width: 20, height: 20,
    borderTopWidth: 3, borderRightWidth: 3,
    borderRadius: 4,
  },
  qrCornerBL: {
    position: 'absolute', bottom: 12, left: 12,
    width: 20, height: 20,
    borderBottomWidth: 3, borderLeftWidth: 3,
    borderRadius: 4,
  },
  qrCornerBR: {
    position: 'absolute', bottom: 12, right: 12,
    width: 20, height: 20,
    borderBottomWidth: 3, borderRightWidth: 3,
    borderRadius: 4,
  },
  qrUserStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  qrAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrUserInfo: {
    flex: 1,
  },
  qrUserName: {
    fontSize: 13,
    fontWeight: '800',
  },
  qrUserNum: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 1,
  },
  qrBalanceChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  qrBalanceChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  qrCloseFullBtn: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  qrCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // ─── Live Wallet Extensions ──────────────────────────────────────────────
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  blockedBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  blockedBannerSub: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 2,
  },

  pinSetupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  pinSetupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  pinSetupSub: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
  },
  pinSetupBtnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FDE68A',
    borderRadius: 8,
    gap: 2,
  },
  pinSetupBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },

  txRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  txItemDate: {
    fontSize: 11,
    marginTop: 2,
  },
  txItemAmount: {
    fontSize: 13,
    fontWeight: '800',
  },

  pendingSheet: {
    width: '90%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  pendingIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  pendingSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  pendingOrderBox: {
    alignSelf: 'stretch',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingOrderLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  pendingOrderVal: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  pendingActionBtn: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  pendingActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pendingCheckBtn: {
    alignSelf: 'stretch',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pendingCheckBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  pinInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    marginTop: 6,
    gap: 10,
  },
  pinTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});

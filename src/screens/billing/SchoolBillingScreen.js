import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
  Share,
  Platform,
  Alert,
  Image,
  Animated,
  PanResponder,
  Easing,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// DATA METADATA & STATIC MOCK DATA (GAYA EDUPAY MODERN)
// ─────────────────────────────────────────────────────────────────────────────
const STUDENT_DATA = {
  name: 'M. Rayhan Pratama',
  fullName: 'Muhammad Rayhan Pratama',
  nisn: '0084729103',
  nisnAlt: '0064821940',
  className: 'XII MIPA 1',
  classAlt: 'Kelas XI IPA 2',
  schoolName: 'SMA Nusantara 01 Jakarta',
  academicYear: '2024/2025',
  semester: 'Semester Ganjil TA 2024/2025',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
};

const INITIAL_BILLS_DATA = [
  {
    id: 'bill-spp-nov',
    title: 'SPP Bulan November 2024',
    subtitle: 'Wajib Bulanan • Tenggat 10 Nov 2024',
    subDetails: 'Biaya Pembelajaran Reguler',
    amount: 450000,
    checkoutAmount: 450000,
    isMandatory: true,
    isSelected: true,
    qty: 1,
    iconName: 'calendar-outline',
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
    category: 'spp',
    categoryLabel: 'SPP & Bulanan',
    dueDate: '10 Nov 2024',
    status: 'unpaid',
  },
  {
    id: 'bill-spp-des',
    title: 'SPP Bulan Desember 2024',
    subtitle: 'Wajib Bulanan • Tenggat 10 Des 2024',
    subDetails: 'Biaya Pembelajaran Reguler',
    amount: 450000,
    checkoutAmount: 450000,
    isMandatory: true,
    isSelected: false,
    qty: 1,
    iconName: 'calendar-outline',
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
    category: 'spp',
    categoryLabel: 'SPP & Bulanan',
    dueDate: '10 Des 2024',
    status: 'unpaid',
  },
  {
    id: 'bill-uas-ganjil',
    title: 'Ujian Akhir Semester (UAS)',
    subtitle: 'UAS Ganjil • Tenggat 25 Nov 2024',
    subDetails: 'Praktikum & CBT System',
    amount: 700000,
    checkoutAmount: 700000,
    isMandatory: true,
    isSelected: false,
    qty: 1,
    iconName: 'document-text-outline',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    category: 'ujian',
    categoryLabel: 'Ujian & Akademik',
    dueDate: '25 Nov 2024',
    status: 'unpaid',
  },
];

const PAYMENT_LOGOS = {
  bca_va: require('../../../assets/payment/bca-bank-central-asia-logo-svgrepo-com.png'),
  mandiri_va: require('../../../assets/payment/Bank Mandiri Logo - Colored - zonalogo.com.png'),
  bni_va: require('../../../assets/payment/Bank Negara Indonesia (BNI) Logo - Colored - zonalogo.com.png'),
  bri_va: require('../../../assets/payment/Bank Rakyat Indonesia (BRI) Logo - Horizontal Without Full Name Colored - zonalogo.com.png'),
  bsi_va: require('../../../assets/payment/Bank BSI Logo - Colored - zonalogo.com.png'),
  permata_va: require('../../../assets/payment/Bank Permata Logo - Colored - zonalogo.com.png'),
  cimb_va: require('../../../assets/payment/Bank CIMB Niaga Logo - Colored - zonalogo.com.png'),
  qris: require('../../../assets/payment/QRIS Logo - Black - zonalogo.com.png'),
  gopay: require('../../../assets/payment/GoPay Logo - Colored - zonalogo.com.png'),
  ovo: require('../../../assets/payment/OVO Logo - Colored - zonalogo.com.png'),
  dana: require('../../../assets/payment/Dana Logo - Colored - zonalogo.com.png'),
  shopeepay: require('../../../assets/payment/ShopeePay Logo - Colored - zonalogo.com.png'),
  indomaret: require('../../../assets/payment/Indomaret Logo - Colored - zonalogo.com.png'),
  alfamart: require('../../../assets/payment/Alfamart Logo - Colored - zonalogo.com.png'),
};

const ALL_BILLS_CATEGORIES = [
  { id: 'all', label: 'Semua (12)' },
  { id: 'spp', label: 'SPP & Bulanan (5)' },
  { id: 'ujian', label: 'Ujian & CBT (2)' },
  { id: 'buku', label: 'Buku & Modul (2)' },
  { id: 'kegiatan', label: 'Kegiatan Siswa (2)' },
  { id: 'sarana', label: 'Seragam & Sarana (1)' },
];

const ALL_STUDENT_BILLS_DATA = [
  // ─── 1. SPP & BIAYA BULANAN ──────────────────────────────────────
  {
    id: 'bill-spp-nov',
    title: 'SPP Bulan November 2024',
    subtitle: 'Wajib Bulanan • Tenggat 10 Nov 2024',
    amount: 450000,
    category: 'spp',
    categoryLabel: 'SPP & Bulanan',
    dueDate: '10 Nov 2024',
    status: 'unpaid',
    iconName: 'calendar-outline',
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
  },
  {
    id: 'bill-spp-des',
    title: 'SPP Bulan Desember 2024',
    subtitle: 'Wajib Bulanan • Tenggat 10 Des 2024',
    amount: 450000,
    category: 'spp',
    categoryLabel: 'SPP & Bulanan',
    dueDate: '10 Des 2024',
    status: 'unpaid',
    iconName: 'calendar-outline',
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
  },
  {
    id: 'bill-spp-okt',
    title: 'SPP Bulan Oktober 2024',
    subtitle: 'Wajib Bulanan • Lunas 08 Okt 2024',
    amount: 450000,
    category: 'spp',
    categoryLabel: 'SPP & Bulanan',
    dueDate: '10 Okt 2024',
    status: 'paid',
    paidAt: '08 Okt 2024, 10:15 WIB',
    iconName: 'calendar-outline',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    invoice: {
      invoiceNo: 'INV/20241008/SPP-X10/4821',
      paidAt: '08 Okt 2024, 10:15 WIB',
      paymentMethod: 'BCA Virtual Account',
      paymentLogo: PAYMENT_LOGOS.bca_va,
      transactionId: 'EDP-TRX-20241008-8831',
      baseAmount: 450000,
      adminFee: 2500,
      totalAmount: 452500,
    },
  },
  {
    id: 'bill-spp-sep',
    title: 'SPP Bulan September 2024',
    subtitle: 'Wajib Bulanan • Lunas 05 Sep 2024',
    amount: 450000,
    category: 'spp',
    categoryLabel: 'SPP & Bulanan',
    dueDate: '10 Sep 2024',
    status: 'paid',
    paidAt: '05 Sep 2024, 14:22 WIB',
    iconName: 'calendar-outline',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    invoice: {
      invoiceNo: 'INV/20240905/SPP-X09/3910',
      paidAt: '05 Sep 2024, 14:22 WIB',
      paymentMethod: 'Bank Mandiri Virtual Account',
      paymentLogo: PAYMENT_LOGOS.mandiri_va,
      transactionId: 'EDP-TRX-20240905-1940',
      baseAmount: 450000,
      adminFee: 2500,
      totalAmount: 452500,
    },
  },
  {
    id: 'bill-spp-agu',
    title: 'SPP Bulan Agustus 2024',
    subtitle: 'Wajib Bulanan • Lunas 09 Agu 2024',
    amount: 450000,
    category: 'spp',
    categoryLabel: 'SPP & Bulanan',
    dueDate: '10 Agu 2024',
    status: 'paid',
    paidAt: '09 Agu 2024, 09:30 WIB',
    iconName: 'calendar-outline',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    invoice: {
      invoiceNo: 'INV/20240809/SPP-X08/1129',
      paidAt: '09 Agu 2024, 09:30 WIB',
      paymentMethod: 'QRIS Dinamis Instan',
      paymentLogo: PAYMENT_LOGOS.qris,
      transactionId: 'EDP-TRX-20240809-5512',
      baseAmount: 450000,
      adminFee: 1000,
      totalAmount: 451000,
    },
  },

  // ─── 2. UJIAN & AKADEMIK ─────────────────────────────────────────
  {
    id: 'bill-uas-ganjil',
    title: 'Ujian Akhir Semester (UAS)',
    subtitle: 'UAS Ganjil • Tenggat 25 Nov 2024',
    amount: 700000,
    category: 'ujian',
    categoryLabel: 'Ujian & Akademik',
    dueDate: '25 Nov 2024',
    status: 'unpaid',
    iconName: 'document-text-outline',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    id: 'bill-uts-ganjil',
    title: 'Ujian Tengah Semester (UTS)',
    subtitle: 'UTS Ganjil • Lunas 20 Sep 2024',
    amount: 350000,
    category: 'ujian',
    categoryLabel: 'Ujian & Akademik',
    dueDate: '20 Sep 2024',
    status: 'paid',
    paidAt: '20 Sep 2024, 11:05 WIB',
    iconName: 'document-text-outline',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    invoice: {
      invoiceNo: 'INV/20240920/UTS-01/5921',
      paidAt: '20 Sep 2024, 11:05 WIB',
      paymentMethod: 'BCA Virtual Account',
      paymentLogo: PAYMENT_LOGOS.bca_va,
      transactionId: 'EDP-TRX-20240920-7731',
      baseAmount: 350000,
      adminFee: 2500,
      totalAmount: 352500,
    },
  },

  // ─── 3. BUKU & MODUL BELAJAR ─────────────────────────────────────
  {
    id: 'bill-modul-buku',
    title: 'Buku Modul & Praktikum Terapan',
    subtitle: 'Fisika & Kimia • Tenggat 15 Des 2024',
    amount: 150000,
    category: 'buku',
    categoryLabel: 'Buku & Modul',
    dueDate: '15 Des 2024',
    status: 'unpaid',
    iconName: 'book-outline',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    id: 'bill-buku-merdeka',
    title: 'Paket Buku Kurikulum Merdeka',
    subtitle: 'Semester Ganjil • Lunas 15 Jul 2024',
    amount: 380000,
    category: 'buku',
    categoryLabel: 'Buku & Modul',
    dueDate: '15 Jul 2024',
    status: 'paid',
    paidAt: '15 Jul 2024, 08:45 WIB',
    iconName: 'book-outline',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    invoice: {
      invoiceNo: 'INV/20240715/BKP-78/9012',
      paidAt: '15 Jul 2024, 08:45 WIB',
      paymentMethod: 'Bank Negara Indonesia (BNI) VA',
      paymentLogo: PAYMENT_LOGOS.bni_va,
      transactionId: 'EDP-TRX-20240715-0921',
      baseAmount: 380000,
      adminFee: 2500,
      totalAmount: 382500,
    },
  },

  // ─── 4. KEGIATAN & EKSTRAKURIKULER ───────────────────────────────
  {
    id: 'bill-studi-lapangan',
    title: 'Study Tour & Kunjungan Industri',
    subtitle: 'Kunjungan Edukatif • Tenggat 20 Des 2024',
    amount: 650000,
    category: 'kegiatan',
    categoryLabel: 'Kegiatan Siswa',
    dueDate: '20 Des 2024',
    status: 'unpaid',
    iconName: 'compass-outline',
    iconBg: '#FDF4FF',
    iconColor: '#A855F7',
  },
  {
    id: 'bill-ekskul-pramuka',
    title: 'Iuran Pramuka & Kemah LDKS',
    subtitle: 'Semester Ganjil • Lunas 12 Agu 2024',
    amount: 200000,
    category: 'kegiatan',
    categoryLabel: 'Kegiatan Siswa',
    dueDate: '12 Agu 2024',
    status: 'paid',
    paidAt: '12 Agu 2024, 16:10 WIB',
    iconName: 'flag-outline',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    invoice: {
      invoiceNo: 'INV/20240812/EKS-02/3381',
      paidAt: '12 Agu 2024, 16:10 WIB',
      paymentMethod: 'GoPay',
      paymentLogo: PAYMENT_LOGOS.gopay,
      transactionId: 'EDP-TRX-20240812-4411',
      baseAmount: 200000,
      adminFee: 1500,
      totalAmount: 201500,
    },
  },

  // ─── 5. SERAGAM & SARANA ─────────────────────────────────────────
  {
    id: 'bill-seragam-lengkap',
    title: 'Paket Seragam Lengkap & Batik Siswa',
    subtitle: '3 Stel Seragam • Lunas 10 Jul 2024',
    amount: 550000,
    category: 'sarana',
    categoryLabel: 'Seragam & Sarana',
    dueDate: '10 Jul 2024',
    status: 'paid',
    paidAt: '10 Jul 2024, 13:20 WIB',
    iconName: 'shirt-outline',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    invoice: {
      invoiceNo: 'INV/20240710/SRG-01/1004',
      paidAt: '10 Jul 2024, 13:20 WIB',
      paymentMethod: 'BCA Virtual Account',
      paymentLogo: PAYMENT_LOGOS.bca_va,
      transactionId: 'EDP-TRX-20240710-6602',
      baseAmount: 550000,
      adminFee: 2500,
      totalAmount: 552500,
    },
  },
];

const ALL_PAYMENT_METHODS = [
  // ─── 1. VIRTUAL ACCOUNT ─────────────────────────────────────────
  {
    id: 'bca_va',
    category: 'Virtual Account',
    code: 'BCA',
    name: 'BCA Virtual Account',
    shortName: 'BCA',
    desc: 'Transfer via m-BCA, KlikBCA & ATM BCA (Otomatis 24 Jam)',
    logo: PAYMENT_LOGOS.bca_va,
    vaNumber: '8801 2008 4729 1034',
    accountHolder: 'MUHAMMAD RAYHAN',
    timeLimit: '23 Jam 59 Menit',
    fee: 2500,
  },
  {
    id: 'mandiri_va',
    category: 'Virtual Account',
    code: 'Mandiri',
    name: 'Mandiri Virtual Account',
    shortName: 'Mandiri',
    desc: 'Transfer via Livin\' by Mandiri, ATM & Internet Banking',
    logo: PAYMENT_LOGOS.mandiri_va,
    vaNumber: '8920 1008 4729 5512',
    accountHolder: 'MUHAMMAD RAYHAN',
    timeLimit: '23 Jam 59 Menit',
    fee: 2500,
  },
  {
    id: 'bni_va',
    category: 'Virtual Account',
    code: 'BNI',
    name: 'BNI Virtual Account',
    shortName: 'BNI',
    desc: 'Transfer via BNI Mobile Banking, SMS Banking & ATM',
    logo: PAYMENT_LOGOS.bni_va,
    vaNumber: '8277 3008 4729 9901',
    accountHolder: 'MUHAMMAD RAYHAN',
    timeLimit: '23 Jam 59 Menit',
    fee: 2500,
  },
  {
    id: 'bri_va',
    category: 'Virtual Account',
    code: 'BRI',
    name: 'BRI Virtual Account (BRIVA)',
    shortName: 'BRIVA',
    desc: 'Transfer via BRImo, Internet Banking BRI & ATM BRI',
    logo: PAYMENT_LOGOS.bri_va,
    vaNumber: '7721 0008 4729 4410',
    accountHolder: 'MUHAMMAD RAYHAN',
    timeLimit: '23 Jam 59 Menit',
    fee: 2500,
  },
  {
    id: 'bsi_va',
    category: 'Virtual Account',
    code: 'BSI',
    name: 'BSI Hasanah Virtual Account',
    shortName: 'BSI',
    desc: 'Transfer via BSI Mobile, Net Banking & ATM Syariah',
    logo: PAYMENT_LOGOS.bsi_va,
    vaNumber: '4110 5008 4729 2209',
    accountHolder: 'MUHAMMAD RAYHAN',
    timeLimit: '23 Jam 59 Menit',
    fee: 2000,
  },
  {
    id: 'permata_va',
    category: 'Virtual Account',
    code: 'Permata',
    name: 'Permata Virtual Account',
    shortName: 'Permata',
    desc: 'Transfer via PermataMobile X, PermataNet & ATM Permata',
    logo: PAYMENT_LOGOS.permata_va,
    vaNumber: '8528 8008 4729 1133',
    accountHolder: 'MUHAMMAD RAYHAN',
    timeLimit: '23 Jam 59 Menit',
    fee: 2500,
  },
  {
    id: 'cimb_va',
    category: 'Virtual Account',
    code: 'CIMB',
    name: 'CIMB Niaga Virtual Account',
    shortName: 'CIMB',
    desc: 'Transfer via OCTO Mobile, OCTO Clicks & ATM CIMB',
    logo: PAYMENT_LOGOS.cimb_va,
    vaNumber: '5120 7008 4729 8831',
    accountHolder: 'MUHAMMAD RAYHAN',
    timeLimit: '23 Jam 59 Menit',
    fee: 2500,
  },

  // ─── 2. E-WALLET & QRIS ──────────────────────────────────────────
  {
    id: 'qris',
    category: 'E-Wallet & QRIS',
    code: 'QRIS',
    name: 'QRIS Dinamis Instan',
    shortName: 'QRIS',
    desc: 'Scan dari semua aplikasi perbankan & e-wallet nasional',
    logo: PAYMENT_LOGOS.qris,
    vaNumber: 'NMD-9938-2024-8841',
    accountHolder: 'SMA NUSANTARA 01',
    timeLimit: '15 Menit',
    fee: 1000,
  },
  {
    id: 'gopay',
    category: 'E-Wallet & QRIS',
    code: 'GoPay',
    name: 'GoPay',
    shortName: 'GoPay',
    desc: 'Bayar instan terhubung otomatis ke aplikasi Gojek / GoPay',
    logo: PAYMENT_LOGOS.gopay,
    vaNumber: '0812-8841-3319',
    accountHolder: 'MUHAMMAD RAYHAN',
    timeLimit: '15 Menit',
    fee: 1500,
  },
  {
    id: 'ovo',
    category: 'E-Wallet & QRIS',
    code: 'OVO',
    name: 'OVO Cash',
    shortName: 'OVO',
    desc: 'Konfirmasi push notification langsung di aplikasi OVO',
    logo: PAYMENT_LOGOS.ovo,
    vaNumber: '0812-8841-3319',
    accountHolder: 'MUHAMMAD RAYHAN',
    timeLimit: '15 Menit',
    fee: 1500,
  },
  {
    id: 'dana',
    category: 'E-Wallet & QRIS',
    code: 'DANA',
    name: 'DANA Dompet Digital',
    shortName: 'DANA',
    desc: 'Pembayaran cepat dan aman dengan saldo akun DANA',
    logo: PAYMENT_LOGOS.dana,
    vaNumber: '0812-8841-3319',
    accountHolder: 'MUHAMMAD RAYHAN',
    timeLimit: '15 Menit',
    fee: 1500,
  },
  {
    id: 'shopeepay',
    category: 'E-Wallet & QRIS',
    code: 'ShopeePay',
    name: 'ShopeePay Instant',
    shortName: 'ShopeePay',
    desc: 'Bayar mudah dan terhubung langsung ke aplikasi Shopee',
    logo: PAYMENT_LOGOS.shopeepay,
    vaNumber: '0812-8841-3319',
    accountHolder: 'MUHAMMAD RAYHAN',
    timeLimit: '15 Menit',
    fee: 1500,
  },

  // ─── 3. GERAI RETAIL ────────────────────────────────────────────
  {
    id: 'indomaret',
    category: 'Gerai Retail',
    code: 'Indomaret',
    name: 'Indomaret / Ceriamart',
    shortName: 'Indomaret',
    desc: 'Tunjukkan kode bayar ke kasir gerai Indomaret terdekat',
    logo: PAYMENT_LOGOS.indomaret,
    vaNumber: 'INDO-9920-4729-10',
    accountHolder: 'MUHAMMAD RAYHAN',
    timeLimit: '24 Jam',
    fee: 3500,
  },
  {
    id: 'alfamart',
    category: 'Gerai Retail',
    code: 'Alfamart',
    name: 'Alfamart / Alfamidi / Dan+Dan',
    shortName: 'Alfamart',
    desc: 'Tunjukkan kode bayar ke kasir gerai Alfamart terdekat',
    logo: PAYMENT_LOGOS.alfamart,
    vaNumber: 'ALFA-8819-4729-22',
    accountHolder: 'MUHAMMAD RAYHAN',
    timeLimit: '24 Jam',
    fee: 3500,
  },
];

const PAYMENT_METHODS = ALL_PAYMENT_METHODS;

const INSTRUCTIONS_MBCA = [
  {
    step: '1',
    text: 'Buka aplikasi BCA mobile lalu pilih menu m-Transfer.',
    boldWords: ['BCA mobile', 'm-Transfer'],
  },
  {
    step: '2',
    text: 'Pilih BCA Virtual Account.',
    boldWords: ['BCA Virtual Account'],
  },
  {
    step: '3',
    text: 'Masukkan nomor VA 8801 2008 4729 1034 lalu klik Send.',
    boldWords: ['8801 2008 4729 1034', 'Send'],
  },
  {
    step: '4',
    text: 'Periksa nama tagihan Ahmad Fathoni - SPP dan total nominal.',
    boldWords: ['Ahmad Fathoni - SPP'],
  },
  {
    step: '5',
    text: 'Masukkan PIN m-BCA untuk menyelesaikan transaksi.',
    boldWords: ['PIN m-BCA'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// KOMPONEN GESER UNTUK LANJUT PEMBAYARAN (SLIDE TO CONTINUE)
// ─────────────────────────────────────────────────────────────────────────────
function SlideToPayButton({ onComplete, disabled, isDark, theme }) {
  const THUMB_SIZE = 48;
  const PADDING = 4;
  const defaultWidth = SCREEN_WIDTH - 48;

  const [trackWidth, setTrackWidth] = useState(defaultWidth);
  const [isSuccess, setIsSuccess] = useState(false);

  // Single animated value for thumb horizontal translation (JS driven, smooth gesture + spring)
  const translateX = useRef(new Animated.Value(0)).current;

  // Standalone chevron wave animation (Native driven, runs independently on chevrons)
  const chevronPulse = useRef(new Animated.Value(0)).current;

  const nudgeAnimRef = useRef(null);
  const maxSlideRef = useRef(Math.max(0, defaultWidth - THUMB_SIZE - PADDING * 2));
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const isCompletedRef = useRef(false);

  // Animasi hint berkala (nudge halus 14px ke kanan lalu kembali)
  const startIdleNudge = () => {
    if (disabledRef.current || isCompletedRef.current) return;
    if (nudgeAnimRef.current) {
      nudgeAnimRef.current.stop();
    }
    translateX.setValue(0);
    nudgeAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.delay(2200),
        Animated.timing(translateX, {
          toValue: 14,
          duration: 360,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          friction: 5,
          tension: 40,
          useNativeDriver: false,
        }),
        Animated.delay(1200),
      ])
    );
    nudgeAnimRef.current.start();
  };

  const stopIdleNudge = () => {
    if (nudgeAnimRef.current) {
      nudgeAnimRef.current.stop();
      nudgeAnimRef.current = null;
    }
  };

  useEffect(() => {
    // 1. Looping animasi ripple/wave pada chevrons (>>>)
    const chevronLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(chevronPulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(chevronPulse, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ])
    );
    chevronLoop.start();

    // 2. Start idle nudge jika tombol tidak disabled
    if (!disabled) {
      startIdleNudge();
    } else {
      stopIdleNudge();
      translateX.setValue(0);
    }

    return () => {
      chevronLoop.stop();
      stopIdleNudge();
    };
  }, [disabled]);

  const handleLayout = (e) => {
    const width = e.nativeEvent.layout.width;
    if (width && width > 0) {
      setTrackWidth(width);
      maxSlideRef.current = Math.max(0, width - THUMB_SIZE - PADDING * 2);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 2,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => Math.abs(gestureState.dx) > 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        if (isCompletedRef.current) return;
        stopIdleNudge();
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (disabledRef.current || isCompletedRef.current) return;
        stopIdleNudge();
        const max = maxSlideRef.current;
        const newX = Math.max(0, Math.min(gestureState.dx, max));
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (disabledRef.current) {
          Alert.alert('Peringatan', 'Silakan pilih minimal satu tagihan untuk melanjutkan pembayaran.');
          Animated.spring(translateX, { toValue: 0, useNativeDriver: false }).start();
          return;
        }
        if (isCompletedRef.current) return;

        const max = maxSlideRef.current;
        if (gestureState.dx >= max * 0.55) {
          isCompletedRef.current = true;
          setIsSuccess(true);
          Animated.timing(translateX, {
            toValue: max,
            duration: 150,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start(() => {
            setTimeout(() => {
              if (onCompleteRef.current) {
                onCompleteRef.current();
              }
              setTimeout(() => {
                isCompletedRef.current = false;
                setIsSuccess(false);
                translateX.setValue(0);
                startIdleNudge();
              }, 600);
            }, 180);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            bounciness: 7,
            useNativeDriver: false,
          }).start(() => {
            startIdleNudge();
          });
        }
      },
      onPanResponderTerminate: () => {
        if (!isCompletedRef.current) {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: false }).start(() => {
            startIdleNudge();
          });
        }
      },
    })
  ).current;

  const currentMaxSlide = Math.max(1, trackWidth - THUMB_SIZE - PADDING * 2);

  // Teks memudar halus saat thumb mulai digeser
  const textOpacity = translateX.interpolate({
    inputRange: [0, currentMaxSlide * 0.45],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Lebar fill dinamis (presisi melingkar persis mengikuti bentuk lingkaran thumb)
  const progressWidth = translateX.interpolate({
    inputRange: [0, currentMaxSlide],
    outputRange: [THUMB_SIZE, trackWidth ? trackWidth - PADDING * 2 : defaultWidth - PADDING * 2],
    extrapolate: 'clamp',
  });

  // Akses warna: Track netral, dan warna trail medium indigo yang pas (tidak terlalu gelap, tidak terlalu terang)
  const trackBg = isDark ? '#121727' : '#F1F5F9';
  const trackBorder = isDark ? '#202940' : '#E2E8F0';
  // Warna trail medium indigo yang nyaman di mata
  const fillGradient = isDark ? ['#1E2746', '#2A365D'] : ['#DCE3FD', '#C7D2FE'];
  const textColor = isDark ? '#C7D2FE' : '#4338CA';
  const chevronColor = isDark ? '#818CF8' : '#6366F1';
  const thumbGradient = theme?.primaryGradient || (isDark ? ['#6366F1', '#818CF8'] : ['#4F46E5', '#6366F1']);

  return (
    <View style={styles.slideOuterContainer}>
      <View
        style={[
          styles.slideTrack,
          {
            backgroundColor: trackBg,
            borderColor: trackBorder,
          },
          disabled && { opacity: 0.55 },
        ]}
        onLayout={handleLayout}
      >
        {/* Dynamic Progress Trail yang tersembunyi sempurna di bawah knob */}
        <Animated.View
          style={[
            styles.slideTrackFillWrapper,
            { width: progressWidth },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={fillGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Text Center & Runway Chevrons (Simetris Seimbang) */}
        <Animated.View
          style={[styles.slideTextContainer, { opacity: textOpacity }]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.slideTrackText,
              { color: disabled ? (isDark ? '#64748B' : '#94A3B8') : textColor },
            ]}
            numberOfLines={1}
          >
            {disabled ? 'Pilih tagihan terlebih dahulu' : 'Geser untuk Bayar'}
          </Text>
          {!disabled && (
            <Animated.View
              style={[
                styles.slideChevronsRow,
                {
                  transform: [
                    {
                      translateX: chevronPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 5],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Animated.View
                style={{
                  opacity: chevronPulse.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0.35, 1, 0.45, 0.35],
                  }),
                }}
              >
                <Ionicons name="chevron-forward" size={13} color={chevronColor} />
              </Animated.View>
              <Animated.View
                style={{
                  marginLeft: -5,
                  opacity: chevronPulse.interpolate({
                    inputRange: [0, 0.3, 0.6, 1],
                    outputRange: [0.35, 0.45, 1, 0.35],
                  }),
                }}
              >
                <Ionicons name="chevron-forward" size={13} color={chevronColor} />
              </Animated.View>
              <Animated.View
                style={{
                  marginLeft: -5,
                  opacity: chevronPulse.interpolate({
                    inputRange: [0, 0.6, 0.9, 1],
                    outputRange: [0.35, 0.45, 0.6, 1],
                  }),
                }}
              >
                <Ionicons name="chevron-forward" size={13} color={chevronColor} />
              </Animated.View>
            </Animated.View>
          )}
        </Animated.View>

        {/* Draggable Thumb Knob */}
        <Animated.View
          {...panResponder.panHandlers}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[
            styles.slideThumbWrapper,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <LinearGradient
            colors={thumbGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.slideThumbGradient}
          >
            <View style={styles.slideThumbInnerRing}>
              <Ionicons
                name={isSuccess ? "checkmark" : "arrow-forward"}
                size={isSuccess ? 22 : 18}
                color="#FFFFFF"
              />
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
}

export default function SchoolBillingScreen({ onBack, onNavigateToWallet }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  // ─────────────────────────────────────────────────────────────────────────
  // STATE ALUR 4 LAYAR:
  // 'list'     -> 1. Daftar Tagihan Siswa
  // 'checkout' -> 2. Payment Checkout
  // 'waiting'  -> 3. Menunggu Pembayaran (VA Transfer)
  // 'success'  -> 4. Bukti Pembayaran (Kwitansi Resmi)
  // ─────────────────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState('list');

  // State Layar 1 (Daftar Tagihan Multi-Select)
  const [bills, setBills] = useState(INITIAL_BILLS_DATA);
  const [selectedBillIds, setSelectedBillIds] = useState([INITIAL_BILLS_DATA[0].id]);
  const [voucherCode, setVoucherCode] = useState('BEASISWA-PRESTASI');
  const [voucherApplied, setVoucherApplied] = useState(true);
  const [appliedVoucherDiscount, setAppliedVoucherDiscount] = useState(150000);

  // ─────────────────────────────────────────────────────────────────────────
  // STATE & HANDLER: SEMUA TAGIHAN SISWA & INVOICE RESMI (HALAMAN BARU)
  // ─────────────────────────────────────────────────────────────────────────
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all'); // 'all' | 'unpaid' | 'paid'
  const [allBillsSearchQuery, setAllBillsSearchQuery] = useState('');
  const [selectedInvoiceBill, setSelectedInvoiceBill] = useState(null);

  // Statistics tagihan siswa untuk counter & ringkasan
  const allBillsStats = useMemo(() => {
    const total = ALL_STUDENT_BILLS_DATA.length;
    const unpaidList = ALL_STUDENT_BILLS_DATA.filter((b) => b.status === 'unpaid');
    const paidList = ALL_STUDENT_BILLS_DATA.filter((b) => b.status === 'paid');
    const unpaidCount = unpaidList.length;
    const paidCount = paidList.length;
    const unpaidSum = unpaidList.reduce((acc, b) => acc + b.amount, 0);
    const paidSum = paidList.reduce((acc, b) => acc + b.amount, 0);
    return { total, unpaidCount, paidCount, unpaidSum, paidSum };
  }, []);

  // Filtered list tagihan berdasarkan kategori, status, dan query pencarian
  const filteredAllBills = useMemo(() => {
    return ALL_STUDENT_BILLS_DATA.filter((item) => {
      if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) {
        return false;
      }
      if (selectedStatusFilter !== 'all' && item.status !== selectedStatusFilter) {
        return false;
      }
      if (allBillsSearchQuery.trim()) {
        const q = allBillsSearchQuery.toLowerCase().trim();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchCat = (item.categoryLabel || '').toLowerCase().includes(q);
        const matchDesc = item.desc ? item.desc.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchCat && !matchDesc) return false;
      }
      return true;
    });
  }, [selectedCategoryFilter, selectedStatusFilter, allBillsSearchQuery]);

  // Handler buka halaman invoice resmi lunas
  const handleOpenInvoice = (bill) => {
    setSelectedInvoiceBill(bill);
    setCurrentStep('invoice');
  };

  // Handler bagikan kwitansi/invoice resmi
  const handleShareInvoice = async (bill) => {
    if (!bill) return;
    try {
      const inv = bill.invoice || {};
      const shareMsg = `INVOICE RESMI PEMBAYARAN SEKOLAH\nInobel Smart Academy\n\nNo. Kwitansi: ${inv.invoiceNo || 'INV-' + bill.id}\nTagihan: ${bill.title}\nKategori: ${bill.categoryLabel}\nNominal: Rp ${bill.amount.toLocaleString('id-ID')}\nStatus: LUNAS (Terverifikasi)\nTanggal Bayar: ${inv.paidAt || bill.paidAt || '-'}\nMetode: ${inv.paymentMethod || '-'}\nID Transaksi: ${inv.transactionId || '-'}\nNama Siswa: ${STUDENT_DATA.fullName} (${STUDENT_DATA.nisn})\nKelas: ${STUDENT_DATA.className}\n\nDokumen pembayaran sah dan tercatat pada sistem digital Inobel EduPay.`;
      await Share.share({
        message: shareMsg,
        title: `Invoice Resmi - ${bill.title}`,
      });
    } catch (err) {
      console.log('Error sharing invoice:', err);
    }
  };

  // Handler memilih tagihan belum lunas dari halaman semua tagihan untuk dibayar
  const handleSelectBillFromAllModal = (bill) => {
    if (!bills.some((b) => b.id === bill.id)) {
      setBills((prev) => [bill, ...prev]);
    }
    if (!selectedBillIds.includes(bill.id)) {
      setSelectedBillIds((prev) => [...prev, bill.id]);
    }
    setCurrentStep('list');
  };


  // State Layar 2 (Checkout)
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [adminFee, setAdminFee] = useState(2500);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [methodSearchQuery, setMethodSearchQuery] = useState('');

  // Quick 4 methods on Checkout screen (ensures selected method is always visible in the 4 chips)
  const quickMethods = useMemo(() => {
    const topFour = ALL_PAYMENT_METHODS.slice(0, 4);
    if (topFour.some((m) => m.id === selectedMethod.id)) {
      return topFour;
    }
    return [topFour[0], topFour[1], topFour[2], selectedMethod];
  }, [selectedMethod]);

  // Handler for selecting payment method
  const handleSelectPaymentMethod = (method) => {
    setSelectedMethod(method);
    if (typeof method.fee === 'number') {
      setAdminFee(method.fee);
    }
    setIsMethodModalOpen(false);
    setMethodSearchQuery('');
  };

  // Filtered methods for the modal
  const filteredPaymentMethods = useMemo(() => {
    if (!methodSearchQuery.trim()) return ALL_PAYMENT_METHODS;
    const q = methodSearchQuery.toLowerCase().trim();
    return ALL_PAYMENT_METHODS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.shortName.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }, [methodSearchQuery]);

  // State Layar 3 (Menunggu Pembayaran)
  const [countdown, setCountdown] = useState({ hours: 23, minutes: 55, seconds: 10 });
  const [expandedGuide, setExpandedGuide] = useState('mbca'); // 'mbca' | 'klikbca' | 'atm'
  const [copiedKey, setCopiedKey] = useState(null);

  // Live Timer Countdown Effect
  useEffect(() => {
    if (currentStep !== 'waiting') return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep]);

  // Selected Bills via Multi-Select
  const selectedBills = useMemo(() => {
    return bills.filter((b) => selectedBillIds.includes(b.id));
  }, [bills, selectedBillIds]);

  // Handler Multi-Select Toggle
  const handleToggleBill = (id) => {
    setSelectedBillIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Kalkulasi Total Layar 1
  const listSubtotal = useMemo(() => {
    return selectedBills.reduce((acc, b) => acc + b.amount, 0);
  }, [selectedBills]);

  const listDiscount = voucherApplied ? Math.min(appliedVoucherDiscount, listSubtotal) : 0;
  const listTotal = Math.max(0, listSubtotal - listDiscount);

  // Kalkulasi Total Layar 2 & 3
  const checkoutItemsTotal = listTotal;
  const grandTotalCheckout = checkoutItemsTotal > 0 ? checkoutItemsTotal + adminFee : 0;

  // Handler Salin Teks
  const handleCopy = (text, key) => {
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    Alert.alert('Tersalin', `${text} berhasil disalin ke clipboard.`);
  };

  // Handler Toggle Voucher
  const handleToggleVoucher = () => {
    if (voucherApplied) {
      setVoucherApplied(false);
      Alert.alert('Info', 'Voucher beasiswa dinonaktifkan.');
    } else {
      if (voucherCode.trim().toUpperCase() === 'BEASISWA-PRESTASI') {
        setVoucherApplied(true);
        setAppliedVoucherDiscount(150000);
        Alert.alert('Berhasil', 'Potongan Beasiswa Rp 150.000 diterapkan!');
      } else {
        Alert.alert('Kode Tidak Valid', 'Gunakan kode: BEASISWA-PRESTASI');
      }
    }
  };

  // Safe area & background styling
  const dynamicTopPadding = Math.max(insets.top || 0, 44);
  const dynamicPaddingBottom = Math.max(insets.bottom || 0, 16);
  const bgColor = isDark ? '#0F1218' : '#F6F7FB';
  const cardBg = isDark ? '#1C222E' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#2D3748' : '#F0F2F5';

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. LAYAR 1: DAFTAR TAGIHAN SISWA (EDUPAY MODERN)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderScreenList = () => {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: dynamicPaddingBottom + 120 }]}
      >
        {/* Top Back Button (jika ada onBack) */}
        {onBack && (
          <View style={styles.topBackRow}>
            <TouchableOpacity
              onPress={onBack}
              style={[styles.billsBackBtn, { backgroundColor: cardBg, borderColor }]}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={textPrimary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Section Title & Counter */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleCol}>
            <Text style={[styles.mainSectionTitle, { color: textPrimary }]}>Daftar Tagihan</Text>
            <Text style={[styles.mainSectionSubtitle, { color: textSecondary }]} numberOfLines={1}>
              Tenggat 2 Bulan Kedepan
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.itemCountBadge,
              {
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderColor: isDark ? '#374151' : '#E2E8F0',
              },
            ]}
            onPress={() => setCurrentStep('all_bills')}
            activeOpacity={0.7}
          >
            <Ionicons name="receipt-outline" size={13} color={theme.primary || '#4F46E5'} style={{ marginRight: 4 }} />
            <Text style={[styles.itemCountText, { color: textPrimary }]} numberOfLines={1}>
              {selectedBillIds.length}/{bills.length} Tagihan
            </Text>
            <Ionicons name="chevron-forward" size={12} color={textSecondary} style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </View>

        {/* Bills List Items (Multi-Select) */}
        <View style={styles.billsListContainer}>
          {bills.map((item) => {
            const isSelected = selectedBillIds.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.billItemCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: isSelected ? (theme.primary || '#4F46E5') : borderColor,
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
                onPress={() => handleToggleBill(item.id)}
                activeOpacity={0.7}
              >
                {/* Left Thumbnail Icon */}
                <View style={[styles.billThumbnailBox, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.iconName} size={22} color={item.iconColor} />
                </View>

                {/* Middle Info */}
                <View style={styles.billItemMiddleCol}>
                  <Text style={[styles.billItemTitle, { color: textPrimary }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.billItemSubtitle, { color: textSecondary }]} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                  <Text style={[styles.billItemAmount, { color: textPrimary }]}>
                    Rp {item.amount.toLocaleString('id-ID')}
                  </Text>
                </View>

                {/* Right Action Control: Multi-Select Checkbox */}
                <View style={styles.billItemRightControl}>
                  <View
                    style={[
                      styles.multiSelectCircle,
                      {
                        borderColor: isSelected ? (theme.primary || '#4F46E5') : (isDark ? '#4B5563' : '#D1D5DB'),
                        backgroundColor: isSelected ? (theme.primary || '#4F46E5') : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Voucher / Promo Code Box */}
        <View style={[styles.voucherCardBox, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.voucherLeftPart}>
            <Ionicons name="pricetag-outline" size={17} color={textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.voucherTextInput, { color: textPrimary }]}
              value={voucherCode}
              onChangeText={setVoucherCode}
              placeholder="Masukkan kode beasiswa"
              placeholderTextColor={textSecondary}
              autoCapitalize="characters"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.voucherApplyButton,
              { backgroundColor: voucherApplied ? '#10B981' : '#111111' },
            ]}
            onPress={handleToggleVoucher}
            activeOpacity={0.8}
          >
            <Text style={styles.voucherApplyButtonText}>
              {voucherApplied ? 'Diterapkan' : 'Terapkan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Breakdown Card */}
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: textSecondary }]}>Subtotal Biaya</Text>
            <Text style={[styles.summaryValue, { color: textPrimary }]}>
              Rp {listSubtotal.toLocaleString('id-ID')}
            </Text>
          </View>

          {voucherApplied && (
            <View style={styles.summaryRow}>
              <View style={styles.discountLabelRow}>
                <Text style={styles.discountLabelGreen}>Potongan Beasiswa</Text>
                <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.discountValueGreen}>
                - Rp {listDiscount.toLocaleString('id-ID')}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: textSecondary }]}>Biaya Layanan Gerbang</Text>
            <Text style={[styles.summaryValue, { color: textPrimary }]}>Gratis</Text>
          </View>
        </View>

        {/* Bottom Total & Checkout Dock with SlideToPayButton */}
        <View style={[styles.bottomCheckoutDock, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.dockTotalInfoRow}>
            <View>
              <Text style={[styles.dockTotalLabel, { color: textPrimary }]}>Total Tagihan</Text>
              <Text style={[styles.dockTotalSubtext, { color: textSecondary }]}>
                Sudah termasuk PPN jika ada
              </Text>
            </View>
            <Text style={[styles.dockTotalAmount, { color: textPrimary }]}>
              Rp {listTotal.toLocaleString('id-ID')}
            </Text>
          </View>

          {/* Geser untuk Lanjut Pembayaran (Slide To Pay) */}
          <SlideToPayButton
            onComplete={() => setCurrentStep('checkout')}
            disabled={selectedBillIds.length === 0}
            isDark={isDark}
            theme={theme}
          />

          <View style={styles.securityFooterNote}>
            <Ionicons name="shield-checkmark-outline" size={14} color={textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.securityFooterText, { color: textSecondary }]}>
              Pembayaran instan dan terenkripsi 256-bit
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. LAYAR 2: PAYMENT CHECKOUT (METODE PEMBAYARAN)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderScreenCheckout = () => {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: dynamicPaddingBottom + 60 }]}
      >
        {/* Header Bar */}
        <View style={styles.subScreenHeaderBar}>
          <TouchableOpacity
            style={[styles.circleBackButton, { backgroundColor: cardBg, borderColor }]}
            onPress={() => setCurrentStep('list')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.subScreenHeaderTitle, { color: textPrimary }]}>Payment Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Pilih Metode Pembayaran Row */}
        <View style={styles.paymentMethodSection}>
          <View style={styles.methodHeaderRow}>
            <Text style={[styles.uppercaseSectionHeading, { color: textSecondary }]}>
              PILIH METODE PEMBAYARAN
            </Text>
            <TouchableOpacity
              onPress={() => setIsMethodModalOpen(true)}
              activeOpacity={0.7}
              style={styles.seeAllTouchable}
            >
              <Text style={[styles.seeAllMethodsText, { color: theme.primary || '#4F46E5' }]}>Lihat Semua</Text>
              <Ionicons
                name="chevron-forward"
                size={13}
                color={theme.primary || '#4F46E5'}
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.methodChipsGrid}>
            {quickMethods.map((method) => {
              const isSelected = selectedMethod.id === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodChipCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: isSelected ? (theme.primary || '#4F46E5') : borderColor,
                    },
                    isSelected && {
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : '#EEF2FF',
                    },
                  ]}
                  onPress={() => handleSelectPaymentMethod(method)}
                  activeOpacity={0.8}
                >
                  {isSelected && (
                    <View style={[styles.methodActiveBadge, { backgroundColor: theme.primary || '#4F46E5' }]}>
                      <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                    </View>
                  )}
                  <View style={styles.methodChipLogoBox}>
                    {method.logo ? (
                      <Image
                        source={method.logo}
                        style={styles.methodChipLogoImage}
                        resizeMode="contain"
                      />
                    ) : method.iconType === 'text' ? (
                      <Text
                        style={[
                          styles.methodCodeText,
                          { color: isSelected ? (theme.primary || '#4F46E5') : textPrimary },
                        ]}
                      >
                        {method.code}
                      </Text>
                    ) : (
                      <Ionicons
                        name={method.iconName}
                        size={20}
                        color={isSelected ? (theme.primary || '#4F46E5') : textPrimary}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.methodShortName,
                      { color: isSelected ? (theme.primary || '#4F46E5') : textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {method.shortName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Card Virtual Account dengan Gradien Khas Template Inobel */}
        <LinearGradient
          colors={isDark ? ['#141A2D', '#1B233D'] : ['#1C2E5A', '#253B73']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.obsidianCard}
        >
          <View style={styles.obsidianCardTopRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.obsidianCardBrand}>
                {selectedMethod.category === 'Virtual Account'
                  ? 'INOBEL VIRTUAL ACCOUNT'
                  : selectedMethod.category === 'E-Wallet & QRIS'
                  ? 'INOBEL QRIS / E-WALLET'
                  : 'INOBEL GERAI RETAIL'}
              </Text>
              {selectedMethod.logo ? (
                <View style={styles.obsidianLogoTitleBox}>
                  <Image
                    source={selectedMethod.logo}
                    style={styles.obsidianLogoTitleImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <Text style={styles.obsidianCardCampus}>{selectedMethod.name || 'BCA Smart Campus'}</Text>
              )}
            </View>
            <View style={styles.obsidianBankPill}>
              <Text style={styles.obsidianBankPillText}>{selectedMethod.code}</Text>
            </View>
          </View>

          {/* Gold EMV Chip Graphic */}
          <View style={styles.goldEmvChip}>
            <View style={styles.goldEmvLineHorizontal} />
            <View style={styles.goldEmvLineVertical} />
          </View>

          {/* VA Number Display */}
          <View style={styles.obsidianVaRow}>
            <Text style={styles.obsidianVaNumber}>{selectedMethod.vaNumber}</Text>
            <TouchableOpacity
              onPress={() => handleCopy(selectedMethod.vaNumber, 'checkout_va')}
              style={styles.obsidianCopyBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copiedKey === 'checkout_va' ? 'checkmark' : 'copy-outline'}
                size={14}
                color="#FFFFFF"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.obsidianCopyBtnText}>
                {copiedKey === 'checkout_va' ? 'Tersalin' : 'Salin'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Card Holder & Limit Info */}
          <View style={styles.obsidianCardBottomRow}>
            <View>
              <Text style={styles.obsidianMetaLabel}>NAMA REKENING</Text>
              <Text style={styles.obsidianHolderName}>{selectedMethod.accountHolder}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.obsidianMetaLabel}>BATAS BAYAR</Text>
              <Text style={styles.obsidianTimeLimit}>{selectedMethod.timeLimit}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Rincian Tagihan Sekolah Box */}
        <View style={[styles.rincianCheckoutCard, { backgroundColor: cardBg, borderColor }]}>
          {/* Header Bar */}
          <View style={styles.rincianHeaderRow}>
            <Text style={[styles.rincianTitle, { color: textPrimary }]}>Rincian Tagihan Sekolah</Text>
            <View style={[styles.rincianBadgePill, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
              <Text style={[styles.rincianBadgeText, { color: theme.primary || '#4F46E5' }]}>
                {selectedBills.length} Tagihan
              </Text>
            </View>
          </View>

          {/* Daftar Tagihan Pokok (Tipografi 1 Baris Jelas & Rapi) */}
          <View style={styles.rincianItemsContainer}>
            {selectedBills.map((bill) => (
              <View key={bill.id} style={styles.rincianItemRow}>
                <Text
                  style={[styles.rincianItemName, { color: textPrimary }]}
                  numberOfLines={1}
                >
                  {bill.title}
                </Text>
                <Text style={[styles.rincianItemPrice, { color: textPrimary }]}>
                  Rp {bill.amount.toLocaleString('id-ID')}
                </Text>
              </View>
            ))}
          </View>

          {/* Hairline Divider */}
          <View style={[styles.rincianDivider, { backgroundColor: borderColor }]} />

          {/* Rincian Biaya Tambahan & Diskon */}
          <View style={styles.rincianFeesContainer}>
            {selectedBills.length > 1 && (
              <View style={styles.rincianFeeRow}>
                <Text style={[styles.rincianFeeLabel, { color: textSecondary }]}>
                  Subtotal ({selectedBills.length} tagihan)
                </Text>
                <Text style={[styles.rincianFeeValue, { color: textSecondary }]}>
                  Rp {listSubtotal.toLocaleString('id-ID')}
                </Text>
              </View>
            )}

            {voucherApplied && listDiscount > 0 && (
              <View style={styles.rincianFeeRow}>
                <View style={styles.rincianFeeWithIcon}>
                  <Ionicons name="pricetag" size={13} color="#10B981" style={{ marginRight: 6 }} />
                  <Text
                    style={[styles.rincianDiscountLabel, { color: '#10B981' }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Diskon Beasiswa
                  </Text>
                </View>
                <Text style={[styles.rincianDiscountValue, { color: '#10B981' }]}>
                  - Rp {listDiscount.toLocaleString('id-ID')}
                </Text>
              </View>
            )}

            <View style={styles.rincianFeeRow}>
              <View style={styles.rincianFeeWithIcon}>
                <Ionicons name="shield-checkmark-outline" size={13} color={textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.rincianFeeLabel, { color: textSecondary }]}>
                  Biaya Transaksi ({selectedMethod.shortName || 'Perbankan'})
                </Text>
              </View>
              <Text style={[styles.rincianFeeValue, { color: textSecondary }]}>
                Rp {adminFee.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>

          {/* Divider Total */}
          <View style={[styles.rincianTotalDivider, { backgroundColor: borderColor }]} />

          {/* Grand Total Row (Sejajar, Jelas, & Tidak Bertumpuk) */}
          <View style={styles.rincianTotalRow}>
            <Text style={[styles.rincianTotalLabel, { color: textPrimary }]}>
              Total Pembayaran
            </Text>
            <Text style={[styles.rincianTotalAmount, { color: theme.primary || '#4F46E5' }]}>
              Rp {grandTotalCheckout.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        {/* CTA Button dengan Tema Aplikasi */}
        <TouchableOpacity
          style={styles.checkoutCtaButtonWrapper}
          onPress={() => setCurrentStep('waiting')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={theme.primaryGradient || (isDark ? ['#6366F1', '#818CF8'] : ['#4F46E5', '#6366F1'])}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutCtaButtonGradient}
          >
            <Text style={styles.checkoutCtaButtonText}>Konfirmasi Pembayaran</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.securityFooterNote}>
          <Ionicons name="lock-closed-outline" size={14} color={textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.securityFooterText, { color: textSecondary }]}>
            Dilindungi Enkripsi 256-Bit Bank Indonesia
          </Text>
        </View>
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. LAYAR 3: MENUNGGU PEMBAYARAN (VIRTUAL ACCOUNT TRANSFER)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderScreenWaiting = () => {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: dynamicPaddingBottom + 60 }]}
      >
        {/* Header Bar */}
        <View style={styles.subScreenHeaderBar}>
          <TouchableOpacity
            style={[styles.circleBackButton, { backgroundColor: cardBg, borderColor }]}
            onPress={() => setCurrentStep('checkout')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.subScreenHeaderTitle, { color: textPrimary, flex: 1, textAlign: 'center' }]}>
            Virtual Account Transfer
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Countdown Header Card */}
        <View style={[styles.timerContainerBox, { backgroundColor: cardBg, borderColor }]}>
          <View
            style={[
              styles.timerBadgePill,
              { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' },
            ]}
          >
            <Ionicons name="time-outline" size={14} color="#D97706" style={{ marginRight: 5 }} />
            <Text style={styles.timerBadgeText}>Menunggu Pembayaran</Text>
          </View>
          <Text style={[styles.timerInstructionText, { color: textSecondary }]}>
            Selesaikan transfer sebelum batas waktu habis
          </Text>

          {/* Countdown Digit Blocks */}
          <View style={styles.timerBlocksRow}>
            <View style={styles.timerBlockCol}>
              <View style={[styles.timerDigitBox, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                <Text style={[styles.timerDigitText, { color: theme.primary || '#4F46E5' }]}>
                  {countdown.hours < 10 ? `0${countdown.hours}` : countdown.hours}
                </Text>
              </View>
              <Text style={[styles.timerUnitLabel, { color: textSecondary }]}>Jam</Text>
            </View>

            <Text style={[styles.timerColon, { color: theme.primary || '#4F46E5' }]}>:</Text>

            <View style={styles.timerBlockCol}>
              <View style={[styles.timerDigitBox, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                <Text style={[styles.timerDigitText, { color: theme.primary || '#4F46E5' }]}>
                  {countdown.minutes < 10 ? `0${countdown.minutes}` : countdown.minutes}
                </Text>
              </View>
              <Text style={[styles.timerUnitLabel, { color: textSecondary }]}>Menit</Text>
            </View>

            <Text style={[styles.timerColon, { color: theme.primary || '#4F46E5' }]}>:</Text>

            <View style={styles.timerBlockCol}>
              <View style={[styles.timerDigitBox, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                <Text style={[styles.timerDigitText, { color: theme.primary || '#4F46E5' }]}>
                  {countdown.seconds < 10 ? `0${countdown.seconds}` : countdown.seconds}
                </Text>
              </View>
              <Text style={[styles.timerUnitLabel, { color: textSecondary }]}>Detik</Text>
            </View>
          </View>
        </View>

        {/* Virtual Account / Payment Code Card dengan Gradien Navy Inobel */}
        <LinearGradient
          colors={isDark ? ['#141A2D', '#1B233D'] : ['#1C2E5A', '#253B73']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bcaVaCard}
        >
          <View style={styles.bcaVaHeaderRow}>
            <View style={styles.bcaVaTitleGroup}>
              <View style={{ flex: 1, marginRight: 8 }}>
                {selectedMethod.logo ? (
                  <View style={styles.waitingLogoTitleBox}>
                    <Image
                      source={selectedMethod.logo}
                      style={styles.waitingLogoTitleImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <Text style={styles.bcaVaTitleText}>{selectedMethod.name}</Text>
                )}
                {!!selectedMethod.desc && (
                  <Text style={styles.bcaVaDescText} numberOfLines={1}>
                    {selectedMethod.desc}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Info Pembayaran', `Selesaikan transfer dengan nomor rekening/kode bayar ini sebelum batas waktu.`)}>
              <Ionicons name="information-circle-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.vaCardLabel}>
            {selectedMethod.category === 'Virtual Account'
              ? 'Nomor Virtual Account'
              : selectedMethod.category === 'E-Wallet & QRIS'
              ? 'Kode Bayar / Referensi'
              : 'Kode Pembayaran Kasir'}
          </Text>

          <View style={styles.vaCardNumberRow}>
            <Text style={styles.vaCardNumberValue}>{selectedMethod.vaNumber}</Text>
            <TouchableOpacity
              style={[styles.vaSalinButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : '#FFFFFF' }]}
              onPress={() => handleCopy(selectedMethod.vaNumber, 'va_waiting')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copiedKey === 'va_waiting' ? 'checkmark' : 'copy-outline'}
                size={13}
                color={isDark ? '#FFFFFF' : '#1C2E5A'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.vaSalinButtonText, { color: isDark ? '#FFFFFF' : '#1C2E5A' }]}>
                {copiedKey === 'va_waiting' ? 'Tersalin' : 'Salin'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.vaCardFooterRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person-outline" size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
              <Text style={styles.vaCardStudent} numberOfLines={1}>
                {STUDENT_DATA.fullName} • NISN {STUDENT_DATA.nisn}
              </Text>
            </View>
            <Text style={styles.vaCardPeriod} numberOfLines={2}>
              {selectedBills.map((b) => b.title.replace('Tagihan ', '')).join(' • ') || 'SPP Sekolah'}
            </Text>
          </View>
        </LinearGradient>

        {/* Total Pembayaran Box */}
        <View style={[styles.totalPaymentBox, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.totalPaymentLabel, { color: textSecondary }]}>Total Pembayaran</Text>
          <View style={styles.totalPaymentRow}>
            <Text style={[styles.totalPaymentValue, { color: textPrimary }]}>
              Rp {grandTotalCheckout.toLocaleString('id-ID')}
            </Text>
            <TouchableOpacity
              style={[styles.salinNominalBtn, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}
              onPress={() => handleCopy(grandTotalCheckout.toString(), 'nominal_waiting')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copiedKey === 'nominal_waiting' ? 'checkmark' : 'copy-outline'}
                size={13}
                color={theme.primary || '#4F46E5'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.salinNominalBtnText, { color: theme.primary || '#4F46E5' }]}>
                {copiedKey === 'nominal_waiting' ? 'Tersalin' : 'Salin Nominal'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Blue Info Notice Box */}
          <View
            style={[
              styles.infoNoticeBox,
              {
                backgroundColor: isDark ? 'rgba(79, 70, 229, 0.1)' : '#EEF2FF',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : '#E0E7FF',
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={theme.primary || '#4F46E5'}
              style={{ marginRight: 8, marginTop: 1 }}
            />
            <Text style={[styles.infoNoticeText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>
              Pastikan transfer tepat hingga digit terakhir agar sistem dapat memverifikasi transaksi
              secara otomatis dalam waktu 1-2 menit.
            </Text>
          </View>
        </View>

        {/* Cara Pembayaran Accordion */}
        <View style={styles.accordionContainer}>
          <Text style={[styles.accordionSectionHeading, { color: textPrimary }]}>
            Cara Pembayaran
          </Text>

          {/* Item 1: m-BCA (Expanded) */}
          <View style={[styles.accordionCard, { backgroundColor: cardBg, borderColor }]}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setExpandedGuide(expandedGuide === 'mbca' ? null : 'mbca')}
              activeOpacity={0.7}
            >
              <View style={[styles.accordionIconBox, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                <Ionicons name="phone-portrait-outline" size={18} color={theme.primary || '#4F46E5'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.accordionTitle, { color: textPrimary }]}>m-BCA (BCA mobile)</Text>
                <Text style={[styles.accordionSubtitle, { color: textSecondary }]}>
                  Aplikasi smartphone cepat
                </Text>
              </View>
              <Ionicons
                name={expandedGuide === 'mbca' ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.primary || '#4F46E5'}
              />
            </TouchableOpacity>

            {expandedGuide === 'mbca' && (
              <View style={styles.accordionBody}>
                {INSTRUCTIONS_MBCA.map((item) => (
                  <View key={item.step} style={styles.instructionStepRow}>
                    <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                      <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>{item.step}</Text>
                    </View>
                    <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Item 2: KlikBCA (Internet Banking) */}
          <View style={[styles.accordionCard, { backgroundColor: cardBg, borderColor }]}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setExpandedGuide(expandedGuide === 'klikbca' ? null : 'klikbca')}
              activeOpacity={0.7}
            >
              <View style={[styles.accordionIconBox, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                <Ionicons name="globe-outline" size={18} color={theme.primary || '#4F46E5'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.accordionTitle, { color: textPrimary }]}>
                  KlikBCA (Internet Banking)
                </Text>
                <Text style={[styles.accordionSubtitle, { color: textSecondary }]}>
                  Melalui peramban web
                </Text>
              </View>
              <Ionicons
                name={expandedGuide === 'klikbca' ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.primary || '#4F46E5'}
              />
            </TouchableOpacity>
            {expandedGuide === 'klikbca' && (
              <View style={styles.accordionBody}>
                <Text style={[styles.collapsedGuideText, { color: textSecondary }]}>
                  Login ke KlikBCA Individual » Pilih Transfer Dana » Transfer ke BCA Virtual Account »
                  Masukkan nomor VA 8801 2008 4729 1034 » Konfirmasi transaksi menggunakan KeyBCA Appli 1.
                </Text>
              </View>
            )}
          </View>

          {/* Item 3: ATM BCA */}
          <View style={[styles.accordionCard, { backgroundColor: cardBg, borderColor }]}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setExpandedGuide(expandedGuide === 'atm' ? null : 'atm')}
              activeOpacity={0.7}
            >
              <View style={[styles.accordionIconBox, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                <Ionicons name="cash-outline" size={18} color={theme.primary || '#4F46E5'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.accordionTitle, { color: textPrimary }]}>ATM BCA</Text>
                <Text style={[styles.accordionSubtitle, { color: textSecondary }]}>
                  Melalui gerai mesin ATM terdekat
                </Text>
              </View>
              <Ionicons
                name={expandedGuide === 'atm' ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.primary || '#4F46E5'}
              />
            </TouchableOpacity>
            {expandedGuide === 'atm' && (
              <View style={styles.accordionBody}>
                <Text style={[styles.collapsedGuideText, { color: textSecondary }]}>
                  Masukkan Kartu & PIN ATM BCA » Pilih Transaksi Lainnya » Transfer » Ke Rek BCA Virtual
                  Account » Masukkan nomor 8801 2008 4729 1034 » Validasi nama dan nominal » Selesai.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Actions dengan Gradien Tema Inobel */}
        <TouchableOpacity
          style={[styles.checkoutCtaButtonWrapper, { marginTop: 24 }]}
          onPress={() => {
            Alert.alert(
              'Memverifikasi Pembayaran',
              'Sistem mendeteksi transfer berhasil masuk! Membuka bukti kwitansi resmi...',
              [
                {
                  text: 'Buka Kwitansi',
                  onPress: () => setCurrentStep('success'),
                },
              ]
            );
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={theme.primaryGradient || (isDark ? ['#6366F1', '#818CF8'] : ['#4F46E5', '#6366F1'])}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutCtaButtonGradient}
          >
            <Ionicons name="refresh-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.checkoutCtaButtonText}>Cek Status Pembayaran</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.outlineSecondaryButton, { borderColor }]}
          onPress={() => setCurrentStep('checkout')}
          activeOpacity={0.7}
        >
          <Text style={[styles.outlineSecondaryButtonText, { color: textPrimary }]}>
            Ubah Metode Bayar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. LAYAR 4: BUKTI PEMBAYARAN (KWITANSI DIGITAL RESMI & LUNAS)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderScreenSuccess = () => {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: dynamicPaddingBottom + 60 }]}
      >
        {/* Header Bar */}
        <View style={styles.subScreenHeaderBar}>
          <TouchableOpacity
            style={[styles.circleBackButton, { backgroundColor: cardBg, borderColor }]}
            onPress={() => setCurrentStep('list')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.subScreenHeaderTitle, { color: textPrimary }]}>Kwitansi Pembayaran</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Clean Hero Status & Nominal */}
        <View style={styles.cleanSuccessHero}>
          <View style={[styles.cleanSuccessCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }]}>
            <Ionicons name="checkmark-circle" size={56} color="#10B981" />
          </View>
          <Text style={[styles.cleanSuccessTitle, { color: textPrimary }]}>
            Pembayaran Berhasil
          </Text>
          <Text style={[styles.cleanSuccessAmount, { color: theme.primary || '#4F46E5' }]}>
            Rp {grandTotalCheckout.toLocaleString('id-ID')}
          </Text>
          <View style={[styles.cleanStatusPill, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
            <View style={styles.cleanStatusDot} />
            <Text style={styles.cleanStatusText}>Lunas Otomatis</Text>
          </View>
        </View>

        {/* Clean Receipt Card */}
        <View style={[styles.cleanReceiptCard, { backgroundColor: cardBg, borderColor }]}>
          {/* Metadata Rows */}
          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>No. Transaksi</Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => handleCopy('EDP-20241110-89421', 'receipt_tx')}
              activeOpacity={0.7}
            >
              <Text style={[styles.cleanMetaVal, { color: textPrimary, marginRight: 5 }]}>
                EDP-20241110-89421
              </Text>
              <Ionicons name="copy-outline" size={13} color={theme.primary || '#4F46E5'} />
            </TouchableOpacity>
          </View>

          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>Waktu</Text>
            <Text style={[styles.cleanMetaVal, { color: textPrimary }]}>
              10 Nov 2024, 09:42 WIB
            </Text>
          </View>

          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>Metode Pembayaran</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {selectedMethod.logo ? (
                <Image
                  source={selectedMethod.logo}
                  style={styles.receiptMethodLogoTitleImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={[styles.cleanMetaVal, { color: textPrimary }]}>
                  {selectedMethod.name}
                </Text>
              )}
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.cleanDivider, { backgroundColor: borderColor }]} />

          {/* Heading */}
          <Text style={[styles.cleanRincianHeading, { color: textSecondary }]}>
            RINCIAN PEMBAYARAN
          </Text>

          {/* Itemized list */}
          <View style={styles.cleanItemList}>
            {selectedBills.map((bill) => (
              <View key={bill.id} style={styles.cleanItemRow}>
                <Text style={[styles.cleanItemName, { color: textPrimary }]} numberOfLines={1}>
                  {bill.title}
                </Text>
                <Text style={[styles.cleanItemAmount, { color: textPrimary }]}>
                  Rp {bill.amount.toLocaleString('id-ID')}
                </Text>
              </View>
            ))}

            {voucherApplied && listDiscount > 0 && (
              <View style={styles.cleanItemRow}>
                <Text style={[styles.cleanItemName, { color: '#10B981' }]} numberOfLines={1}>
                  Diskon Beasiswa
                </Text>
                <Text style={[styles.cleanItemAmount, { color: '#10B981', fontWeight: '600' }]}>
                  - Rp {listDiscount.toLocaleString('id-ID')}
                </Text>
              </View>
            )}

            <View style={styles.cleanItemRow}>
              <Text style={[styles.cleanItemName, { color: textSecondary }]} numberOfLines={1}>
                Biaya Layanan
              </Text>
              <Text style={[styles.cleanItemAmount, { color: textSecondary }]}>
                Rp {adminFee.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.cleanDivider, { backgroundColor: borderColor }]} />

          {/* Total Row */}
          <View style={styles.cleanTotalRow}>
            <Text style={[styles.cleanTotalLabel, { color: textPrimary }]}>Total Pembayaran</Text>
            <Text style={[styles.cleanTotalAmount, { color: theme.primary || '#4F46E5' }]}>
              Rp {grandTotalCheckout.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={styles.checkoutCtaButtonWrapper}
          onPress={() => {
            Share.share({
              message: `Kwitansi Resmi Tagihan Siswa - SMA Nusantara 01. Transaksi: EDP-20241110-89421 LUNAS Rp ${grandTotalCheckout.toLocaleString('id-ID')}`,
              title: 'Kwitansi Tagihan Sekolah',
            });
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={theme.primaryGradient || (isDark ? ['#6366F1', '#818CF8'] : ['#4F46E5', '#6366F1'])}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutCtaButtonGradient}
          >
            <Ionicons name="download-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.checkoutCtaButtonText}>Unduh Kwitansi (PDF)</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.outlineSecondaryButton, { borderColor }]}
          onPress={() => {
            if (onBack) {
              onBack();
            } else {
              setCurrentStep('list');
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="home-outline" size={17} color={textPrimary} style={{ marginRight: 8 }} />
          <Text style={[styles.outlineSecondaryButtonText, { color: textPrimary }]}>
            Kembali ke Beranda
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL: PILIH METODE PEMBAYARAN LENGKAP (BOTTOM SHEET)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderPaymentMethodModal = () => {
    const methodCategories = [
      { key: 'Virtual Account', title: 'Virtual Account (Verifikasi Otomatis)', icon: 'card-outline' },
      { key: 'E-Wallet & QRIS', title: 'Uang Elektronik & QRIS Instan', icon: 'qr-code-outline' },
      { key: 'Gerai Retail', title: 'Gerai Retail / Minimarket', icon: 'storefront-outline' },
    ];

    return (
      <Modal
        visible={isMethodModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsMethodModalOpen(false);
          setMethodSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => {
              setIsMethodModalOpen(false);
              setMethodSearchQuery('');
            }}
          />

          <View style={[styles.modalSheetContainer, { backgroundColor: cardBg, paddingBottom: dynamicPaddingBottom + 12 }]}>
            {/* Sheet Handle */}
            <View style={[styles.modalHandleBar, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />

            {/* Header */}
            <View style={[styles.modalHeaderRow, { borderBottomColor: borderColor }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.modalTitleText, { color: textPrimary }]}>Pilih Metode Pembayaran</Text>
                <Text style={[styles.modalSubtitleText, { color: textSecondary }]}>
                  Pilih saluran pembayaran resmi yang Anda inginkan
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#2D3748' : '#F3F4F6' }]}
                onPress={() => {
                  setIsMethodModalOpen(false);
                  setMethodSearchQuery('');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Search Input Box */}
            <View style={styles.modalSearchContainer}>
              <View
                style={[
                  styles.modalSearchBox,
                  {
                    backgroundColor: isDark ? '#141A24' : '#F9FAFB',
                    borderColor: borderColor,
                  },
                ]}
              >
                <Ionicons name="search-outline" size={18} color={textSecondary} />
                <TextInput
                  value={methodSearchQuery}
                  onChangeText={setMethodSearchQuery}
                  placeholder="Cari bank, e-wallet, atau minimarket..."
                  placeholderTextColor={textSecondary}
                  style={[styles.modalSearchInput, { color: textPrimary }]}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
                {methodSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setMethodSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Scrollable Methods List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              style={styles.modalScrollView}
            >
              {filteredPaymentMethods.length === 0 ? (
                <View style={styles.modalEmptyState}>
                  <Ionicons name="search-outline" size={36} color={textSecondary} />
                  <Text style={[styles.modalEmptyText, { color: textSecondary }]}>
                    Tidak ditemukan metode pembayaran dengan kata kunci "{methodSearchQuery}".
                  </Text>
                </View>
              ) : (
                methodCategories.map((cat) => {
                  const catItems = filteredPaymentMethods.filter((m) => m.category === cat.key);
                  if (catItems.length === 0) return null;

                  return (
                    <View key={cat.key} style={styles.modalCategorySection}>
                      <View style={styles.modalCategoryHeader}>
                        <Ionicons name={cat.icon} size={15} color={theme.primary || '#4F46E5'} />
                        <Text style={[styles.modalCategoryTitle, { color: textSecondary }]}>
                          {cat.title}
                        </Text>
                        <View
                          style={[
                            styles.modalCategoryCountPill,
                            { backgroundColor: isDark ? '#262F40' : '#EEF2FF' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.modalCategoryCountText,
                              { color: theme.primary || '#4F46E5' },
                            ]}
                          >
                            {catItems.length}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.modalCardGroup,
                          {
                            backgroundColor: isDark ? '#141A24' : '#FBFBFE',
                            borderColor: borderColor,
                          },
                        ]}
                      >
                        {catItems.map((item, idx) => {
                          const isSelected = selectedMethod.id === item.id;
                          return (
                            <React.Fragment key={item.id}>
                              {idx > 0 && (
                                <View
                                  style={[styles.modalItemDivider, { backgroundColor: borderColor }]}
                                />
                              )}
                              <TouchableOpacity
                                style={[
                                  styles.modalMethodRow,
                                  isSelected && {
                                    backgroundColor: isDark
                                      ? 'rgba(99, 102, 241, 0.1)'
                                      : 'rgba(79, 70, 229, 0.05)',
                                  },
                                ]}
                                onPress={() => handleSelectPaymentMethod(item)}
                                activeOpacity={0.7}
                              >
                                {/* Method details with logo replacing name */}
                                <View style={styles.modalMethodInfoCol}>
                                  <View style={styles.modalMethodTitleRow}>
                                    {item.logo ? (
                                      <Image
                                        source={item.logo}
                                        style={styles.modalMethodLogoTitleImage}
                                        resizeMode="contain"
                                      />
                                    ) : (
                                      <Text
                                        style={[
                                          styles.modalMethodName,
                                          {
                                            color: isSelected
                                              ? (theme.primary || '#4F46E5')
                                              : textPrimary,
                                            fontWeight: isSelected ? '700' : '600',
                                          },
                                        ]}
                                      >
                                        {item.name}
                                      </Text>
                                    )}
                                  </View>
                                  {!!item.desc && (
                                    <Text
                                      style={[styles.modalMethodDesc, { color: textSecondary }]}
                                      numberOfLines={1}
                                    >
                                      {item.desc}
                                    </Text>
                                  )}
                                  <View style={styles.modalMethodMetaRow}>
                                    <Text
                                      style={[
                                        styles.modalMethodFeeText,
                                        { color: textSecondary },
                                      ]}
                                    >
                                      Biaya Admin: Rp {item.fee.toLocaleString('id-ID')}
                                    </Text>
                                    <View
                                      style={[
                                        styles.modalMethodTag,
                                        {
                                          backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.modalMethodTagText,
                                          { color: theme.primary || '#4F46E5' },
                                        ]}
                                      >
                                        {item.category === 'Virtual Account'
                                          ? 'Otomatis'
                                          : item.category === 'E-Wallet & QRIS'
                                          ? 'Instan'
                                          : 'Kasir'}
                                      </Text>
                                    </View>
                                  </View>
                                </View>

                                {/* Radio Circle */}
                                <View
                                  style={[
                                    styles.modalRadioOuter,
                                    {
                                      borderColor: isSelected
                                        ? (theme.primary || '#4F46E5')
                                        : (isDark ? '#4B5563' : '#D1D5DB'),
                                    },
                                  ]}
                                >
                                  {isSelected && (
                                    <View
                                      style={[
                                        styles.modalRadioInner,
                                        { backgroundColor: theme.primary || '#4F46E5' },
                                      ]}
                                    />
                                  )}
                                </View>
                              </TouchableOpacity>
                            </React.Fragment>
                          );
                        })}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYAR BARU: SEMUA TAGIHAN SISWA (SIMPEL & CLEAN SESUAI UI LAIN)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderScreenAllBills = () => {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: dynamicPaddingBottom + 60 }]}
      >
        {/* Header Bar */}
        <View style={styles.subScreenHeaderBar}>
          <TouchableOpacity
            style={[styles.circleBackButton, { backgroundColor: cardBg, borderColor }]}
            onPress={() => setCurrentStep('list')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={textPrimary} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.subScreenHeaderTitle, { color: textPrimary }]}>Semua Tagihan</Text>
            <Text style={[styles.cleanHeaderSubtitle, { color: textSecondary }]}>
              {STUDENT_DATA.fullName} • {STUDENT_DATA.className}
            </Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* Minimalist Summary Pills */}
        <View style={styles.cleanSummaryPillsRow}>
          <TouchableOpacity
            style={[
              styles.cleanSummaryPill,
              {
                backgroundColor: selectedStatusFilter === 'all'
                  ? (isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF')
                  : cardBg,
                borderColor: selectedStatusFilter === 'all' ? (theme.primary || '#4F46E5') : borderColor,
              },
            ]}
            onPress={() => setSelectedStatusFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.cleanSummaryPillText,
                { color: selectedStatusFilter === 'all' ? (theme.primary || '#4F46E5') : textSecondary },
              ]}
            >
              Semua ({allBillsStats.total})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cleanSummaryPill,
              {
                backgroundColor: selectedStatusFilter === 'unpaid'
                  ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2')
                  : cardBg,
                borderColor: selectedStatusFilter === 'unpaid' ? '#EF4444' : borderColor,
              },
            ]}
            onPress={() => setSelectedStatusFilter((prev) => (prev === 'unpaid' ? 'all' : 'unpaid'))}
            activeOpacity={0.7}
          >
            <View style={[styles.cleanStatusDot, { backgroundColor: '#EF4444' }]} />
            <Text
              style={[
                styles.cleanSummaryPillText,
                { color: selectedStatusFilter === 'unpaid' ? '#EF4444' : textSecondary },
              ]}
            >
              Belum Bayar ({allBillsStats.unpaidCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cleanSummaryPill,
              {
                backgroundColor: selectedStatusFilter === 'paid'
                  ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                  : cardBg,
                borderColor: selectedStatusFilter === 'paid' ? '#10B981' : borderColor,
              },
            ]}
            onPress={() => setSelectedStatusFilter((prev) => (prev === 'paid' ? 'all' : 'paid'))}
            activeOpacity={0.7}
          >
            <View style={[styles.cleanStatusDot, { backgroundColor: '#10B981' }]} />
            <Text
              style={[
                styles.cleanSummaryPillText,
                { color: selectedStatusFilter === 'paid' ? '#10B981' : textSecondary },
              ]}
            >
              Lunas ({allBillsStats.paidCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Minimalist Search Box */}
        <View style={[styles.cleanSearchBox, { backgroundColor: cardBg, borderColor }]}>
          <Ionicons name="search" size={16} color={textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Cari nama tagihan atau kategori..."
            placeholderTextColor={textSecondary}
            value={allBillsSearchQuery}
            onChangeText={setAllBillsSearchQuery}
            style={[styles.cleanSearchInput, { color: textPrimary }]}
            returnKeyType="search"
          />
          {allBillsSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setAllBillsSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Horizontal Scroll Chips */}
        <View style={styles.cleanCategoryScrollWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cleanCategoryScrollContent}>
            {ALL_BILLS_CATEGORIES.map((cat) => {
              const isCatSelected = selectedCategoryFilter === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.cleanCategoryChip,
                    {
                      backgroundColor: isCatSelected ? (theme.primary || '#4F46E5') : cardBg,
                      borderColor: isCatSelected ? (theme.primary || '#4F46E5') : borderColor,
                    },
                  ]}
                  onPress={() => setSelectedCategoryFilter(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.cleanCategoryChipText,
                      {
                        color: isCatSelected ? '#FFFFFF' : textSecondary,
                        fontWeight: isCatSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Clean Bills List */}
        <View style={styles.cleanBillsListContainer}>
          {filteredAllBills.length === 0 ? (
            <View style={[styles.cleanEmptyStateCard, { backgroundColor: cardBg, borderColor }]}>
              <Ionicons name="folder-open-outline" size={40} color={textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
              <Text style={[styles.cleanEmptyTitle, { color: textPrimary }]}>Tidak ada tagihan</Text>
              <Text style={[styles.cleanEmptySubtitle, { color: textSecondary }]}>
                Tidak ada tagihan yang sesuai dengan filter ini.
              </Text>
            </View>
          ) : (
            filteredAllBills.map((item) => {
              const isPaid = item.status === 'paid';
              const isSelectedInMain = selectedBillIds.includes(item.id);

              return (
                <View
                  key={item.id}
                  style={[
                    styles.cleanBillCard,
                    {
                      backgroundColor: cardBg,
                      borderColor,
                    },
                  ]}
                >
                  {/* Top: Category & Status Badge */}
                  <View style={styles.cleanBillCardTop}>
                    <Text style={[styles.cleanBillCategoryText, { color: textSecondary }]}>
                      {item.categoryLabel?.toUpperCase()}
                    </Text>
                    <View
                      style={[
                        styles.cleanStatusBadge,
                        {
                          backgroundColor: isPaid
                            ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                            : (isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2'),
                        },
                      ]}
                    >
                      <Ionicons
                        name={isPaid ? 'checkmark-circle' : 'time-outline'}
                        size={12}
                        color={isPaid ? '#059669' : '#EF4444'}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.cleanStatusText,
                          { color: isPaid ? '#059669' : '#EF4444' },
                        ]}
                      >
                        {isPaid ? 'Lunas' : 'Belum Bayar'}
                      </Text>
                    </View>
                  </View>

                  {/* Middle: Title & Due/Paid date */}
                  <Text style={[styles.cleanBillTitle, { color: textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.cleanBillDate, { color: textSecondary }]}>
                    {isPaid ? `Dibayar: ${item.paidAt || '-'}` : `Tenggat: ${item.dueDate || '-'}`}
                  </Text>

                  {/* Bottom: Price & Action */}
                  <View style={[styles.cleanBillCardBottom, { borderTopColor: isDark ? '#2D3748' : '#F1F5F9' }]}>
                    <View>
                      <Text style={[styles.cleanBillNominalLabel, { color: textSecondary }]}>Nominal</Text>
                      <Text style={[styles.cleanBillNominalValue, { color: textPrimary }]}>
                        Rp {item.amount.toLocaleString('id-ID')}
                      </Text>
                    </View>

                    {isPaid ? (
                      <TouchableOpacity
                        style={[
                          styles.cleanInvoiceActionBtn,
                          {
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                            borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                          },
                        ]}
                        onPress={() => handleOpenInvoice(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="receipt-outline" size={14} color="#059669" style={{ marginRight: 4 }} />
                        <Text style={styles.cleanInvoiceActionBtnText}>Lihat Invoice</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.cleanPayActionBtn,
                          {
                            backgroundColor: isSelectedInMain
                              ? (isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF')
                              : (theme.primary || '#4F46E5'),
                            borderColor: theme.primary || '#4F46E5',
                          },
                        ]}
                        onPress={() => handleSelectBillFromAllModal(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isSelectedInMain ? 'checkmark' : 'add'}
                          size={14}
                          color={isSelectedInMain ? (theme.primary || '#4F46E5') : '#FFFFFF'}
                          style={{ marginRight: 2 }}
                        />
                        <Text
                          style={[
                            styles.cleanPayActionBtnText,
                            { color: isSelectedInMain ? (theme.primary || '#4F46E5') : '#FFFFFF' },
                          ]}
                        >
                          {isSelectedInMain ? 'Dipilih' : 'Bayar'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYAR BARU: BUKTI PEMBAYARAN / INVOICE RESMI (CLEAN & SIMPLE)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderScreenInvoice = () => {
    if (!selectedInvoiceBill) return null;
    const inv = selectedInvoiceBill.invoice || {
      invoiceNo: `INV/202410/${selectedInvoiceBill.id.toUpperCase()}`,
      paidAt: selectedInvoiceBill.paidAt || 'Telah Diverifikasi',
      paymentMethod: 'BCA Virtual Account',
      paymentLogo: PAYMENT_LOGOS.bca_va,
      transactionId: `EDP-TRX-${Math.floor(10000000 + Math.random() * 90000000)}`,
      baseAmount: selectedInvoiceBill.amount,
      adminFee: 2500,
      totalAmount: selectedInvoiceBill.amount + 2500,
    };

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: dynamicPaddingBottom + 60 }]}
      >
        {/* Header Bar */}
        <View style={styles.subScreenHeaderBar}>
          <TouchableOpacity
            style={[styles.circleBackButton, { backgroundColor: cardBg, borderColor }]}
            onPress={() => setCurrentStep('all_bills')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.subScreenHeaderTitle, { color: textPrimary }]}>Invoice Pembayaran</Text>
          <TouchableOpacity
            style={[styles.circleBackButton, { backgroundColor: cardBg, borderColor }]}
            onPress={() => handleShareInvoice(selectedInvoiceBill)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={18} color={textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Clean Invoice Card */}
        <View style={[styles.cleanInvoiceCard, { backgroundColor: cardBg, borderColor }]}>
          {/* Top Status */}
          <View style={styles.cleanInvoiceTopCenter}>
            <View style={styles.cleanInvoiceSuccessIcon}>
              <Ionicons name="checkmark-circle" size={36} color="#10B981" />
            </View>
            <Text style={[styles.cleanInvoiceSchool, { color: textSecondary }]}>
              {STUDENT_DATA.schoolName || 'SMA NUSANTARA 01 JAKARTA'}
            </Text>
            <Text style={[styles.cleanInvoiceTotalBig, { color: textPrimary }]}>
              Rp {inv.totalAmount.toLocaleString('id-ID')}
            </Text>
            <View style={styles.cleanInvoiceVerifiedPill}>
              <Ionicons name="shield-checkmark" size={12} color="#059669" style={{ marginRight: 4 }} />
              <Text style={styles.cleanInvoiceVerifiedText}>Lunas & Terverifikasi</Text>
            </View>
          </View>

          <View style={[styles.cleanInvoiceDivider, { backgroundColor: isDark ? '#2D3748' : '#F1F5F9' }]} />

          {/* Details Table */}
          <View style={styles.cleanInvoiceDetailsBox}>
            <View style={styles.cleanInvoiceRow}>
              <Text style={[styles.cleanInvoiceLabel, { color: textSecondary }]}>No. Invoice</Text>
              <Text style={[styles.cleanInvoiceValue, { color: textPrimary, fontWeight: '700' }]}>
                {inv.invoiceNo}
              </Text>
            </View>

            <View style={styles.cleanInvoiceRow}>
              <Text style={[styles.cleanInvoiceLabel, { color: textSecondary }]}>Waktu Bayar</Text>
              <Text style={[styles.cleanInvoiceValue, { color: textPrimary }]}>{inv.paidAt}</Text>
            </View>

            <View style={styles.cleanInvoiceRow}>
              <Text style={[styles.cleanInvoiceLabel, { color: textSecondary }]}>Metode Bayar</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {inv.paymentLogo && (
                  <Image source={inv.paymentLogo} style={styles.cleanInvoiceMethodLogo} resizeMode="contain" />
                )}
                <Text style={[styles.cleanInvoiceValue, { color: textPrimary, fontWeight: '600' }]}>
                  {inv.paymentMethod}
                </Text>
              </View>
            </View>

            <View style={styles.cleanInvoiceRow}>
              <Text style={[styles.cleanInvoiceLabel, { color: textSecondary }]}>Nama Siswa</Text>
              <Text style={[styles.cleanInvoiceValue, { color: textPrimary, fontWeight: '600' }]}>
                {STUDENT_DATA.fullName}
              </Text>
            </View>

            <View style={styles.cleanInvoiceRow}>
              <Text style={[styles.cleanInvoiceLabel, { color: textSecondary }]}>NISN / Kelas</Text>
              <Text style={[styles.cleanInvoiceValue, { color: textPrimary }]}>
                {STUDENT_DATA.nisn} • {STUDENT_DATA.className}
              </Text>
            </View>

            <View style={styles.cleanInvoiceRow}>
              <Text style={[styles.cleanInvoiceLabel, { color: textSecondary }]}>Tagihan</Text>
              <Text style={[styles.cleanInvoiceValue, { color: textPrimary, fontWeight: '600' }]}>
                {selectedInvoiceBill.title}
              </Text>
            </View>

            <View style={styles.cleanInvoiceRow}>
              <Text style={[styles.cleanInvoiceLabel, { color: textSecondary }]}>Biaya Pokok</Text>
              <Text style={[styles.cleanInvoiceValue, { color: textPrimary }]}>
                Rp {inv.baseAmount.toLocaleString('id-ID')}
              </Text>
            </View>

            <View style={styles.cleanInvoiceRow}>
              <Text style={[styles.cleanInvoiceLabel, { color: textSecondary }]}>Biaya Layanan</Text>
              <Text style={[styles.cleanInvoiceValue, { color: textPrimary }]}>
                Rp {inv.adminFee.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>

          <View style={[styles.cleanInvoiceDivider, { backgroundColor: isDark ? '#2D3748' : '#F1F5F9' }]} />

          {/* Legal Note */}
          <Text style={[styles.cleanInvoiceFooterNote, { color: textSecondary }]}>
            Bukti pembayaran ini sah dan diterbitkan secara digital oleh Inobel Smart Academy.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.cleanInvoiceActions}>
          <TouchableOpacity
            style={[styles.cleanInvoiceShareBtn, { backgroundColor: theme.primary || '#4F46E5' }]}
            onPress={() => handleShareInvoice(selectedInvoiceBill)}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.cleanInvoiceShareBtnText}>Bagikan Bukti Bayar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cleanInvoiceBackBtn, { backgroundColor: cardBg, borderColor }]}
            onPress={() => setCurrentStep('all_bills')}
            activeOpacity={0.7}
          >
            <Text style={[styles.cleanInvoiceBackBtnText, { color: textPrimary }]}>Kembali ke Semua Tagihan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.rootScreenContainer, { backgroundColor: bgColor, paddingTop: dynamicTopPadding }]}>
      {/* Screen Router */}
      {currentStep === 'list' && renderScreenList()}
      {currentStep === 'all_bills' && renderScreenAllBills()}
      {currentStep === 'invoice' && renderScreenInvoice()}
      {currentStep === 'checkout' && renderScreenCheckout()}
      {currentStep === 'waiting' && renderScreenWaiting()}
      {currentStep === 'success' && renderScreenSuccess()}

      {/* Payment Method Bottom Sheet Modal */}
      {renderPaymentMethodModal()}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLESHEET (CLEAN, MINIMALIST, HIGH-END EDUPAY FINTECH)
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  rootScreenContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // 1. Screen List Styles
  topBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  billsBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  // Section Title & Counter
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  sectionTitleCol: {
    flex: 1,
    paddingRight: 6,
  },
  mainSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  mainSectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  itemCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 14,
    borderWidth: 1,
    flexShrink: 0,
  },
  itemCountText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  // Bills List Cards
  billsListContainer: {
    gap: 12,
    marginBottom: 16,
  },
  billItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  billThumbnailBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  billItemMiddleCol: {
    flex: 1,
  },
  billItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  billItemSubtitle: {
    fontSize: 11,
    marginBottom: 4,
  },
  billItemAmount: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  billItemRightControl: {
    marginLeft: 8,
  },
  multiSelectCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Slide to pay button styles
  slideOuterContainer: {
    width: '100%',
  },
  slideTrack: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
  },
  slideTrackFillWrapper: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 24,
    overflow: 'hidden',
  },
  slideTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 54,
  },
  slideTrackText: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  slideChevronsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  slideThumbWrapper: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    zIndex: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  slideThumbGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideThumbInnerRing: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  lockPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 3,
  },
  lockPillQty: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepperPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 16,
    gap: 4,
  },
  stepperQtyText: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  stepperMinusBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperPlusBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Voucher Box
  voucherCardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  voucherLeftPart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    padding: 0,
  },
  voucherApplyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  voucherApplyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Summary Card
  summaryCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  discountLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountLabelGreen: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  discountValueGreen: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },

  // Bottom Checkout Dock
  bottomCheckoutDock: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  dockTotalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dockTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  dockTotalSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  dockTotalAmount: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  primaryBlackButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonInnerFlex: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBlackButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  securityFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  securityFooterText: {
    fontSize: 11,
  },

  // 2. Screen Checkout Styles
  subScreenHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  circleBackButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subScreenHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  uppercaseSectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  studentContextSection: {
    marginBottom: 18,
  },
  studentContextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  studentContextInfoCol: {
    flex: 1,
    marginLeft: 10,
  },
  studentContextSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  studentContextSchool: {
    fontSize: 11,
    marginTop: 1,
  },
  switchStudentBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Payment Method Chips
  paymentMethodSection: {
    marginBottom: 20,
  },
  methodHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  seeAllMethodsText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  methodChipsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  methodChipCard: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    position: 'relative',
  },
  methodChipCardActive: {
    borderColor: '#111827',
  },
  methodActiveBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodChipLogoBox: {
    width: 52,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  methodChipLogoImage: {
    width: 48,
    height: 16,
  },
  methodCodeText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  methodShortName: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Luxury Obsidian Card
  obsidianCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  obsidianCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  obsidianCardBrand: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  obsidianCardCampus: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
  },
  obsidianLogoTitleBox: {
    marginTop: 6,
    marginBottom: 2,
    alignItems: 'flex-start',
  },
  obsidianLogoTitleImage: {
    width: 72,
    height: 24,
  },
  obsidianBankLogoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    height: 26,
  },
  obsidianBankLogoImage: {
    width: 48,
    height: 16,
  },
  obsidianBankPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  obsidianBankPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  goldEmvChip: {
    width: 38,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EAB308',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CA8A04',
  },
  goldEmvLineHorizontal: {
    position: 'absolute',
    top: 13,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#A16207',
  },
  goldEmvLineVertical: {
    position: 'absolute',
    left: 18,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#A16207',
  },
  obsidianVaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  obsidianVaNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  obsidianCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  obsidianCopyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  obsidianCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  obsidianMetaLabel: {
    color: '#6B7280',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  obsidianHolderName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  obsidianTimeLimit: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },

  // Rincian Checkout Card
  rincianCheckoutCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  rincianHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rincianTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rincianBadgePill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  rincianBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rincianItemsContainer: {
    gap: 10,
    marginBottom: 4,
  },
  rincianItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  rincianItemName: {
    fontSize: 13.5,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  rincianItemPrice: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  rincianDivider: {
    height: 1,
    marginVertical: 12,
  },
  rincianFeesContainer: {
    gap: 9,
  },
  rincianFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rincianFeeWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  rincianFeeLabel: {
    fontSize: 12.5,
    fontWeight: '400',
    flex: 1,
  },
  rincianFeeValue: {
    fontSize: 12.5,
    fontWeight: '600',
    flexShrink: 0,
  },
  rincianDiscountLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  rincianDiscountValue: {
    fontSize: 12.5,
    fontWeight: '700',
    flexShrink: 0,
  },
  rincianTotalDivider: {
    height: 1,
    marginVertical: 14,
  },
  rincianTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  rincianTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rincianTotalAmount: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  checkoutCtaButtonWrapper: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  checkoutCtaButtonGradient: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  checkoutCtaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // 3. Screen Waiting Styles
  timerContainerBox: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  timerBadgeText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
  },
  timerInstructionText: {
    fontSize: 12,
    marginBottom: 14,
    textAlign: 'center',
  },
  timerBlocksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerBlockCol: {
    alignItems: 'center',
  },
  timerDigitBox: {
    width: 44,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  timerDigitText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerUnitLabel: {
    fontSize: 10,
  },
  timerColon: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },

  // BCA VA Card
  bcaVaCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  bcaVaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  bcaVaTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waitingLogoTitleBox: {
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  waitingLogoTitleImage: {
    width: 72,
    height: 24,
  },
  bcaLogoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    height: 24,
  },
  waitingMethodLogoImage: {
    width: 45,
    height: 15,
  },
  bcaLogoText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '800',
  },
  bcaVaTitleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  bcaVaDescText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    marginTop: 1,
  },
  vaCardLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginBottom: 6,
  },
  vaCardNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  vaCardNumberValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  vaSalinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  vaSalinButtonText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  vaCardFooterRow: {
    flexDirection: 'column',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 10,
    gap: 4,
  },
  vaCardStudent: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
  },
  vaCardPeriod: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
  },

  // Total Payment Box
  totalPaymentBox: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  totalPaymentLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  totalPaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalPaymentValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  salinNominalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  salinNominalBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoNoticeText: {
    flex: 1,
    color: '#1E40AF',
    fontSize: 11,
    lineHeight: 16,
  },

  // Accordion Guides
  accordionContainer: {
    gap: 10,
  },
  accordionSectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  accordionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  accordionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  accordionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  accordionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  instructionStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumberCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },
  stepInstructionText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  collapsedGuideText: {
    fontSize: 12,
    lineHeight: 18,
  },
  outlineSecondaryButton: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    flexDirection: 'row',
  },
  outlineSecondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // 4. Screen Success / Kwitansi (Minimalist & Clean)
  cleanSuccessHero: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  cleanSuccessCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cleanSuccessTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  cleanSuccessAmount: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  cleanStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  cleanStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  cleanStatusText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },

  // Clean Receipt Card
  cleanReceiptCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cleanMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  cleanMetaKey: {
    fontSize: 12,
    fontWeight: '500',
  },
  cleanMetaVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  receiptMethodLogoBox: {
    width: 42,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  receiptMethodLogoImage: {
    width: 39,
    height: 13,
  },
  receiptMethodLogoTitleImage: {
    width: 54,
    height: 18,
  },
  cleanDivider: {
    height: 1,
    marginVertical: 12,
  },
  cleanRincianHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  cleanItemList: {
    gap: 8,
  },
  cleanItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  cleanItemName: {
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  cleanItemAmount: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  cleanTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  cleanTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  cleanTotalAmount: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PAYMENT METHOD BOTTOM SHEET MODAL STYLES
  // ─────────────────────────────────────────────────────────────────────────
  seeAllTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheetContainer: {
    maxHeight: '86%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 24,
  },
  modalHandleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalTitleText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  modalSubtitleText: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingHorizontal: 8,
    height: 40,
  },
  modalScrollView: {
    paddingHorizontal: 20,
  },
  modalCategorySection: {
    marginBottom: 18,
  },
  modalCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  modalCategoryTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  modalCategoryCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  modalCategoryCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalCardGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  modalItemDivider: {
    height: 1,
    marginHorizontal: 14,
  },
  modalMethodTitleRow: {
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  modalMethodLogoTitleImage: {
    width: 72,
    height: 24,
  },
  modalMethodIconBox: {
    width: 54,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  modalMethodLogoImage: {
    width: 51,
    height: 17,
  },
  modalMethodBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  modalMethodInfoCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  modalMethodName: {
    fontSize: 13.5,
    marginBottom: 1,
  },
  modalMethodDesc: {
    fontSize: 11.5,
    marginBottom: 6,
    lineHeight: 16,
  },
  modalMethodMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalMethodFeeText: {
    fontSize: 11.5,
  },
  modalMethodTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  modalMethodTagText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  modalRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  modalRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalEmptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },

  // ── Halaman Semua Tagihan Siswa (Clean & Simple) ─────────────────────────
  cleanHeaderSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '500',
  },
  cleanSummaryPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cleanSummaryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  cleanSummaryPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cleanStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  cleanSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cleanSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  cleanCategoryScrollWrapper: {
    marginBottom: 14,
  },
  cleanCategoryScrollContent: {
    gap: 8,
  },
  cleanCategoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  cleanCategoryChipText: {
    fontSize: 12,
  },
  cleanBillsListContainer: {
    gap: 10,
  },
  cleanEmptyStateCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cleanEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  cleanEmptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  cleanBillCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cleanBillCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cleanBillCategoryText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cleanStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cleanStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  cleanBillTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  cleanBillDate: {
    fontSize: 11.5,
    marginBottom: 10,
  },
  cleanBillCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  cleanBillNominalLabel: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  cleanBillNominalValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  cleanInvoiceActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  cleanInvoiceActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  cleanPayActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  cleanPayActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // ── Halaman Bukti Pembayaran / Invoice (Clean & Simple) ──────────────────
  cleanInvoiceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 14,
  },
  cleanInvoiceTopCenter: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cleanInvoiceSuccessIcon: {
    marginBottom: 6,
  },
  cleanInvoiceSchool: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  cleanInvoiceTotalBig: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 6,
  },
  cleanInvoiceVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  cleanInvoiceVerifiedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  cleanInvoiceDivider: {
    height: 1,
    marginVertical: 14,
  },
  cleanInvoiceDetailsBox: {
    gap: 10,
  },
  cleanInvoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cleanInvoiceLabel: {
    fontSize: 12,
  },
  cleanInvoiceValue: {
    fontSize: 12.5,
  },
  cleanInvoiceMethodLogo: {
    width: 32,
    height: 14,
  },
  cleanInvoiceFooterNote: {
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 15,
    opacity: 0.7,
  },
  cleanInvoiceActions: {
    gap: 8,
    marginBottom: 16,
  },
  cleanInvoiceShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  cleanInvoiceShareBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  cleanInvoiceBackBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  cleanInvoiceBackBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

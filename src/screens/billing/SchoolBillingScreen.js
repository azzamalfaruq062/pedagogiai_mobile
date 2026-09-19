import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  ActivityIndicator,
  RefreshControl,
  Vibration,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { billingApi } from '../../api/billingApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BILLS_CACHE_KEY = '@billing_cache_v1';

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

// Partikel Confetti & Sparkles untuk Animasi Sukses Menuju Kwitansi (Palet Fintech Hijau & Modern)
const CELEBRATION_PARTICLES = [
  { id: 1, angle: 15, distance: 70, color: '#10B981', size: 8, shape: 'circle' },
  { id: 2, angle: 45, distance: 82, color: '#34D399', size: 9, shape: 'rect' },
  { id: 3, angle: 75, distance: 68, color: '#6366F1', size: 7, shape: 'circle' },
  { id: 4, angle: 105, distance: 78, color: '#059669', size: 8, shape: 'rect' },
  { id: 5, angle: 140, distance: 72, color: '#10B981', size: 9, shape: 'circle' },
  { id: 6, angle: 175, distance: 80, color: '#06B6D4', size: 7, shape: 'rect' },
  { id: 7, angle: 210, distance: 68, color: '#34D399', size: 8, shape: 'circle' },
  { id: 8, angle: 245, distance: 78, color: '#10B981', size: 9, shape: 'rect' },
  { id: 9, angle: 280, distance: 72, color: '#8B5CF6', size: 7, shape: 'circle' },
  { id: 10, angle: 310, distance: 82, color: '#059669', size: 8, shape: 'rect' },
  { id: 11, angle: 340, distance: 70, color: '#10B981', size: 7, shape: 'circle' },
  { id: 12, angle: 125, distance: 88, color: '#34D399', size: 6, shape: 'sparkle' },
  { id: 13, angle: 225, distance: 88, color: '#6366F1', size: 6, shape: 'sparkle' },
  { id: 14, angle: 325, distance: 88, color: '#10B981', size: 6, shape: 'sparkle' },
];

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
    kode_biller: '1530',
    nomor_pembayaran: '1124118921',
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
    kode_biller: '1530',
    nomor_pembayaran: '1124128922',
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
    kode_biller: '1530',
    nomor_pembayaran: '1224118923',
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
    id: 'bsi_va',
    category: 'Virtual Account',
    code: 'BSI',
    name: 'BSI Hasanah Virtual Account (H2H)',
    shortName: 'BSI',
    desc: 'Transfer via BSI Mobile, Net Banking & ATM Syariah (Mitra Resmi)',
    logo: PAYMENT_LOGOS.bsi_va,
    vaNumber: '1124118921',
    accountHolder: 'MUHAMMAD RAYHAN',
    timeLimit: '23 Jam 59 Menit',
    fee: 0,
  },
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

const INSTRUCTIONS_BSI = [
  {
    step: '1',
    text: 'Buka aplikasi BSI Mobile lalu pilih menu Bayar / Beli.',
    boldWords: ['BSI Mobile', 'Bayar / Beli'],
  },
  {
    step: '2',
    text: 'Pilih Akademik / Institusi atau menu Virtual Account.',
    boldWords: ['Akademik / Institusi', 'Virtual Account'],
  },
  {
    step: '3',
    text: 'Masukkan Nomor Virtual Account dan Kode Biller resmi sekolah.',
    boldWords: ['Nomor Virtual Account', 'Kode Biller'],
  },
  {
    step: '4',
    text: 'Validasi nama siswa, periode tagihan, dan nominal pembayaran.',
    boldWords: ['nama siswa', 'nominal pembayaran'],
  },
  {
    step: '5',
    text: 'Masukkan PIN BSI Mobile Anda untuk konfirmasi transaksi.',
    boldWords: ['PIN BSI Mobile'],
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

  // Loading & Network State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Student Profile Data
  const [studentInfo, setStudentInfo] = useState({
    name: user?.name || STUDENT_DATA.name,
    fullName: user?.name || STUDENT_DATA.fullName,
    nisn: user?.nisn || user?.student_id || STUDENT_DATA.nisn,
    className: user?.classroom || STUDENT_DATA.className,
    schoolName: user?.school?.name || STUDENT_DATA.schoolName,
    academicYear: STUDENT_DATA.academicYear,
    avatarUrl: user?.avatar || STUDENT_DATA.avatarUrl,
  });

  // State Layar 1 (Daftar Tagihan Multi-Select)
  const [bills, setBills] = useState([]);
  const [selectedBillIds, setSelectedBillIds] = useState([]);
  const [voucherCode, setVoucherCode] = useState('BEASISWA-PRESTASI');
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [appliedVoucherDiscount, setAppliedVoucherDiscount] = useState(0);

  // ─────────────────────────────────────────────────────────────────────────
  // STATE & HANDLER: SEMUA TAGIHAN SISWA & INVOICE RESMI
  // ─────────────────────────────────────────────────────────────────────────
  const [allStudentBills, setAllStudentBills] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all'); // 'all' | 'unpaid' | 'paid'
  const [allBillsSearchQuery, setAllBillsSearchQuery] = useState('');
  const [selectedInvoiceBill, setSelectedInvoiceBill] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('all');
  const [categoriesList, setCategoriesList] = useState(ALL_BILLS_CATEGORIES);
  const [rawStats, setRawStats] = useState(null);

  // Fetch data tagihan real-time dari Laravel API
  const fetchBillsData = useCallback(async (showLoading = true) => {
    // ── Stale-While-Revalidate: tampilkan cache dulu, update di background ──
    try {
      const cached = await AsyncStorage.getItem(BILLS_CACHE_KEY);
      if (cached) {
        const { bills: cachedBills, allBills, student, stats, years, cats } = JSON.parse(cached);
        if (cachedBills?.length > 0) {
          setBills(cachedBills);
          setAllStudentBills(allBills || []);
          if (student) setStudentInfo(student);
          if (stats) setRawStats(stats);
          if (years?.length) setAcademicYears(years);
          if (cats?.length) setCategoriesList(cats);
          setIsLoading(false); // cache langsung tampil, tidak perlu loader
        }
      }
    } catch (_) {}

    // ── Fetch dari API (background jika sudah ada cache) ──
    setApiError(null);
    try {
      const res = await billingApi.getMyBills({
        academic_year_id: selectedAcademicYear,
      });

      if (res && res.success) {
        const apiBills = res.data || [];
        if (apiBills.length > 0) {
          setAllStudentBills(apiBills);

          const unpaidBills = apiBills.filter((b) => b.status !== 'paid');
          setBills(unpaidBills);

          if (unpaidBills.length > 0) {
            const firstSelectable = unpaidBills.find((b) => !b.parent_unpaid) || unpaidBills[0];
            setSelectedBillIds([firstSelectable.id]);
          } else {
            setSelectedBillIds([]);
          }

          // ── Simpan ke cache untuk next open ──
          const cachePayload = {
            bills: unpaidBills,
            allBills: apiBills,
            student: res.student || null,
            stats: res.stats || null,
            years: res.academic_years || [],
            cats: res.categories?.length
              ? [
                  { id: 'all', label: `Semua (${apiBills.length})` },
                  ...res.categories.map((c) => ({ id: c.id, label: `${c.label} (${c.count})` })),
                ]
              : [],
          };
          AsyncStorage.setItem(BILLS_CACHE_KEY, JSON.stringify(cachePayload)).catch(() => {});
        } else {
          setBills(INITIAL_BILLS_DATA);
          setAllStudentBills(ALL_STUDENT_BILLS_DATA);
          setSelectedBillIds([INITIAL_BILLS_DATA[0].id]);
        }

        if (res.student) setStudentInfo(res.student);
        if (res.stats) setRawStats(res.stats);
        if (res.academic_years?.length) setAcademicYears(res.academic_years);
        if (res.categories?.length) {
          setCategoriesList([
            { id: 'all', label: `Semua (${(res.data || []).length})` },
            ...res.categories.map((c) => ({ id: c.id, label: `${c.label} (${c.count})` })),
          ]);
        }
      } else {
        setBills(INITIAL_BILLS_DATA);
        setAllStudentBills(ALL_STUDENT_BILLS_DATA);
        setSelectedBillIds([INITIAL_BILLS_DATA[0].id]);
      }
    } catch (err) {
      console.warn('[SchoolBillingScreen] Fetch bills network fallback:', err?.message || err);
      setApiError(err?.message || 'Gagal terhubung ke server tagihan.');
      setBills(INITIAL_BILLS_DATA);
      setAllStudentBills(ALL_STUDENT_BILLS_DATA);
      setSelectedBillIds([INITIAL_BILLS_DATA[0].id]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    fetchBillsData(true);
  }, [selectedAcademicYear]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBillsData(false);
  };

  // Statistics tagihan siswa untuk counter & ringkasan (Agregat Real)
  const allBillsStats = useMemo(() => {
    if (rawStats) {
      return {
        total: rawStats.totalCount ?? allStudentBills.length,
        unpaidCount: rawStats.unpaidCount ?? allStudentBills.filter((b) => b.status !== 'paid').length,
        paidCount: rawStats.paidCount ?? allStudentBills.filter((b) => b.status === 'paid').length,
        unpaidSum: rawStats.totalKewajiban ?? 0,
        paidSum: rawStats.totalSudahBayar ?? 0,
        tunggakanSum: rawStats.totalTunggakan ?? 0,
        segeraCount: rawStats.segeraCount ?? 0,
      };
    }
    const total = allStudentBills.length;
    const unpaidList = allStudentBills.filter((b) => b.status !== 'paid');
    const paidList = allStudentBills.filter((b) => b.status === 'paid');
    const unpaidCount = unpaidList.length;
    const paidCount = paidList.length;
    const unpaidSum = unpaidList.reduce((acc, b) => acc + (b.amount || 0), 0);
    const paidSum = paidList.reduce((acc, b) => acc + (b.amount || 0), 0);
    const tunggakanSum = unpaidList.filter((b) => b.isOverdue).reduce((acc, b) => acc + (b.amount || 0), 0);
    const segeraCount = unpaidList.filter((b) => b.isDueSoon).length;
    return { total, unpaidCount, paidCount, unpaidSum, paidSum, tunggakanSum, segeraCount };
  }, [rawStats, allStudentBills]);

  // Filtered list tagihan berdasarkan kategori, status, dan query pencarian
  const filteredAllBills = useMemo(() => {
    return allStudentBills.filter((item) => {
      if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) {
        return false;
      }
      if (selectedStatusFilter === 'unpaid' && item.status === 'paid') {
        return false;
      }
      if (selectedStatusFilter === 'paid' && item.status !== 'paid') {
        return false;
      }
      if (allBillsSearchQuery.trim()) {
        const q = allBillsSearchQuery.toLowerCase().trim();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchCat = (item.categoryLabel || '').toLowerCase().includes(q);
        const matchDesc = (item.subDetails || item.informasi || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchDesc) return false;
      }
      return true;
    });
  }, [allStudentBills, selectedCategoryFilter, selectedStatusFilter, allBillsSearchQuery]);

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
      const shareMsg = `KWITANSI RESMI PEMBAYARAN SEKOLAH\n${studentInfo.schoolName || 'Inobel Smart Academy'}\n\nNo. Kwitansi: ${inv.invoiceNo || 'KWT-' + bill.id}\nTagihan: ${bill.title}\nKategori: ${bill.categoryLabel}\nNominal: Rp ${(bill.total_amount || bill.amount || 0).toLocaleString('id-ID')}\nStatus: LUNAS (Terverifikasi)\nTanggal Bayar: ${inv.paidAt || bill.paidAt || '-'}\nMetode: ${inv.paymentMethod || '-'}\nID Transaksi: ${inv.transactionId || '-'}\nNama Siswa: ${studentInfo.fullName} (${studentInfo.nisn})\nKelas: ${studentInfo.className}\n\nDokumen pembayaran sah dan tercatat pada sistem digital Inobel EduPay.`;
      await Share.share({
        message: shareMsg,
        title: `Kwitansi Resmi - ${bill.title}`,
      });
    } catch (err) {
      console.log('Error sharing invoice:', err);
    }
  };

  // Forward declaration for handleSelectBillFromAllModal (implemented via handlePaySingleBill)
  const handleSelectBillFromAllModal = (bill) => {
    handlePaySingleBill(bill);
  };

  // State Layar 2 (Checkout)
  const [selectedMethod, setSelectedMethod] = useState(ALL_PAYMENT_METHODS[0]);
  const [adminFee, setAdminFee] = useState(ALL_PAYMENT_METHODS[0].fee ?? 0);
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
  const [expandedGuide, setExpandedGuide] = useState('bsi'); // 'bsi' | 'mbca' | 'klikbca' | 'atm'
  const [copiedKey, setCopiedKey] = useState(null);
  const [isTransitioningSuccess, setIsTransitioningSuccess] = useState(false);
  const successModalScale = useRef(new Animated.Value(0.3)).current;
  const successModalOpacity = useRef(new Animated.Value(0)).current;

  // Animasi Elemen Layar 4 (Kwitansi Pembayaran Berhasil Modern & Interaktif)
  const heroScaleAnim = useRef(new Animated.Value(0.2)).current;
  const heroAuraAnim = useRef(new Animated.Value(1)).current;
  const loopHeroPulse = useRef(new Animated.Value(1)).current;
  const loopRing1 = useRef(new Animated.Value(0)).current;
  const loopRing2 = useRef(new Animated.Value(0)).current;
  const ringAnim1 = useRef(new Animated.Value(0)).current;
  const ringAnim2 = useRef(new Animated.Value(0)).current;
  const ringAnim3 = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const amountScaleAnim = useRef(new Animated.Value(0.7)).current;
  const badgesSlideAnim = useRef(new Animated.Value(15)).current;
  const badgesOpacityAnim = useRef(new Animated.Value(0)).current;
  const ticketTranslateY = useRef(new Animated.Value(50)).current;
  const ticketOpacity = useRef(new Animated.Value(0)).current;
  const ticketScale = useRef(new Animated.Value(0.96)).current;

  // Efek Animasi Berkelanjutan (Selalu Ada Animasinya & Denyut Hidup)
  useEffect(() => {
    // 1. Loop Aura Glowing
    const auraLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroAuraAnim, {
          toValue: 1.15,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heroAuraAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Loop Denyut Halus Ikon Centang
    const checkmarkPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(loopHeroPulse, {
          toValue: 1.05,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(loopHeroPulse, {
          toValue: 1.0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Loop Gelombang Cincin Berkelanjutan 1
    const ringLoop1 = Animated.loop(
      Animated.timing(loopRing1, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );

    // 4. Loop Gelombang Cincin Berkelanjutan 2 (Bergantian)
    const ringLoop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(loopRing2, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    auraLoop.start();
    checkmarkPulseLoop.start();
    ringLoop1.start();
    ringLoop2.start();

    return () => {
      auraLoop.stop();
      checkmarkPulseLoop.stop();
      ringLoop1.stop();
      ringLoop2.stop();
    };
  }, []);

  // Fungsi Menjalankan Rangkaian Animasi Sukses Menyeluruh
  const playCelebrationAnimation = () => {
    heroScaleAnim.setValue(0.2);
    ringAnim1.setValue(0);
    ringAnim2.setValue(0);
    ringAnim3.setValue(0);
    confettiAnim.setValue(0);
    amountScaleAnim.setValue(0.7);
    badgesSlideAnim.setValue(15);
    badgesOpacityAnim.setValue(0);
    ticketTranslateY.setValue(50);
    ticketOpacity.setValue(0);
    ticketScale.setValue(0.96);

    Animated.parallel([
      // 1. Concentric Halo Rings
      Animated.timing(ringAnim1, {
        toValue: 1,
        duration: 950,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(100),
        Animated.timing(ringAnim2, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(ringAnim3, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // 2. Spring Pop Checkmark Hero
      Animated.spring(heroScaleAnim, {
        toValue: 1,
        friction: 3.8,
        tension: 60,
        useNativeDriver: true,
      }),
      // 3. Confetti Particles Burst
      Animated.sequence([
        Animated.delay(60),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 950,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // 4. Amount Scale Pop
      Animated.sequence([
        Animated.delay(180),
        Animated.spring(amountScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
      // 5. Floating Badges Slide In
      Animated.sequence([
        Animated.delay(260),
        Animated.parallel([
          Animated.spring(badgesSlideAnim, {
            toValue: 0,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(badgesOpacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // 6. Kwitansi Ticket Slide Up & Unfold
      Animated.sequence([
        Animated.delay(350),
        Animated.parallel([
          Animated.spring(ticketTranslateY, {
            toValue: 0,
            friction: 7,
            tension: 45,
            useNativeDriver: true,
          }),
          Animated.spring(ticketScale, {
            toValue: 1,
            friction: 7,
            tension: 45,
            useNativeDriver: true,
          }),
          Animated.timing(ticketOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  };

  // Interaktivitas Tambahan: Ketuk Ikon Sukses untuk Replay Confetti & Haptic
  const handleReplayCelebration = () => {
    try {
      Vibration.vibrate(35);
    } catch (e) { }

    ringAnim1.setValue(0);
    ringAnim2.setValue(0);
    confettiAnim.setValue(0);
    heroScaleAnim.setValue(0.82);

    Animated.parallel([
      Animated.spring(heroScaleAnim, {
        toValue: 1,
        friction: 3.5,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(ringAnim1, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ringAnim2, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Fungsi Transisi Animasi Sukses Menuju Layar Kwitansi (Menyatu & Kekinian)
  const triggerSuccessTransition = () => {
    fetchBillsData(false);
    setCurrentStep('success');
  };

  // Fungsi Mengunduh Kwitansi Formal PDF Resmi (Sama dengan format PDF di Web)
  const handleDownloadFormalPdf = async () => {
    const target = selectedBills[0] || nextUrgentBill || bills[0];
    const identifier = target?.id || target?.nomor_pembayaran || 1;

    const pdfUrl = billingApi.getInvoicePdfUrl(identifier);
    try {
      await Linking.openURL(pdfUrl);
    } catch (err) {
      Share.share({
        message: `Kwitansi Resmi Tagihan Siswa - PedaGogiAI.\nUnduh PDF Formal: ${pdfUrl}`,
        title: 'Kwitansi Tagihan Sekolah (PDF Formal)',
        url: pdfUrl,
      });
    }
  };

  // Efek Otomatis Jalankan Animasi saat Berpindah ke Layar Sukses
  useEffect(() => {
    if (currentStep === 'success') {
      playCelebrationAnimation();
    }
  }, [currentStep]);

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

  // Polling Status Pembayaran Otomatis Real-time Saat Berada di Layar Waiting
  useEffect(() => {
    if (currentStep !== 'waiting') return;

    let isMounted = true;
    const targetBill = selectedBills[0] || nextUrgentBill;
    const checkTarget = targetBill?.nomor_pembayaran || targetBill?.id;

    if (!checkTarget) return;

    const pollTimer = setInterval(async () => {
      try {
        const res = await billingApi.checkStatus(checkTarget);
        if (isMounted && res && (res.status === 'paid' || res.is_paid)) {
          clearInterval(pollTimer);
          triggerSuccessTransition();
        }
      } catch (e) {
        // Silent catch saat polling berkala di latar belakang
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [currentStep, selectedBills, nextUrgentBill]);

  // Sinkronisasi otomatis nomor_pembayaran & kode_biller dari database jika belum ada
  useEffect(() => {
    if (currentStep !== 'waiting') return;
    const target =
      selectedBills[0] ||
      bills.find((b) => selectedBillIds.map(String).includes(String(b.id || b.bill_id))) ||
      nextUrgentBill;

    if (target && target.id && (!target.nomor_pembayaran || !target.kode_biller)) {
      billingApi.generateVA(target.id || target.bill_id).then((vaRes) => {
        if (vaRes && vaRes.success) {
          const newNomor = vaRes.nomor_pembayaran;
          const newBiller = vaRes.kode_biller;
          setBills((prev) =>
            prev.map((b) =>
              String(b.id) === String(target.id)
                ? { ...b, nomor_pembayaran: newNomor, kode_biller: newBiller }
                : b
            )
          );
          setAllStudentBills((prev) =>
            prev.map((b) =>
              String(b.id) === String(target.id)
                ? { ...b, nomor_pembayaran: newNomor, kode_biller: newBiller }
                : b
            )
          );
        }
      }).catch((e) => console.log('[SchoolBillingScreen] Auto-sync VA error:', e?.message));
    }
  }, [currentStep, selectedBills, nextUrgentBill, selectedBillIds]);

  // Selected Bills via Single/Multi-Select (string-safe matching dengan database)
  const selectedBills = useMemo(() => {
    if (!selectedBillIds || selectedBillIds.length === 0) return [];
    const stringIds = selectedBillIds.map((id) => String(id));
    const matched = bills.filter((b) => stringIds.includes(String(b.id)) || stringIds.includes(String(b.bill_id)));
    if (matched.length > 0) return matched;
    return allStudentBills.filter((b) => stringIds.includes(String(b.id)) || stringIds.includes(String(b.bill_id)));
  }, [bills, allStudentBills, selectedBillIds]);

  // Helper untuk parsing tanggal jatuh tempo (mendukung format ISO maupun '10 Nov 2024')
  const parseBillDueDate = (bill) => {
    if (!bill) return Infinity;
    const raw = bill.dueDate || bill.due_date || bill.due_date_raw;
    if (!raw) return Infinity;
    const parsed = Date.parse(raw);
    if (!isNaN(parsed)) return parsed;
    const months = {
      jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5, jul: 6,
      agu: 7, ags: 7, aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11,
    };
    const parts = String(raw).trim().split(/[\s-]+/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const mStr = parts[1].toLowerCase().slice(0, 3);
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && months[mStr] !== undefined && !isNaN(year)) {
        return new Date(year, months[mStr], day).getTime();
      }
    }
    return Infinity;
  };

  // Tagihan Selanjutnya (Tagihan yang mendekati tenggat waktu / ShopeePay style)
  const nextUrgentBill = useMemo(() => {
    if (!bills || bills.length === 0) return null;

    // Ambil semua tagihan unpaid yang tidak terkunci oleh tagihan induk
    const unpaidSelectable = bills.filter((b) => b.status !== 'paid' && !b.parent_unpaid);
    if (unpaidSelectable.length === 0) return bills[0];

    // Urutkan: Tunggakan/Overdue paling awal, lalu tenggat jatuh tempo terdekat
    const sorted = [...unpaidSelectable].sort((a, b) => {
      if ((a.is_tunggakan || a.isOverdue) && !(b.is_tunggakan || b.isOverdue)) return -1;
      if (!(a.is_tunggakan || a.isOverdue) && (b.is_tunggakan || b.isOverdue)) return 1;
      return parseBillDueDate(a) - parseBillDueDate(b);
    });

    return sorted[0];
  }, [bills]);

  // Handler Pembayaran Satu per Satu (Mobile First - Bayar Satu per Satu)
  const handlePaySingleBill = async (bill) => {
    if (!bill) return;
    if (bill.parent_unpaid) {
      Alert.alert(
        'Tagihan Terkunci',
        `Tagihan ini belum dapat dibayar sebelum Tagihan Induk (${bill.parent_name || 'sebelumnya'}) dilunasi terlebih dahulu.`,
        [{ text: 'Mengerti' }]
      );
      return;
    }
    if (!bills.some((b) => b.id === bill.id)) {
      setBills((prev) => [bill, ...prev]);
    }
    // Set pembayaran strictly untuk satu tagihan ini saja (Single-Item Payment)
    setSelectedBillIds([bill.id]);

    // Auto-generate VA jika tagihan belum memiliki nomor_pembayaran
    if (!bill.nomor_pembayaran) {
      try {
        const vaRes = await billingApi.generateVA(bill.id || bill.bill_id);
        if (vaRes && vaRes.success) {
          bill.nomor_pembayaran = vaRes.nomor_pembayaran;
          bill.kode_biller = vaRes.kode_biller;
          setBills((prev) =>
            prev.map((b) =>
              b.id === bill.id
                ? { ...b, nomor_pembayaran: vaRes.nomor_pembayaran, kode_biller: vaRes.kode_biller }
                : b
            )
          );
        }
      } catch (e) {
        console.log('[SchoolBillingScreen] Notice auto generate VA:', e?.message);
      }
    }

    // Langsung menuju ke layar Virtual Account transfer
    setCurrentStep('waiting');
  };

  // Handler Bayar Sekarang untuk Tagihan Terdekat (Langsung ke VA Transfer)
  const handlePayUrgentBill = () => {
    if (nextUrgentBill) {
      handlePaySingleBill(nextUrgentBill);
    }
  };

  // Handler Single-Select Toggle dengan proteksi Anti-Loncat Bulan (Mobile: hanya bisa 1 tagihan)
  const handleToggleBill = (id) => {
    const targetBill = bills.find((b) => b.id === id);
    if (targetBill && targetBill.parent_unpaid) {
      Alert.alert(
        'Tagihan Belum Dapat Dipilih',
        `Tagihan ini belum dapat dibayar sebelum Tagihan Induk (${targetBill.parent_name || 'sebelumnya'}) dilunasi terlebih dahulu.`,
        [{ text: 'Mengerti' }]
      );
      return;
    }

    setSelectedBillIds((prev) => {
      if (prev.includes(id)) {
        return [];
      } else {
        return [id]; // Strictly 1 tagihan saja
      }
    });
  };

  // Handler Pilih Tagihan Tunggal
  const handleSelectAll = () => {
    // Pada mobile mode hanya boleh memilih 1 tagihan
    const firstSelectable = bills.find((b) => !b.parent_unpaid);
    if (!firstSelectable) return;
    if (selectedBillIds.length > 0) {
      setSelectedBillIds([]);
    } else {
      setSelectedBillIds([firstSelectable.id]);
    }
  };

  // Handler Lanjut ke Pembayaran VA dengan proteksi Anti-Loncat Bulan & Auto-Generate VA
  const handleProceedToCheckout = async () => {
    if (selectedBills.length === 0) {
      Alert.alert('Peringatan', 'Silakan pilih minimal satu tagihan untuk melanjutkan pembayaran.');
      return;
    }

    const invalidBill = selectedBills.find((b) => b.parent_unpaid);
    if (invalidBill) {
      Alert.alert(
        'Peringatan Anti-Loncat Bulan',
        `Tagihan ${invalidBill.title} belum dapat dibayar sebelum Tagihan Induk (${invalidBill.parent_name || 'sebelumnya'}) dilunasi terlebih dahulu.`
      );
      return;
    }

    // Auto-generate VA jika tagihan belum memiliki nomor_pembayaran
    const billToPay = selectedBills[0];
    if (billToPay && !billToPay.nomor_pembayaran) {
      try {
        const vaRes = await billingApi.generateVA(billToPay.id || billToPay.bill_id);
        if (vaRes && vaRes.success) {
          billToPay.nomor_pembayaran = vaRes.nomor_pembayaran;
          billToPay.kode_biller = vaRes.kode_biller;
        }
      } catch (e) {
        console.log('[SchoolBillingScreen] Notice auto generate VA:', e?.message);
      }
    }

    setCurrentStep('waiting');
  };

  // Handler Konfirmasi Menuju Layar Menunggu Pembayaran
  const handleConfirmToWaiting = async () => {
    const billToPay = selectedBills[0];
    if (billToPay && !billToPay.nomor_pembayaran) {
      try {
        const vaRes = await billingApi.generateVA(billToPay.id || billToPay.bill_id);
        if (vaRes && vaRes.success) {
          billToPay.nomor_pembayaran = vaRes.nomor_pembayaran;
          billToPay.kode_biller = vaRes.kode_biller;
        }
      } catch (e) {
        console.log('[SchoolBillingScreen] Notice generate VA on confirm:', e?.message);
      }
    }
    setCurrentStep('waiting');
  };

  // Handler Cek Status Pembayaran Real-time
  const handleCheckPaymentStatus = async () => {
    const targetBill = selectedBills[0] || nextUrgentBill;
    const checkTarget = targetBill?.nomor_pembayaran || targetBill?.id;
    try {
      const res = await billingApi.checkStatus(checkTarget);
      if (res && (res.status === 'paid' || res.is_paid)) {
        triggerSuccessTransition();
      } else {
        Alert.alert(
          'Status Pembayaran',
          'Status: Menunggu Pembayaran. Sistem perbankan mitra belum mendeteksi pembayaran masuk. Pastikan transfer telah berhasil dilakukan ke nomor Virtual Account.',
          [{ text: 'Tutup' }]
        );
      }
    } catch (err) {
      Alert.alert(
        'Info Pembayaran',
        'Menunggu sinkronisasi perbankan otomatis. Silakan refresh status kembali beberapa saat lagi.'
      );
    }
  };

  // Handler Simulasi Pembayaran Lunas (Khusus Testing UI & Animasi Transisi)
  const handleSimulatePaymentSuccess = () => {
    const target = selectedBills[0] || nextUrgentBill;
    if (target) {
      setBills((prev) =>
        prev.map((b) =>
          String(b.id) === String(target.id)
            ? { ...b, status: 'paid', isPaid: true }
            : b
        )
      );
      setAllStudentBills((prev) =>
        prev.map((b) =>
          String(b.id) === String(target.id)
            ? {
              ...b,
              status: 'paid',
              isPaid: true,
              paidAt: 'Hari ini, ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
            }
            : b
        )
      );
    }
    triggerSuccessTransition();
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
    const selectableBills = bills.filter((b) => !b.parent_unpaid);
    const isAllSelected = selectableBills.length > 0 && selectedBillIds.length === selectableBills.length;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: dynamicPaddingBottom + 120 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary || '#4F46E5'}
          />
        }
      >
        {/* Modern Mobile-First Header: Student Profile & History Pill */}
        <View style={styles.modernHeaderBar}>
          <View style={styles.modernHeaderLeft}>
            {onBack && (
              <TouchableOpacity
                onPress={onBack}
                style={[styles.modernBackBtn, { backgroundColor: cardBg, borderColor }]}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={18} color={textPrimary} />
              </TouchableOpacity>
            )}
            <LinearGradient
              colors={isDark ? ['#312E81', '#1E293B'] : ['#1E293B', '#3730A3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modernAvatarBadge}
            >
              <Text style={styles.modernAvatarText}>
                {(studentInfo.name || studentInfo.fullName || 'S').charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={styles.modernHeaderTextCol}>
              <Text style={[styles.modernStudentName, { color: textPrimary }]} numberOfLines={1}>
                {studentInfo.name || studentInfo.fullName || 'Siswa Inobel'}
              </Text>
              <Text style={[styles.modernStudentMeta, { color: textSecondary }]} numberOfLines={1}>
                {studentInfo.className ? `${studentInfo.className} • ` : ''}{studentInfo.schoolName || 'Inobel Smart Academy'}
              </Text>
            </View>
          </View>


        </View>

        {/* 1. Hero Card: Bersih, Minimalis & Elegan */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => setCurrentStep('all_bills')}
        >
          <LinearGradient
            colors={isDark ? ['#0F172A', '#1E293B', '#1E3A8A'] : ['#1E293B', '#243B55', '#1E3A8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardContainer}
          >
            {/* Subtle Watermark Bank Shield */}
            <View style={styles.heroWatermark}>
              <Ionicons name="shield" size={150} color="rgba(255, 255, 255, 0.04)" />
            </View>

            {/* Top Row: Pill Siswa & Status Verifikasi */}
            <View style={styles.heroTopRow}>
              <View style={styles.heroPill}>
                <View style={styles.heroStatusDot} />
                <Text style={styles.heroPillText}>
                  {studentInfo.className ? `${studentInfo.className} • ` : ''}Siswa Aktif
                </Text>
              </View>
              <View style={styles.heroSecurityTag}>
                <Text style={styles.heroSecurityText}>H2H Perbankan</Text>
              </View>
            </View>

            {/* Nominal Utama & Link Subtitle */}
            <View style={styles.heroAmountSection}>
              <Text style={styles.heroAmountLabel}>TOTAL SISA TAGIHAN</Text>
              <View style={styles.heroAmountRow}>
                <Text style={styles.heroCurrencySymbol}>Rp</Text>
                <Text style={styles.heroAmountVal} numberOfLines={1}>
                  {(allBillsStats.unpaidSum || 0).toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.heroSubLinkPill}>
                <Text style={styles.heroSubLinkText}>
                  Total Tagihan Terdaftar Rp {(allBillsStats.unpaidSum + allBillsStats.paidSum || 0).toLocaleString('id-ID')}
                </Text>
                <Ionicons name="chevron-forward" size={11} color="rgba(255, 255, 255, 0.9)" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* 2. Featured "Tagihan Selanjutnya" Card (Inobel Template Theme) */}
        <View style={[styles.spayNextBillCard, { backgroundColor: cardBg, borderColor }]}>
          {allBillsStats.unpaidSum === 0 ? (
            <View style={styles.spayAllPaidBox}>
              <View style={styles.spayAllPaidBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.spayAllPaidBadgeText}>SEMUA TAGIHAN TELAH LUNAS</Text>
              </View>
              <Text style={[styles.spayAllPaidTitle, { color: textPrimary }]}>Tidak Ada Tagihan Tertunggak</Text>
              <Text style={[styles.spayAllPaidSub, { color: textSecondary }]}>
                Semua pembayaran sekolah semester ini telah lunas dan tercatat di sistem.
              </Text>
              <TouchableOpacity
                style={[styles.spayViewHistoryBtn, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor }]}
                onPress={() => {
                  setSelectedStatusFilter('paid');
                  setCurrentStep('all_bills');
                }}
                activeOpacity={0.75}
              >
                <Ionicons name="receipt-outline" size={14} color={theme.primary || '#4F46E5'} style={{ marginRight: 6 }} />
                <Text style={[styles.spayViewHistoryText, { color: theme.primary || '#4F46E5' }]}>Lihat Bukti Pembayaran</Text>
                <Ionicons name="chevron-forward" size={12} color={theme.primary || '#4F46E5'} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Top Row: Tag status & bill category */}
              <View style={styles.spayProteksiRow}>
                <View
                  style={[
                    styles.spayProteksiPill,
                    {
                      backgroundColor: nextUrgentBill?.is_tunggakan || nextUrgentBill?.isOverdue
                        ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2')
                        : (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5'),
                      borderColor: nextUrgentBill?.is_tunggakan || nextUrgentBill?.isOverdue
                        ? (isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA')
                        : (isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'),
                    },
                  ]}
                >
                  <Ionicons
                    name={nextUrgentBill?.is_tunggakan || nextUrgentBill?.isOverdue ? 'alert-circle' : 'time'}
                    size={11}
                    color={nextUrgentBill?.is_tunggakan || nextUrgentBill?.isOverdue ? '#DC2626' : '#059669'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.spayProteksiText,
                      { color: nextUrgentBill?.is_tunggakan || nextUrgentBill?.isOverdue ? '#DC2626' : '#059669' },
                    ]}
                  >
                    {nextUrgentBill?.is_tunggakan || nextUrgentBill?.isOverdue ? 'PRIORITAS / TUNGGAKAN' : 'TENGGAT TERDEKAT'}
                  </Text>
                </View>

                <Text style={[styles.spayHeaderBillTitle, { color: textSecondary }]} numberOfLines={1}>
                  {nextUrgentBill?.title || 'Tagihan Sekolah'}
                </Text>
              </View>

              {/* Main Row: Tagihan Selanjutnya Amount & "Bayar" Button */}
              <View style={styles.spayNextBillMidRow}>
                <View style={styles.spayNextBillTextCol}>
                  <Text style={[styles.spayNextBillLabel, { color: textSecondary }]}>Tagihan Selanjutnya</Text>
                  <View style={styles.spayAmountRow}>
                    <Text style={[styles.spayCurrencyPrefix, { color: textSecondary }]}>Rp</Text>
                    <Text style={[styles.spayNextBillAmount, { color: textPrimary }]} numberOfLines={1}>
                      {(nextUrgentBill?.amount || 0).toLocaleString('id-ID')}
                    </Text>
                  </View>
                  <View style={styles.spayDueDateRow}>
                    <Ionicons name="calendar-outline" size={13} color={textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.spayDueDateText, { color: textSecondary }]} numberOfLines={1}>
                      Jatuh Tempo {nextUrgentBill?.dueDate || nextUrgentBill?.due_date || 'Bulan Ini'}
                    </Text>
                  </View>
                </View>

                {/* Inobel Template Button: Bayar Sekarang */}
                <TouchableOpacity
                  style={[
                    styles.spayPayEarlyBtn,
                    {
                      backgroundColor: theme.primary || '#4F46E5',
                      shadowColor: theme.primary || '#4F46E5',
                    },
                  ]}
                  onPress={handlePayUrgentBill}
                  activeOpacity={0.85}
                >
                  <Text style={styles.spayPayEarlyText}>Bayar Sekarang</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Bottom Dual Action Bar */}
          <View style={[styles.spayCardFooterSplit, { borderTopColor: isDark ? '#2D3748' : '#F1F5F9' }]}>
            <TouchableOpacity
              style={styles.spayFooterHalfBtn}
              onPress={() => {
                setSelectedStatusFilter('unpaid');
                setCurrentStep('all_bills');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={15} color={theme.primary || '#4F46E5'} style={{ marginRight: 6 }} />
              <Text style={[styles.spayFooterBtnText, { color: textPrimary }]}>
                Semua Tagihan
              </Text>
              <Ionicons name="chevron-forward" size={12} color={textSecondary} style={{ marginLeft: 3 }} />
            </TouchableOpacity>

            <View style={[styles.spayFooterDivider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />

            <TouchableOpacity
              style={styles.spayFooterHalfBtn}
              onPress={() => {
                setSelectedStatusFilter('paid');
                setCurrentStep('all_bills');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="receipt-outline" size={15} color={theme.primary || '#4F46E5'} style={{ marginRight: 6 }} />
              <Text style={[styles.spayFooterBtnText, { color: textPrimary }]}>Riwayat Lunas</Text>
              <Ionicons name="chevron-forward" size={12} color={textSecondary} style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Skeleton loading premium (hanya muncul saat belum ada data sama sekali) */}
        {isLoading && bills.length === 0 && (
          <View style={{ paddingTop: 4 }}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                }}
              >
                {/* Top row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: isDark ? '#334155' : '#E2E8F0' }} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ width: '60%', height: 12, borderRadius: 6, backgroundColor: isDark ? '#334155' : '#E2E8F0', marginBottom: 6 }} />
                    <View style={{ width: '40%', height: 10, borderRadius: 5, backgroundColor: isDark ? '#2D3748' : '#F1F5F9' }} />
                  </View>
                  <View style={{ width: 60, height: 22, borderRadius: 8, backgroundColor: isDark ? '#334155' : '#E2E8F0' }} />
                </View>
                {/* Amount */}
                <View style={{ width: '45%', height: 20, borderRadius: 8, backgroundColor: isDark ? '#334155' : '#E2E8F0', marginBottom: 12 }} />
                {/* Footer */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ width: '35%', height: 10, borderRadius: 5, backgroundColor: isDark ? '#2D3748' : '#F1F5F9' }} />
                  <View style={{ width: '25%', height: 28, borderRadius: 8, backgroundColor: isDark ? '#334155' : '#E2E8F0' }} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Security & Mitra EduPay Footer Note */}
        <View style={[styles.securityFooterNote, { marginTop: 6, marginBottom: 24 }]}>
          <Ionicons name="shield-checkmark-outline" size={14} color={textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.securityFooterText, { color: textSecondary }]}>
            Layanan resmi pembayaran pendidikan • Terenkripsi 256-bit
          </Text>
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
          <Text style={[styles.subScreenHeaderTitle, { color: textPrimary }]}>Konfirmasi Pembayaran</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* 1. Card Rincian Tagihan Sekolah yang Dipilih */}
        <View style={[styles.cleanCheckoutCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.cleanCheckoutHeaderRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.cleanCheckoutSectionTitle, { color: textPrimary }]}>
                Tagihan Dipilih
              </Text>
              <Text style={[styles.cleanCheckoutSubtitle, { color: textSecondary }]} numberOfLines={1}>
                {studentInfo.fullName || 'Siswa'} • {studentInfo.className || 'Siswa Aktif'}
              </Text>
            </View>
            <View style={[styles.cleanCheckoutBadge, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.15)' : '#EEF2FF' }]}>
              <Text style={[styles.cleanCheckoutBadgeText, { color: theme.primary || '#4F46E5' }]}>
                {selectedBills.length} Tagihan
              </Text>
            </View>
          </View>

          <View style={[styles.cleanCheckoutDivider, { backgroundColor: borderColor }]} />

          {/* List Tagihan */}
          <View style={styles.cleanCheckoutItemsList}>
            {selectedBills.map((bill) => (
              <View key={bill.id} style={styles.cleanCheckoutItemRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.cleanCheckoutItemTitle, { color: textPrimary }]} numberOfLines={1}>
                    {bill.title}
                  </Text>
                  <Text style={[styles.cleanCheckoutItemMeta, { color: textSecondary }]}>
                    Tenggat: {bill.dueDate || bill.due_date || '-'}
                  </Text>
                </View>
                <Text style={[styles.cleanCheckoutItemAmount, { color: textPrimary }]}>
                  Rp {bill.amount.toLocaleString('id-ID')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Card Pilih Metode Pembayaran */}
        <View style={[styles.cleanCheckoutCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.cleanCheckoutHeaderRow}>
            <Text style={[styles.cleanCheckoutSectionTitle, { color: textPrimary }]}>
              Metode Pembayaran
            </Text>
            <TouchableOpacity
              onPress={() => setIsMethodModalOpen(true)}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={[styles.seeAllMethodsText, { color: theme.primary || '#4F46E5' }]}>Lihat Semua</Text>
              <Ionicons name="chevron-forward" size={13} color={theme.primary || '#4F46E5'} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>

          {/* Quick Selection Chips */}
          <View style={styles.methodChipsGrid}>
            {quickMethods.map((method) => {
              const isSelected = selectedMethod.id === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodChipCard,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(79, 70, 229, 0.12)' : '#EEF2FF')
                        : cardBg,
                      borderColor: isSelected ? (theme.primary || '#4F46E5') : borderColor,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => handleSelectPaymentMethod(method)}
                  activeOpacity={0.8}
                >
                  {isSelected && (
                    <View style={[styles.methodActiveBadge, { backgroundColor: theme.primary || '#4F46E5' }]}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                  <View style={styles.methodChipLogoBox}>
                    {method.logo ? (
                      <Image source={method.logo} style={styles.methodChipLogoImage} resizeMode="contain" />
                    ) : (
                      <Ionicons
                        name={method.iconName || 'card-outline'}
                        size={18}
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

        {/* 3. Card Ringkasan Biaya */}
        <View style={[styles.cleanCheckoutCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.cleanCheckoutSectionTitle, { color: textPrimary, marginBottom: 12 }]}>
            Ringkasan Biaya
          </Text>

          <View style={styles.cleanCostRow}>
            <Text style={[styles.cleanCostLabel, { color: textSecondary }]}>Subtotal Tagihan</Text>
            <Text style={[styles.cleanCostVal, { color: textPrimary }]}>
              Rp {listSubtotal.toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={styles.cleanCostRow}>
            <Text style={[styles.cleanCostLabel, { color: textSecondary }]}>Biaya Layanan</Text>
            <Text style={[styles.cleanCostVal, { color: '#10B981', fontWeight: '700' }]}>
              Gratis (H2H)
            </Text>
          </View>

          <View style={[styles.cleanCheckoutDivider, { backgroundColor: borderColor, marginVertical: 10 }]} />

          <View style={styles.cleanCostRow}>
            <Text style={[styles.cleanTotalLabel, { color: textPrimary }]}>Total Pembayaran</Text>
            <Text style={[styles.cleanTotalVal, { color: theme.primary || '#4F46E5' }]}>
              Rp {grandTotalCheckout.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        {/* 4. Action Button: Konfirmasi Pembayaran */}
        <TouchableOpacity
          style={styles.checkoutCtaButtonWrapper}
          onPress={handleConfirmToWaiting}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={theme.primaryGradient || (isDark ? ['#6366F1', '#818CF8'] : ['#4F46E5', '#6366F1'])}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutCtaButtonGradient}
          >
            <Text style={styles.checkoutCtaButtonText}>
              Bayar Sekarang • Rp {grandTotalCheckout.toLocaleString('id-ID')}
            </Text>
            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={[styles.securityFooterNote, { marginTop: 12 }]}>
          <Ionicons name="shield-checkmark-outline" size={13} color={textSecondary} style={{ marginRight: 5 }} />
          <Text style={[styles.securityFooterText, { color: textSecondary }]}>
            Transaksi aman dan terverifikasi otomatis oleh bank mitra
          </Text>
        </View>
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. LAYAR 3: MENUNGGU PEMBAYARAN (VIRTUAL ACCOUNT TRANSFER)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderScreenWaiting = () => {
    // Ambil tagihan yang sedang aktif dibayar secara tepat dari database
    const currentBill =
      selectedBills[0] ||
      bills.find((b) => selectedBillIds.map(String).includes(String(b.id || b.bill_id))) ||
      allStudentBills.find((b) => selectedBillIds.map(String).includes(String(b.id || b.bill_id))) ||
      nextUrgentBill ||
      bills[0] ||
      allStudentBills[0];

    // Nomor Virtual Account resmi dari database
    const activeVaNumber =
      currentBill?.nomor_pembayaran ||
      bills.find((b) => b.nomor_pembayaran)?.nomor_pembayaran ||
      allStudentBills.find((b) => b.nomor_pembayaran)?.nomor_pembayaran ||
      '';

    // Kode Biller resmi dari database
    const activeBillerCode =
      currentBill?.kode_biller ||
      bills.find((b) => b.kode_biller)?.kode_biller ||
      allStudentBills.find((b) => b.kode_biller)?.kode_biller ||
      studentInfo?.billerCode ||
      '';

    const totalAmountWaiting =
      (currentBill?.amount || 0) || grandTotalCheckout || nextUrgentBill?.amount || 0;

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
          <Text style={[styles.subScreenHeaderTitle, { color: textPrimary, flex: 1, textAlign: 'center' }]}>
            Virtual Account Transfer
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Modern Fintech Card (Mobile Banking & E-Wallet Grade - Mobile First) */}
        <View style={[styles.modernVaCard, { backgroundColor: cardBg, borderColor }]}>
          {/* 1. Header: Bank BSI Brand & Live Status */}
          <View style={styles.modernVaHeader}>
            <View style={styles.modernVaBankRow}>
              <View
                style={[
                  styles.modernVaBankLogoBox,
                  { borderColor: isDark ? '#374151' : '#E2E8F0' },
                ]}
              >
                <Image
                  source={PAYMENT_LOGOS.bsi_va}
                  style={styles.modernVaBankLogoImg}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={[styles.modernVaBankName, { color: textPrimary }]}>
                  BSI Virtual Account
                </Text>
                <Text style={[styles.modernVaBankSub, { color: textSecondary }]}>
                  Mitra Resmi Pembayaran Sekolah
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.modernVaStatusPill,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                },
              ]}
            >
              <View style={styles.modernVaStatusDot} />
              <Text style={styles.modernVaStatusText}>Siap Ditransfer</Text>
            </View>
          </View>

          {/* 2. Hero Transfer Module (VA & Biller) */}
          <View
            style={[
              styles.modernVaHeroPanel,
              {
                backgroundColor: isDark ? '#192033' : '#F6F8FE',
                borderColor: isDark ? '#2D3958' : '#E2E8F8',
              },
            ]}
          >
            <View style={styles.modernVaHeroTop}>
              <Text style={[styles.modernVaHeroLabel, { color: textSecondary }]}>
                NOMOR VIRTUAL ACCOUNT
              </Text>
              <Text style={[styles.modernVaHeroHint, { color: theme.primary || '#4F46E5' }]}>
                Semua Bank & E-Wallet
              </Text>
            </View>

            <View style={styles.modernVaHeroMain}>
              <Text
                style={[styles.modernVaNumber, { color: textPrimary }]}
                selectable
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {activeVaNumber}
              </Text>
              <TouchableOpacity
                onPress={() => handleCopy(activeVaNumber, 'va_waiting')}
                style={[
                  styles.modernVaCopyBtn,
                  {
                    backgroundColor: copiedKey === 'va_waiting'
                      ? '#10B981'
                      : (theme.primary || '#4F46E5'),
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copiedKey === 'va_waiting' ? 'checkmark' : 'copy-outline'}
                  size={12}
                  color="#FFFFFF"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.modernVaCopyBtnText}>
                  {copiedKey === 'va_waiting' ? 'Tersalin' : 'Salin'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Biller Code cleanly displayed without copy button */}
            {!!activeBillerCode && (
              <View
                style={[
                  styles.modernVaBillerRow,
                  { borderTopColor: isDark ? '#2D3958' : '#E2E8F8' },
                ]}
              >
                <Text style={[styles.modernVaBillerLabel, { color: textSecondary }]}>
                  Kode Biller / Institusi:
                </Text>
                <Text style={[styles.modernVaBillerVal, { color: textPrimary }]}>
                  {activeBillerCode}
                </Text>
              </View>
            )}
          </View>

          {/* 3. Total Pembayaran Showcase */}
          <View style={styles.modernVaAmountSection}>
            <View style={styles.modernVaAmountHeader}>
              <Text style={[styles.modernVaAmountLabel, { color: textSecondary }]}>
                TOTAL PEMBAYARAN
              </Text>
            </View>

            <View style={styles.modernVaAmountRow}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={[styles.modernVaCurrency, { color: theme.primary || '#4F46E5' }]}>
                  Rp{' '}
                </Text>
                <Text style={[styles.modernVaAmountVal, { color: theme.primary || '#4F46E5' }]}>
                  {totalAmountWaiting.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
          </View>

          {/* 4. Dashed Receipt Divider */}
          <View style={[styles.modernVaDashedDivider, { borderColor }]} />

          {/* 5. Clean Receipt Breakdown (Key-Value) */}
          <View style={styles.modernVaReceiptTable}>
            <View style={styles.modernVaReceiptRow}>
              <Text style={[styles.modernVaReceiptKey, { color: textSecondary }]}>Tagihan</Text>
              <Text style={[styles.modernVaReceiptVal, { color: textPrimary }]} numberOfLines={1}>
                {currentBill?.title || 'Biaya Pendidikan'}
              </Text>
            </View>

            <View style={styles.modernVaReceiptRow}>
              <Text style={[styles.modernVaReceiptKey, { color: textSecondary }]}>Nama Siswa</Text>
              <Text style={[styles.modernVaReceiptVal, { color: textPrimary }]} numberOfLines={1}>
                {studentInfo.fullName || studentInfo.name || 'Siswa'}
              </Text>
            </View>

            {!!(studentInfo.className || studentInfo.nisn) && (
              <View style={styles.modernVaReceiptRow}>
                <Text style={[styles.modernVaReceiptKey, { color: textSecondary }]}>Kelas / NISN</Text>
                <Text style={[styles.modernVaReceiptVal, { color: textPrimary }]} numberOfLines={1}>
                  {studentInfo.className || 'Siswa Aktif'}
                  {studentInfo.nisn ? ` • ${studentInfo.nisn}` : ''}
                </Text>
              </View>
            )}
          </View>

          {/* 6. Minimalist Security Reassurance */}
          <View
            style={[
              styles.modernVaSecurityRow,
              {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7',
              },
            ]}
          >
            <Text style={[styles.modernVaSecurityText, { color: isDark ? '#A7F3D0' : '#166534' }]}>
              Pembayaran otomatis terverifikasi sistem tanpa upload bukti transfer.
            </Text>
          </View>
        </View>

        {/* Cara Pembayaran Accordion */}
        <View style={styles.accordionContainer}>
          <Text style={[styles.accordionSectionHeading, { color: textPrimary }]}>
            Panduan Cara Pembayaran
          </Text>

          {/* 1. Bank BSI (Mitra Resmi) */}
          <View style={[styles.accordionCard, { backgroundColor: cardBg, borderColor }]}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setExpandedGuide(expandedGuide === 'bsi' ? null : 'bsi')}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[styles.accordionTitle, { color: textPrimary, marginRight: 8 }]}>Bank BSI</Text>
                  <View style={styles.guideLogosRow}>
                    <View style={styles.guideMiniLogoBox}>
                      <Image source={PAYMENT_LOGOS.bsi_va} style={styles.guideMiniLogoImg} resizeMode="contain" />
                    </View>
                  </View>
                </View>
                <Text style={[styles.accordionSubtitle, { color: textSecondary }]}>
                  BSI Mobile, ATM BSI & Net Banking (Mitra Resmi)
                </Text>
              </View>
              <Ionicons
                name={expandedGuide === 'bsi' ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.primary || '#4F46E5'}
              />
            </TouchableOpacity>

            {expandedGuide === 'bsi' && (
              <View style={styles.accordionBody}>
                {/* Sub 1: BSI Mobile */}
                <Text style={[styles.guideSubChannelHeading, { color: textPrimary }]}>• Melalui BSI Mobile:</Text>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>1</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Buka aplikasi <Text style={{ fontWeight: '700' }}>BSI Mobile</Text> lalu pilih menu <Text style={{ fontWeight: '700' }}>Bayar / Beli</Text>.
                  </Text>
                </View>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>2</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Pilih menu <Text style={{ fontWeight: '700' }}>Akademik / Institusi</Text> (atau Virtual Account).
                  </Text>
                </View>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>3</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    {activeBillerCode ? (
                      <>
                        Masukkan Kode Institusi <Text style={{ fontWeight: '700' }}>{activeBillerCode}</Text> dan Nomor VA <Text style={{ fontWeight: '700' }}>{activeVaNumber}</Text>.
                      </>
                    ) : (
                      <>
                        Masukkan Nomor Virtual Account <Text style={{ fontWeight: '700' }}>{activeVaNumber}</Text>.
                      </>
                    )}
                  </Text>
                </View>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>4</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Validasi nama siswa, nominal pembayaran, lalu masukkan <Text style={{ fontWeight: '700' }}>PIN BSI Mobile</Text> Anda.
                  </Text>
                </View>

                {/* Sub 2: ATM BSI */}
                <Text style={[styles.guideSubChannelHeading, { color: textPrimary, marginTop: 10 }]}>• Melalui ATM BSI:</Text>
                <Text style={[styles.collapsedGuideText, { color: textSecondary }]}>
                  Masukkan Kartu & PIN ATM BSI » Menu Pembayaran / Beli » Institusi / Akademik » Masukkan {activeBillerCode ? `Kode ${activeBillerCode} + ` : ''}{activeVaNumber} » Konfirmasi nama siswa & nominal » Tekan Ya.
                </Text>
              </View>
            )}
          </View>

          {/* 2. Bank Lain (BCA, Mandiri, BRI, BNI) */}
          <View style={[styles.accordionCard, { backgroundColor: cardBg, borderColor }]}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setExpandedGuide(expandedGuide === 'other_banks' ? null : 'other_banks')}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[styles.accordionTitle, { color: textPrimary, marginRight: 8 }]}>Bank Lain</Text>
                  <View style={styles.guideLogosRow}>
                    <View style={styles.guideMiniLogoBox}>
                      <Image source={PAYMENT_LOGOS.bca_va} style={styles.guideMiniLogoImg} resizeMode="contain" />
                    </View>
                    <View style={styles.guideMiniLogoBox}>
                      <Image source={PAYMENT_LOGOS.mandiri_va} style={styles.guideMiniLogoImg} resizeMode="contain" />
                    </View>
                    <View style={styles.guideMiniLogoBox}>
                      <Image source={PAYMENT_LOGOS.bri_va} style={styles.guideMiniLogoImg} resizeMode="contain" />
                    </View>
                    <View style={styles.guideMiniLogoBox}>
                      <Image source={PAYMENT_LOGOS.bni_va} style={styles.guideMiniLogoImg} resizeMode="contain" />
                    </View>
                  </View>
                </View>
                <Text style={[styles.accordionSubtitle, { color: textSecondary }]}>
                  Transfer Antar Bank ke Rekening BSI (Kode: 451)
                </Text>
              </View>
              <Ionicons
                name={expandedGuide === 'other_banks' ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.primary || '#4F46E5'}
              />
            </TouchableOpacity>

            {expandedGuide === 'other_banks' && (
              <View style={styles.accordionBody}>
                <View style={[styles.guideQuickRefBox, { backgroundColor: isDark ? '#1A2136' : '#F8FAFC', borderColor }]}>
                  <View>
                    <Text style={{ fontSize: 11, color: textSecondary, fontWeight: '600' }}>KODE BANK BSI</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: textPrimary }}>451</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleCopy('451', 'bank_code')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark ? '#202940' : '#EEF2FF',
                      paddingHorizontal: 9,
                      paddingVertical: 4.5,
                      borderRadius: 7,
                    }}
                  >
                    <Ionicons
                      name={copiedKey === 'bank_code' ? 'checkmark' : 'copy-outline'}
                      size={12}
                      color={theme.primary || '#4F46E5'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary || '#4F46E5' }}>
                      {copiedKey === 'bank_code' ? 'Tersalin' : 'Salin'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sub: Mobile Banking */}
                <Text style={[styles.guideSubChannelHeading, { color: textPrimary }]}>
                  • Transfer via Mobile Banking (m-BCA, Livin, BRImo, BNI):
                </Text>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>1</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Buka m-Banking bank Anda lalu pilih <Text style={{ fontWeight: '700' }}>Transfer Antar Bank</Text> / <Text style={{ fontWeight: '700' }}>Transfer ke Bank Lain</Text>.
                  </Text>
                </View>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>2</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Pilih bank tujuan <Text style={{ fontWeight: '700' }}>Bank Syariah Indonesia (BSI)</Text> atau masukkan kode <Text style={{ fontWeight: '700' }}>451</Text>.
                  </Text>
                </View>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>3</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Masukkan nomor rekening tujuan dengan Nomor VA: <Text style={{ fontWeight: '700' }}>{activeVaNumber}</Text>.
                  </Text>
                </View>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>4</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Masukkan nominal transfer <Text style={{ fontWeight: '700' }}>Rp {totalAmountWaiting.toLocaleString('id-ID')}</Text> sesuai tagihan.
                  </Text>
                </View>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>5</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Pastikan nama penerima adalah nama siswa / sekolah, lalu masukkan PIN m-Banking untuk menyelesaikan.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* 3. E-Wallet & QRIS */}
          <View style={[styles.accordionCard, { backgroundColor: cardBg, borderColor }]}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setExpandedGuide(expandedGuide === 'ewallet' ? null : 'ewallet')}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[styles.accordionTitle, { color: textPrimary, marginRight: 8 }]}>E-Wallet</Text>
                  <View style={styles.guideLogosRow}>
                    <View style={styles.guideMiniLogoBox}>
                      <Image source={PAYMENT_LOGOS.gopay} style={styles.guideMiniLogoImg} resizeMode="contain" />
                    </View>
                    <View style={styles.guideMiniLogoBox}>
                      <Image source={PAYMENT_LOGOS.ovo} style={styles.guideMiniLogoImg} resizeMode="contain" />
                    </View>
                    <View style={styles.guideMiniLogoBox}>
                      <Image source={PAYMENT_LOGOS.dana} style={styles.guideMiniLogoImg} resizeMode="contain" />
                    </View>
                    <View style={styles.guideMiniLogoBox}>
                      <Image source={PAYMENT_LOGOS.shopeepay} style={styles.guideMiniLogoImg} resizeMode="contain" />
                    </View>
                  </View>
                </View>
                <Text style={[styles.accordionSubtitle, { color: textSecondary }]}>
                  Transfer Saldo ke Rekening BSI VA
                </Text>
              </View>
              <Ionicons
                name={expandedGuide === 'ewallet' ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.primary || '#4F46E5'}
              />
            </TouchableOpacity>

            {expandedGuide === 'ewallet' && (
              <View style={styles.accordionBody}>
                <Text style={[styles.guideSubChannelHeading, { color: textPrimary }]}>
                  • Transfer Saldo dari GoPay, DANA, OVO & ShopeePay:
                </Text>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>1</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Buka aplikasi e-wallet Anda (GoPay, DANA, OVO, atau ShopeePay).
                  </Text>
                </View>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>2</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Pilih menu <Text style={{ fontWeight: '700' }}>Transfer / Kirim Uang ke Rekening Bank</Text>.
                  </Text>
                </View>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>3</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Pilih bank tujuan <Text style={{ fontWeight: '700' }}>Bank Syariah Indonesia (BSI)</Text> (Kode: 451).
                  </Text>
                </View>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>4</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Masukkan nomor rekening dengan Nomor VA: <Text style={{ fontWeight: '700' }}>{activeVaNumber}</Text>.
                  </Text>
                </View>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>5</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Masukkan nominal transfer <Text style={{ fontWeight: '700' }}>Rp {totalAmountWaiting.toLocaleString('id-ID')}</Text> lalu masukkan PIN e-wallet.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* 4. Gerai Retail & Lainnya */}
          <View style={[styles.accordionCard, { backgroundColor: cardBg, borderColor }]}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setExpandedGuide(expandedGuide === 'retail' ? null : 'retail')}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[styles.accordionTitle, { color: textPrimary, marginRight: 8 }]}>Gerai Retail & Teller</Text>
                  <View style={styles.guideLogosRow}>
                    <View style={styles.guideMiniLogoBox}>
                      <Image source={PAYMENT_LOGOS.indomaret} style={styles.guideMiniLogoImg} resizeMode="contain" />
                    </View>
                    <View style={styles.guideMiniLogoBox}>
                      <Image source={PAYMENT_LOGOS.alfamart} style={styles.guideMiniLogoImg} resizeMode="contain" />
                    </View>
                  </View>
                </View>
                <Text style={[styles.accordionSubtitle, { color: textSecondary }]}>
                  Kasir Indomaret, Alfamart & Teller Bank
                </Text>
              </View>
              <Ionicons
                name={expandedGuide === 'retail' ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.primary || '#4F46E5'}
              />
            </TouchableOpacity>

            {expandedGuide === 'retail' && (
              <View style={styles.accordionBody}>
                <Text style={[styles.guideSubChannelHeading, { color: textPrimary }]}>• Kasir Indomaret / Alfamart:</Text>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>1</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Kunjungi kasir Indomaret atau Alfamart terdekat.
                  </Text>
                </View>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>2</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Sampaikan ke kasir ingin melakukan <Text style={{ fontWeight: '700' }}>Pembayaran Tagihan Sekolah / VA BSI</Text>.
                  </Text>
                </View>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>3</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Tunjukkan Nomor VA <Text style={{ fontWeight: '700' }}>{activeVaNumber}</Text> ke kasir.
                  </Text>
                </View>
                <View style={styles.instructionStepRow}>
                  <View style={[styles.stepNumberCircle, { backgroundColor: isDark ? '#1E2544' : '#EEF2FF' }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary || '#4F46E5' }]}>4</Text>
                  </View>
                  <Text style={[styles.stepInstructionText, { color: textPrimary }]}>
                    Kasir akan mengonfirmasi nama siswa dan nominal tagihan. Bayar dan simpan struk pembayaran.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Actions dengan Gradien Tema Inobel */}
        <TouchableOpacity
          style={[styles.checkoutCtaButtonWrapper, { marginTop: 24 }]}
          onPress={handleCheckPaymentStatus}
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

        {/* Tombol Simulasi Pembayaran Lunas (Khusus Testing UI & Animasi) */}
        <TouchableOpacity
          style={[
            styles.simulationPaySuccessBtn,
            {
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
              borderColor: isDark ? 'rgba(16, 185, 129, 0.45)' : '#6EE7B7',
            },
          ]}
          onPress={handleSimulatePaymentSuccess}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-done-circle" size={17} color="#059669" style={{ marginRight: 6 }} />
          <Text style={[styles.simulationPaySuccessText, { color: isDark ? '#34D399' : '#059669' }]}>
            Simulasi Pembayaran Lunas (Tes Animasi)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.outlineSecondaryButton, { borderColor, marginTop: 10 }]}
          onPress={() => setCurrentStep('list')}
          activeOpacity={0.7}
        >
          <Text style={[styles.outlineSecondaryButtonText, { color: textPrimary }]}>
            Kembali ke Beranda Tagihan
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. LAYAR 4: BUKTI PEMBAYARAN (KWITANSI DIGITAL RESMI & LUNAS)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderScreenSuccess = () => {
    const targetBill = selectedBills[0] || nextUrgentBill || bills[0];
    const billIdPad = targetBill?.id ? String(targetBill.id).padStart(6, '0') : '000042';
    const invoiceNumber = targetBill?.nomor_invoice || targetBill?.invoice?.invoiceNo || `#INV-${billIdPad}`;
    const journalNumber = targetBill?.nomor_jurnal || targetBill?.nomor_jurnal_pembukuan || `JRN-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${String(targetBill?.id || 42).padStart(4, '0')}`;
    const referenceNumber = targetBill?.nomor_referensi || `REF-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${billIdPad}`;
    const receiptTxNumber = targetBill?.nomor_pembayaran
      ? `TRX-${targetBill.nomor_pembayaran}`
      : `TRX-${billIdPad}`;
    const vaNumber = targetBill?.nomor_pembayaran || (selectedBills[0]?.nomor_pembayaran || '9881234567890123');
    const billerCode = targetBill?.kode_biller || studentInfo?.billerCode || '10023';
    const h2hVerificationCode = targetBill?.kode_keabsahan || `H2H-${String(targetBill?.id || 42).padStart(8, '0')}`;
    const transactionTime = targetBill?.waktu_transaksi_format || (
      new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ', ' +
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
      ' WIB'
    );
    const channelName = targetBill?.channel_pembayaran || selectedMethod?.name || 'BSI Hasanah Virtual Account (H2H)';
    // Resolve logo channel: cocokkan dari ALL_PAYMENT_METHODS berdasarkan code/shortName/id yang ada di channelName
    const resolvedChannelMethod = ALL_PAYMENT_METHODS.find((m) => {
      const hay = channelName.toLowerCase();
      return (
        hay.includes(m.code.toLowerCase()) ||
        hay.includes(m.shortName.toLowerCase()) ||
        hay.includes(m.id.toLowerCase())
      );
    }) || selectedMethod;
    const studentName = targetBill?.nama_siswa || studentInfo?.fullName || studentInfo?.name || STUDENT_DATA.fullName;
    const studentNisn = targetBill?.nisn_siswa || studentInfo?.nisn || STUDENT_DATA.nisn;
    const studentClass = studentInfo?.className || STUDENT_DATA.className;
    const academicYear = targetBill?.tahun_ajaran || studentInfo?.academicYear || STUDENT_DATA.academicYear;
    const totalAmount = grandTotalCheckout || targetBill?.amount || 0;
    const stampDateText = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '.');

    // Interpolasi Halo Rings
    const ring1Scale = ringAnim1.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 2.5],
    });
    const ring1Opacity = ringAnim1.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0.85, 0.5, 0],
    });

    const ring2Scale = ringAnim2.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 2.0],
    });
    const ring2Opacity = ringAnim2.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0.75, 0.4, 0],
    });

    const ring3Scale = ringAnim3.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1.5],
    });
    const ring3Opacity = ringAnim3.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0.65, 0.3, 0],
    });

    // Interpolasi Cincin Loop Berkelanjutan (Selalu Ada Animasinya)
    const continuousRing1Scale = loopRing1.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 2.3],
    });
    const continuousRing1Opacity = loopRing1.interpolate({
      inputRange: [0, 0.35, 1],
      outputRange: [0.65, 0.35, 0],
    });

    const continuousRing2Scale = loopRing2.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 2.3],
    });
    const continuousRing2Opacity = loopRing2.interpolate({
      inputRange: [0, 0.35, 1],
      outputRange: [0.65, 0.35, 0],
    });

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

        {/* Hero Interactive Celebration Container */}
        <View style={styles.cleanSuccessHero}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleReplayCelebration}
            style={styles.heroInteractiveTouchable}
          >
            {/* Cincin Gelombang Berkelanjutan (Loop Selalu Aktif) */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pulseHaloRing,
                {
                  borderColor: '#10B981',
                  transform: [{ scale: continuousRing1Scale }],
                  opacity: continuousRing1Opacity,
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pulseHaloRing,
                {
                  borderColor: '#34D399',
                  transform: [{ scale: continuousRing2Scale }],
                  opacity: continuousRing2Opacity,
                },
              ]}
            />

            {/* Concentric Halo Pulse Rings (Burst Masuk & Replay) */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pulseHaloRing,
                {
                  borderColor: '#10B981',
                  transform: [{ scale: ring1Scale }],
                  opacity: ring1Opacity,
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pulseHaloRing,
                {
                  borderColor: '#34D399',
                  transform: [{ scale: ring2Scale }],
                  opacity: ring2Opacity,
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pulseHaloRing,
                {
                  borderColor: '#6EE7B7',
                  transform: [{ scale: ring3Scale }],
                  opacity: ring3Opacity,
                },
              ]}
            />

            {/* Floating Dynamic Confetti & Sparkles */}
            {CELEBRATION_PARTICLES.map((p) => {
              const rad = (p.angle * Math.PI) / 180;
              const targetX = Math.cos(rad) * p.distance;
              const targetY = Math.sin(rad) * p.distance;

              const translateX = confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, targetX],
              });
              const translateY = confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, targetY],
              });
              const scale = confettiAnim.interpolate({
                inputRange: [0, 0.25, 0.8, 1],
                outputRange: [0.1, 1.3, 1, 0.6],
              });
              const opacity = confettiAnim.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [1, 1, 0],
              });
              const rotate = confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${(p.id % 2 === 0 ? 1 : -1) * 240}deg`],
              });

              return (
                <Animated.View
                  key={p.id}
                  pointerEvents="none"
                  style={[
                    styles.celebrationParticle,
                    {
                      width: p.size,
                      height: p.shape === 'rect' ? p.size * 1.6 : p.size,
                      borderRadius: p.shape === 'circle' ? p.size / 2 : 2,
                      backgroundColor: p.color,
                      transform: [{ translateX }, { translateY }, { scale }, { rotate }],
                      opacity,
                    },
                  ]}
                />
              );
            })}

            {/* Glowing Breathing Aura */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.heroAuraBackdrop,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.22)' : '#D1FAE5',
                  transform: [{ scale: heroAuraAnim }],
                },
              ]}
            />

            {/* Checkmark Badge dengan Spring Bounce & Denyut Hidup Berkelanjutan */}
            <Animated.View
              style={[
                styles.heroCheckCircle,
                {
                  transform: [
                    { scale: heroScaleAnim },
                    { scale: loopHeroPulse },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCheckCircleGradient}
              >
                <Ionicons name="checkmark" size={44} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          {/* Title & Amount with Scale Pop */}
          <Animated.View
            style={{
              alignItems: 'center',
              transform: [{ scale: amountScaleAnim }],
            }}
          >
            <Text style={[styles.cleanSuccessTitle, { color: textPrimary }]}>
              Pembayaran Berhasil!
            </Text>
            <Text style={[styles.cleanSuccessAmount, { color: theme.primary || '#4F46E5' }]}>
              Rp {totalAmount.toLocaleString('id-ID')}
            </Text>
          </Animated.View>

          {/* Keterangan Pembayaran Otomatis H2H Perbankan (Teks Lebih Kecil, Miring & Transparan) */}
          <Animated.View
            style={{
              opacity: badgesOpacityAnim,
              transform: [{ translateY: badgesSlideAnim }],
              alignItems: 'center',
              paddingHorizontal: 28,
              marginTop: 4,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontStyle: 'italic',
                color: textSecondary,
                opacity: 0.65,
                textAlign: 'center',
                lineHeight: 16.5,
                fontWeight: '400',
              }}
            >
              Pembayaran telah terverifikasi lunas secara otomatis melalui sistem Host-to-Host (H2H) perbankan mitra.
            </Text>
          </Animated.View>
        </View>

        {/* Kwitansi Ticket Card dengan Desain Bukti Transfer Resmi & Stempel Sungguhan */}
        <Animated.View
          style={[
            styles.cleanReceiptCard,
            {
              backgroundColor: cardBg,
              borderColor,
              opacity: ticketOpacity,
              transform: [{ translateY: ticketTranslateY }, { scale: ticketScale }],
            },
          ]}
        >
          {/* Header Kwitansi */}
          <View style={styles.ticketHeaderContainer}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={[styles.ticketHeaderTitle, { color: textPrimary }]}>
                  KWITANSI PEMBAYARAN
                </Text>
              </View>
              <Text style={[styles.ticketHeaderSubtitle, { color: textSecondary }]}>
                Bukti Sah Penerimaan Pembayaran Keuangan Sekolah
              </Text>
            </View>
          </View>

          <View style={[styles.cleanDivider, { backgroundColor: borderColor, marginVertical: 10 }]} />

          {/* Perforated Notches */}
          <View style={[styles.ticketNotchLeft, { backgroundColor: bgColor }]} />
          <View style={[styles.ticketNotchRight, { backgroundColor: bgColor }]} />

          {/* Metadata Rows: Nomor Dokumen Resmi dari Database */}
          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>No. Kwitansi</Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => handleCopy(invoiceNumber, 'invoice_no')}
              activeOpacity={0.7}
            >
              <Text style={[styles.cleanMetaVal, { color: textPrimary, marginRight: 5, fontWeight: '700' }]}>
                {invoiceNumber}
              </Text>
              <Ionicons
                name={copiedKey === 'invoice_no' ? 'checkmark-circle' : 'copy-outline'}
                size={13}
                color={copiedKey === 'invoice_no' ? '#10B981' : (theme.primary || '#4F46E5')}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>No. Jurnal Pembukuan</Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => handleCopy(journalNumber, 'journal_no')}
              activeOpacity={0.7}
            >
              <Text style={[styles.cleanMetaVal, { color: textPrimary, marginRight: 5, fontSize: 11.5, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                {journalNumber}
              </Text>
              <Ionicons
                name={copiedKey === 'journal_no' ? 'checkmark-circle' : 'copy-outline'}
                size={13}
                color={copiedKey === 'journal_no' ? '#10B981' : (theme.primary || '#4F46E5')}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>No. Referensi Transaksi</Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => handleCopy(referenceNumber, 'ref_no')}
              activeOpacity={0.7}
            >
              <Text style={[styles.cleanMetaVal, { color: textPrimary, marginRight: 5 }]}>
                {referenceNumber}
              </Text>
              <Ionicons
                name={copiedKey === 'ref_no' ? 'checkmark-circle' : 'copy-outline'}
                size={13}
                color={copiedKey === 'ref_no' ? '#10B981' : (theme.primary || '#4F46E5')}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>Virtual Account</Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => handleCopy(vaNumber, 'va_no')}
              activeOpacity={0.7}
            >
              <Text style={[styles.cleanMetaVal, { color: textPrimary, marginRight: 5 }]}>
                {vaNumber}
              </Text>
              <Ionicons
                name={copiedKey === 'va_no' ? 'checkmark-circle' : 'copy-outline'}
                size={13}
                color={copiedKey === 'va_no' ? '#10B981' : (theme.primary || '#4F46E5')}
              />
            </TouchableOpacity>
          </View>

          {billerCode ? (
            <View style={styles.cleanMetaRow}>
              <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>Kode Biller</Text>
              <Text style={[styles.cleanMetaVal, { color: textPrimary }]}>{billerCode}</Text>
            </View>
          ) : null}

          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>Waktu Transaksi</Text>
            <Text style={[styles.cleanMetaVal, { color: textPrimary }]}>
              {transactionTime}
            </Text>
          </View>

          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>Kanal Pembayaran</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {resolvedChannelMethod?.logo ? (
                <Image
                  source={resolvedChannelMethod.logo}
                  style={[styles.receiptMethodLogoTitleImage, { marginRight: 4 }]}
                  resizeMode="contain"
                />
              ) : null}
              <Text style={[styles.cleanMetaVal, { color: textPrimary, flexShrink: 1 }]} numberOfLines={2}>
                {resolvedChannelMethod?.category === 'Virtual Account'
                  ? `VA ${resolvedChannelMethod.shortName}`
                  : resolvedChannelMethod?.category === 'E-Wallet & QRIS'
                    ? resolvedChannelMethod.shortName
                    : resolvedChannelMethod?.category === 'Gerai Retail'
                      ? `Gerai ${resolvedChannelMethod.shortName}`
                      : channelName}
              </Text>
            </View>
          </View>

          <View style={[styles.cleanDivider, { backgroundColor: borderColor, marginVertical: 10 }]} />

          {/* Section: Identitas Siswa & Akademik */}
          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>Nama Siswa</Text>
            <Text style={[styles.cleanMetaVal, { color: textPrimary, fontWeight: '700' }]} numberOfLines={1}>
              {studentName}
            </Text>
          </View>

          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>NISN / Kelas</Text>
            <Text style={[styles.cleanMetaVal, { color: textPrimary }]}>
              {studentNisn} • {studentClass}
            </Text>
          </View>

          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>Tahun Ajaran</Text>
            <Text style={[styles.cleanMetaVal, { color: textPrimary }]}>
              {academicYear}
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.cleanDivider, { backgroundColor: borderColor, marginVertical: 14 }]} />

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
          <View style={[styles.cleanDivider, { backgroundColor: borderColor, marginVertical: 14 }]} />

          {/* Total Row */}
          <View style={styles.cleanTotalRow}>
            <Text style={[styles.cleanTotalLabel, { color: textPrimary }]}>Total Pembayaran</Text>
            <Text style={[styles.cleanTotalAmount, { color: theme.primary || '#4F46E5' }]}>
              Rp {totalAmount.toLocaleString('id-ID')}
            </Text>
          </View>

          {/* Security Guarantee Seal Footer dengan QR Code Keabsahan Resmi (Sama dengan Web PDF) */}
          <View style={[styles.ticketSecurityRow, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC', borderColor }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Keabsahan Elektronik
                </Text>
              </View>
              <Text style={[styles.ticketSecurityText, { color: textSecondary, lineHeight: 14.5 }]}>
                Dokumen sah digital terverifikasi otomatis sistem perbankan mitra.
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ fontSize: 9.5, fontWeight: '600', color: textSecondary }}>No. Jurnal: </Text>
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: textPrimary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                  {journalNumber}
                </Text>
              </View>
            </View>

            {/* QR Code Keabsahan (Sama persis dengan format Web Kwitansi PDF) */}
            <View style={[styles.ticketQrBadgeContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#CBD5E1' }]}>
              <View style={styles.ticketQrIconWrap}>
                <Ionicons name="qr-code" size={44} color={isDark ? '#F8FAFC' : '#0F172A'} />
              </View>
              <Text style={[styles.ticketQrVerifiedText, { color: textPrimary }]}>SECURE VERIFIED</Text>
              <Text style={styles.ticketQrCodeText}>{h2hVerificationCode}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Buttons */}
        <TouchableOpacity
          style={styles.checkoutCtaButtonWrapper}
          onPress={handleDownloadFormalPdf}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={theme.primaryGradient || (isDark ? ['#6366F1', '#818CF8'] : ['#4F46E5', '#6366F1'])}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutCtaButtonGradient}
          >
            <Ionicons name="document-text-outline" size={19} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.checkoutCtaButtonText}>Unduh Kwitansi Formal (PDF)</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.outlineSecondaryButton, { borderColor, marginTop: 10 }]}
          onPress={() => {
            const target = selectedBills[0] || nextUrgentBill || bills[0];
            const identifier = target?.id || target?.nomor_pembayaran || 1;
            const pdfUrl = billingApi.getInvoicePdfUrl(identifier);
            Share.share({
              message: `Kwitansi Resmi Pembayaran Siswa\nNo. Invoice: ${invoiceNumber}\nNo. Jurnal: ${journalNumber}\nNo. Referensi: ${referenceNumber}\nNama Siswa: ${studentName} (${studentClass})\nStatus: LUNAS (Verified)\nTotal: Rp ${totalAmount.toLocaleString('id-ID')}\nUnduh Berkas PDF Formal: ${pdfUrl}`,
              title: 'Kwitansi Tagihan Sekolah',
            });
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={17} color={textPrimary} style={{ marginRight: 8 }} />
          <Text style={[styles.outlineSecondaryButtonText, { color: textPrimary }]}>
            Bagikan Bukti Pembayaran
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.outlineSecondaryButton, { borderColor, marginTop: 10 }]}
          onPress={() => {
            if (onBack) {
              onBack();
            } else {
              setCurrentStep('list');
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="home-outline" size={17} color={textSecondary} style={{ marginRight: 8 }} />
          <Text style={[styles.outlineSecondaryButtonText, { color: textSecondary }]}>
            Kembali ke Beranda Tagihan
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchBillsData(false)}
            tintColor={theme.primary || '#4F46E5'}
            colors={[theme.primary || '#4F46E5']}
          />
        }
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
              {(studentInfo && studentInfo.fullName) || STUDENT_DATA.fullName} • {(studentInfo && studentInfo.className) || STUDENT_DATA.className}
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

                  {/* Anti-loncat bulan parent unpaid warning */}
                  {item.parent_unpaid && (
                    <View style={styles.parentUnpaidBadge}>
                      <Ionicons name="lock-closed" size={11} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text style={styles.parentUnpaidText} numberOfLines={1}>
                        Terkunci (Bayar {item.parent_name || 'Sebelumnya'})
                      </Text>
                    </View>
                  )}

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
                        <Text style={styles.cleanInvoiceActionBtnText}>Lihat Kwitansi</Text>
                      </TouchableOpacity>
                    ) : item.parent_unpaid ? (
                      <TouchableOpacity
                        style={[
                          styles.cleanPayActionBtn,
                          {
                            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                            borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
                          },
                        ]}
                        onPress={() => handleSelectBillFromAllModal(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="lock-closed"
                          size={13}
                          color="#EF4444"
                          style={{ marginRight: 3 }}
                        />
                        <Text
                          style={[
                            styles.cleanPayActionBtnText,
                            { color: '#EF4444' },
                          ]}
                        >
                          Terkunci
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.cleanPayActionBtn,
                          {
                            backgroundColor: theme.primary || '#4F46E5',
                            borderColor: theme.primary || '#4F46E5',
                            paddingHorizontal: 12,
                          },
                        ]}
                        onPress={() => handleSelectBillFromAllModal(item)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.cleanPayActionBtnText,
                            { color: '#FFFFFF' },
                          ]}
                        >
                          Bayar
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={13}
                          color="#FFFFFF"
                          style={{ marginLeft: 3 }}
                        />
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
      invoiceNo: selectedInvoiceBill?.nomor_invoice || `KWT-${String(selectedInvoiceBill.id).padStart(6, '0')}`,
      paidAt: selectedInvoiceBill.paidAt || selectedInvoiceBill?.waktu_transaksi_format || 'Telah Diverifikasi',
      paymentMethod: selectedInvoiceBill?.channel_pembayaran || 'BSI Virtual Account',
      paymentLogo: PAYMENT_LOGOS.bsi_va,
      transactionId: selectedInvoiceBill?.nomor_referensi || `EDP-TRX-${String(selectedInvoiceBill.id).padStart(8, '0')}`,
      baseAmount: selectedInvoiceBill.amount,
      adminFee: selectedInvoiceBill?.admin_fee || 0,
      totalAmount: selectedInvoiceBill?.total_amount || selectedInvoiceBill.amount,
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
          <Text style={[styles.subScreenHeaderTitle, { color: textPrimary }]}>Kwitansi Pembayaran</Text>
          <TouchableOpacity
            style={[styles.circleBackButton, { backgroundColor: cardBg, borderColor }]}
            onPress={() => handleShareInvoice(selectedInvoiceBill)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={18} color={textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Ticket Card (sama desain dengan post-payment) ── */}
        <View style={[styles.cleanReceiptCard, { backgroundColor: cardBg, borderColor }]}>

          {/* Header */}
          <View style={styles.ticketHeaderContainer}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={[styles.ticketHeaderTitle, { color: textPrimary }]}>KWITANSI PEMBAYARAN</Text>
              </View>
              <Text style={[styles.ticketHeaderSubtitle, { color: textSecondary }]}>
                Bukti Sah Penerimaan Pembayaran Keuangan Sekolah
              </Text>
            </View>
          </View>

          <View style={[styles.cleanDivider, { backgroundColor: borderColor, marginVertical: 10 }]} />
          <View style={[styles.ticketNotchLeft, { backgroundColor: bgColor }]} />
          <View style={[styles.ticketNotchRight, { backgroundColor: bgColor }]} />

          {/* ── Nomor Dokumen ── */}
          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>No. Kwitansi</Text>
            <Text style={[styles.cleanMetaVal, { color: textPrimary, fontWeight: '700' }]}>{inv.invoiceNo}</Text>
          </View>

          {selectedInvoiceBill?.nomor_jurnal ? (
            <View style={styles.cleanMetaRow}>
              <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>No. Jurnal Pembukuan</Text>
              <Text style={[styles.cleanMetaVal, { color: textPrimary, fontSize: 11.5, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                {selectedInvoiceBill.nomor_jurnal}
              </Text>
            </View>
          ) : null}

          {selectedInvoiceBill?.nomor_referensi ? (
            <View style={styles.cleanMetaRow}>
              <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>No. Referensi</Text>
              <Text style={[styles.cleanMetaVal, { color: textPrimary }]}>{selectedInvoiceBill.nomor_referensi}</Text>
            </View>
          ) : null}

          {selectedInvoiceBill?.nomor_pembayaran ? (
            <View style={styles.cleanMetaRow}>
              <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>Virtual Account</Text>
              <Text style={[styles.cleanMetaVal, { color: textPrimary }]}>{selectedInvoiceBill.nomor_pembayaran}</Text>
            </View>
          ) : null}

          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>Waktu Transaksi</Text>
            <Text style={[styles.cleanMetaVal, { color: textPrimary }]}>{inv.paidAt}</Text>
          </View>

          {/* Kanal Pembayaran dengan logo dinamis */}
          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>Kanal Pembayaran</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, justifyContent: 'flex-end' }}>
              {(() => {
                const chName = selectedInvoiceBill?.channel_pembayaran || inv.paymentMethod || '';
                const matched = ALL_PAYMENT_METHODS.find((m) => {
                  const h = chName.toLowerCase();
                  return h.includes(m.code.toLowerCase()) || h.includes(m.shortName.toLowerCase()) || h.includes(m.id.toLowerCase());
                });
                const logo = matched?.logo || inv.paymentLogo;
                return (
                  <>
                    {logo && <Image source={logo} style={[styles.receiptMethodLogoTitleImage, { marginRight: 4 }]} resizeMode="contain" />}
                    <Text style={[styles.cleanMetaVal, { color: textPrimary, flexShrink: 1 }]} numberOfLines={2}>
                      {matched
                        ? matched.category === 'Virtual Account'
                          ? `VA ${matched.shortName}`
                          : matched.category === 'E-Wallet & QRIS'
                            ? matched.shortName
                            : matched.category === 'Gerai Retail'
                              ? `Gerai ${matched.shortName}`
                              : chName
                        : chName || inv.paymentMethod}
                    </Text>
                  </>
                );
              })()}
            </View>
          </View>

          <View style={[styles.cleanDivider, { backgroundColor: borderColor, marginVertical: 10 }]} />

          {/* ── Identitas Siswa ── */}
          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>Nama Siswa</Text>
            <Text style={[styles.cleanMetaVal, { color: textPrimary, fontWeight: '700' }]} numberOfLines={1}>
              {selectedInvoiceBill?.nama_siswa || (studentInfo && studentInfo.fullName) || STUDENT_DATA.fullName}
            </Text>
          </View>

          <View style={styles.cleanMetaRow}>
            <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>NISN / Kelas</Text>
            <Text style={[styles.cleanMetaVal, { color: textPrimary }]}>
              {(studentInfo && studentInfo.nisn) || STUDENT_DATA.nisn} • {(studentInfo && studentInfo.className) || STUDENT_DATA.className}
            </Text>
          </View>

          {(studentInfo?.academicYear || STUDENT_DATA.academicYear) ? (
            <View style={styles.cleanMetaRow}>
              <Text style={[styles.cleanMetaKey, { color: textSecondary }]}>Tahun Ajaran</Text>
              <Text style={[styles.cleanMetaVal, { color: textPrimary }]}>
                {studentInfo?.academicYear || STUDENT_DATA.academicYear}
              </Text>
            </View>
          ) : null}

          <View style={[styles.cleanDivider, { backgroundColor: borderColor, marginVertical: 14 }]} />

          {/* ── Rincian Pembayaran ── */}
          <Text style={[styles.cleanRincianHeading, { color: textSecondary }]}>RINCIAN PEMBAYARAN</Text>
          <View style={styles.cleanItemList}>
            <View style={styles.cleanItemRow}>
              <Text style={[styles.cleanItemName, { color: textPrimary }]} numberOfLines={1}>
                {selectedInvoiceBill.title}
              </Text>
              <Text style={[styles.cleanItemAmount, { color: textPrimary }]}>
                Rp {inv.baseAmount.toLocaleString('id-ID')}
              </Text>
            </View>
            <View style={styles.cleanItemRow}>
              <Text style={[styles.cleanItemName, { color: textSecondary }]}>Biaya Layanan</Text>
              <Text style={[styles.cleanItemAmount, { color: textSecondary }]}>
                Rp {inv.adminFee.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>

          <View style={[styles.cleanDivider, { backgroundColor: borderColor, marginVertical: 14 }]} />

          {/* ── Total ── */}
          <View style={styles.cleanTotalRow}>
            <Text style={[styles.cleanTotalLabel, { color: textPrimary }]}>Total Pembayaran</Text>
            <Text style={[styles.cleanTotalAmount, { color: theme.primary || '#4F46E5' }]}>
              Rp {inv.totalAmount.toLocaleString('id-ID')}
            </Text>
          </View>



          {/* ── Security Footer + QR Badge ── */}
          <View style={[styles.ticketSecurityRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor, marginTop: 12 }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: textPrimary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                Keabsahan Elektronik
              </Text>
              <Text style={[styles.ticketSecurityText, { color: textSecondary, lineHeight: 14.5 }]}>
                Dokumen sah digital terverifikasi otomatis sistem perbankan mitra.
              </Text>
              {selectedInvoiceBill?.nomor_jurnal ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 9.5, fontWeight: '600', color: textSecondary }}>No. Jurnal: </Text>
                  <Text style={{ fontSize: 9.5, fontWeight: '800', color: textPrimary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                    {selectedInvoiceBill.nomor_jurnal}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={[styles.ticketQrBadgeContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#CBD5E1' }]}>
              <View style={styles.ticketQrIconWrap}>
                <Ionicons name="qr-code" size={44} color={isDark ? '#F8FAFC' : '#0F172A'} />
              </View>
              <Text style={[styles.ticketQrVerifiedText, { color: textPrimary }]}>SECURE VERIFIED</Text>
              <Text style={styles.ticketQrCodeText}>
                {selectedInvoiceBill?.kode_keabsahan || `H2H-${String(selectedInvoiceBill?.id || '').padStart(8, '0')}`}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Buttons ── */}
        <View style={styles.cleanInvoiceActions}>
          <TouchableOpacity
            style={[styles.cleanInvoiceShareBtn, { backgroundColor: theme.primary || '#4F46E5' }]}
            onPress={() => handleShareInvoice(selectedInvoiceBill)}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.cleanInvoiceShareBtnText}>Bagikan Kwitansi</Text>
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
      {currentStep === 'checkout' && renderScreenWaiting()}
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
  guideLogosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guideMiniLogoBox: {
    width: 30,
    height: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.6,
    borderColor: '#E2E8F0',
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  guideMiniLogoImg: {
    width: '85%',
    height: '85%',
    alignSelf: 'center',
  },
  guideSubChannelHeading: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 4,
  },
  guideQuickRefBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
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

  // ── Modern Mobile-First Header & Inobel Digital Wallet Card ─────────────────
  modernHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modernHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  modernBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modernAvatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1C2E5A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modernAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modernHeaderTextCol: {
    flex: 1,
  },
  modernStudentName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modernStudentMeta: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },
  modernHistoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  modernHistoryText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // ── Hero Financial Summary Card Styles ──────────────────────────────────
  heroCardContainer: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
  heroWatermark: {
    position: 'absolute',
    right: -25,
    top: -25,
    opacity: 0.9,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  heroPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  heroSecurityTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroSecurityText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  heroAmountSection: {
    paddingBottom: 2,
  },
  heroAmountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.72)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  heroCurrencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    marginRight: 6,
  },
  heroAmountVal: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  heroSubLinkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  heroSubLinkText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.92)',
    marginRight: 4,
  },

  // ── Featured "Tagihan Selanjutnya" Card ────────────────────────────────────
  spayNextBillCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  spayProteksiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  spayProteksiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  spayProteksiText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  spayHeaderBillTitle: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '45%',
  },
  spayNextBillMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  spayNextBillTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  spayNextBillLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  spayAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  spayCurrencyPrefix: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  spayNextBillAmount: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  spayDueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spayDueDateText: {
    fontSize: 11.5,
    fontWeight: '500',
    flex: 1,
  },
  spayPayEarlyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  spayPayEarlyText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // All Paid celebration state
  spayAllPaidBox: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 14,
  },
  spayAllPaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    marginBottom: 10,
  },
  spayAllPaidBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.4,
  },
  spayAllPaidTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  spayAllPaidSub: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
  },
  spayViewHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  spayViewHistoryText: {
    fontSize: 12,
    fontWeight: '700',
  },

  spayCardFooterSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  spayFooterHalfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spayFooterDivider: {
    width: 1,
    height: 18,
  },
  spayFooterBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // ── Clean Streamlined Checkout & Waiting Styles ───────────────────────────
  cleanCheckoutCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cleanCheckoutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cleanCheckoutSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cleanCheckoutSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  cleanCheckoutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  cleanCheckoutBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cleanCheckoutDivider: {
    height: 1,
    marginVertical: 12,
  },
  cleanCheckoutItemsList: {
    gap: 10,
  },
  cleanCheckoutItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cleanCheckoutItemTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  cleanCheckoutItemMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  cleanCheckoutItemAmount: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  cleanCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cleanCostLabel: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  cleanCostVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  cleanTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  cleanTotalVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  cleanTimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cleanTimerText: {
    fontSize: 12.5,
    color: '#92400E',
    fontWeight: '600',
  },

  // ── Bill Card Extra Elements ──────────────────────────────────────────────
  billItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  categoryBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  categoryBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },

  // ── Parent Unpaid Badge (Anti-loncat bulan) ─────────────────────────────
  parentUnpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  parentUnpaidText: {
    color: '#EF4444',
    fontSize: 10.5,
    fontWeight: '700',
  },

  // ── Modern Virtual Account Card Styles (Fintech Mobile First) ───
  modernVaCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  modernVaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modernVaBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  modernVaBankLogoBox: {
    width: 44,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 0.8,
  },
  modernVaBankLogoImg: {
    width: '90%',
    height: '90%',
    alignSelf: 'center',
  },
  modernVaBankName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modernVaBankSub: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  modernVaStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  modernVaStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  modernVaStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  modernVaHeroPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    marginBottom: 14,
  },
  modernVaHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modernVaHeroLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  modernVaHeroHint: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  modernVaHeroMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modernVaNumber: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.4,
    flex: 1,
  },
  modernVaCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6.5,
    borderRadius: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 1.5,
  },
  modernVaCopyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modernVaBillerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 9,
  },
  modernVaBillerLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  modernVaBillerVal: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modernVaInlineCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modernVaInlineCopyText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  modernVaAmountSection: {
    marginBottom: 14,
  },
  modernVaAmountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modernVaAmountLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  modernVaAdminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  modernVaAdminBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
  },
  modernVaAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modernVaCurrency: {
    fontSize: 14,
    fontWeight: '800',
  },
  modernVaAmountVal: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  modernVaNominalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
  },
  modernVaNominalBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  modernVaDashedDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  modernVaReceiptTable: {
    gap: 8,
    marginBottom: 14,
  },
  modernVaReceiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modernVaReceiptKey: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  modernVaReceiptVal: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  modernVaMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  modernVaReceiptValHighlight: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  modernVaSecurityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  modernVaSecurityText: {
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 15,
    flex: 1,
  },

  // ── Success Payment Interactive Celebration & Kwitansi Ticket Styles ───
  heroInteractiveTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 130,
    height: 130,
    marginBottom: 12,
  },
  pulseHaloRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
  },
  celebrationParticle: {
    position: 'absolute',
  },
  heroAuraBackdrop: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  heroCheckCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  heroCheckCircleGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  receiptDocIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  ticketHeaderTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  ticketHeaderSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusVerifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusVerifiedBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  realStampContainer: {
    padding: 2,
    borderWidth: 2.2,
    borderColor: '#047857',
    borderRadius: 6,
    backgroundColor: 'rgba(4, 120, 87, 0.07)',
    transform: [{ rotate: '-13deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 2,
  },
  realStampInnerBorder: {
    borderWidth: 1.2,
    borderColor: '#047857',
    borderRadius: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  realStampStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  realStampStar: {
    fontSize: 8,
    color: '#047857',
    fontWeight: '800',
  },
  realStampDividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(4, 120, 87, 0.45)',
    marginVertical: 2,
  },
  realStampMainText: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
  },
  realStampDateText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  ticketNotchLeft: {
    position: 'absolute',
    left: -11,
    top: 60,
    width: 20,
    height: 20,
    borderRadius: 10,
    zIndex: 10,
  },
  ticketNotchRight: {
    position: 'absolute',
    right: -11,
    top: 60,
    width: 20,
    height: 20,
    borderRadius: 10,
    zIndex: 10,
  },
  ticketSecurityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  ticketSecurityText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    lineHeight: 15,
  },
  ticketQrBadgeContainer: {
    width: 88,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  ticketQrIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  ticketQrVerifiedText: {
    fontSize: 6.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  ticketQrCodeText: {
    fontSize: 6.5,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 1,
  },

  // ── Tombol Simulasi Khusus Test UI Animasi ───
  simulationPaySuccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 10,
  },
  simulationPaySuccessText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
});

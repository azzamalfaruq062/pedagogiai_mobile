import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useCanteen } from '../../hooks/useCanteen';
import AppButton from '../../components/common/AppButton';

export default function ProfileSettingsScreen({ onNavigateToCanteen, onNavigateToWallet }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { wallet } = useCanteen();

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const dynamicPaddingTop = safeTop + 62;
  const dynamicPaddingBottom = Math.max(insets.bottom || 0, 14) + 86;

  // Local preferences
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);

  // Edit profile form
  const [editName, setEditName] = useState(user?.name || wallet?.holderName || 'Pengguna');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '+62 812-3456-7890');
  const [editClass, setEditClass] = useState('Kelas Siswa');

  // Password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const displayName = user?.name || editName || 'Pengguna';
  const displayNisn = user?.nrs || (wallet?.nisn && wallet.nisn !== '0087429110' ? wallet.nisn : (user?.role === 'siswa' ? 'NISN Belum Diisi' : (user?.role ? String(user.role).toUpperCase() : '—')));

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const handleSaveProfile = () => {
    setShowProfileModal(false);
    Alert.alert('Sukses', 'Informasi profil berhasil diperbarui.');
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Peringatan', 'Harap isi semua kolom kata sandi.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Peringatan', 'Kata sandi baru dan konfirmasi tidak cocok.');
      return;
    }
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Alert.alert('Sukses', 'Kata sandi Anda berhasil diperbarui.');
  };

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Keluar',
      'Apakah Anda yakin ingin keluar dari akun?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: dynamicPaddingTop,
          paddingBottom: dynamicPaddingBottom,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. MINIMAL & CLEAN PROFILE CARD */}
      <TouchableOpacity
        style={[
          styles.profileCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
        onPress={() => setShowProfileModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.profileMainRow}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarInitials}>{initials || 'AS'}</Text>
          </View>

          <View style={styles.profileTextWrap}>
            <Text
              style={[styles.profileName, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text style={[styles.profileMeta, { color: theme.textSecondary }]}>
              NISN: {displayNisn} • {editClass}
            </Text>
            <View style={styles.tagRow}>
              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: isDark ? '#1C2346' : '#EEF2FF' },
                ]}
              >
                <Text style={[styles.badgePillText, { color: theme.primary }]}>
                  {user?.role?.toUpperCase() || 'SISWA'}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.editIconBtn, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="pencil" size={14} color={theme.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>

      {/* 2. GROUP 1: AKUN & KEAMANAN */}
      <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
        AKUN & KEAMANAN
      </Text>

      <View
        style={[
          styles.groupedCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Informasi Pribadi */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setShowProfileModal(true)}
          activeOpacity={0.6}
        >
          <View style={[styles.iconBox, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="person-outline" size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
              Informasi Pribadi
            </Text>
            <Text style={[styles.menuDesc, { color: theme.textMuted }]}>
              Nama, email, kelas & data kontak
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Keamanan & Sandi */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setShowPasswordModal(true)}
          activeOpacity={0.6}
        >
          <View style={[styles.iconBox, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
              Kata Sandi
            </Text>
            <Text style={[styles.menuDesc, { color: theme.textMuted }]}>
              Ubah kata sandi akun Anda
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* PIN & Biometrik Switch */}
        <View style={styles.menuRow}>
          <View style={[styles.iconBox, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="finger-print-outline" size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
              Biometrik & Face ID
            </Text>
            <Text style={[styles.menuDesc, { color: theme.textMuted }]}>
              Konfirmasi transaksi lebih cepat
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Batas Jajan Harian */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={onNavigateToWallet}
          activeOpacity={0.6}
        >
          <View style={[styles.iconBox, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="card-outline" size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
              Dompet & Limit Harian
            </Text>
            <Text style={[styles.menuDesc, { color: theme.textMuted }]}>
              Rp {wallet.dailyLimit.toLocaleString('id-ID')} / hari
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 3. GROUP 2: PREFERENSI */}
      <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
        PREFERENSI
      </Text>

      <View
        style={[
          styles.groupedCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Mode Gelap */}
        <View style={styles.menuRow}>
          <View style={[styles.iconBox, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons
              name={isDark ? 'moon-outline' : 'sunny-outline'}
              size={18}
              color={theme.textSecondary}
            />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
              Mode Gelap (Dark Mode)
            </Text>
            <Text style={[styles.menuDesc, { color: theme.textMuted }]}>
              {isDark ? 'Aktif' : 'Nonaktif'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Notifikasi */}
        <View style={styles.menuRow}>
          <View style={[styles.iconBox, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="notifications-outline" size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
              Notifikasi Transaksi
            </Text>
            <Text style={[styles.menuDesc, { color: theme.textMuted }]}>
              Pemberitahuan saldo dan belanja
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* 4. GROUP 3: BANTUAN & LAINNYA */}
      <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
        BANTUAN & INFORMASI
      </Text>

      <View
        style={[
          styles.groupedCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Pusat Bantuan */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setShowFaqModal(true)}
          activeOpacity={0.6}
        >
          <View style={[styles.iconBox, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="help-circle-outline" size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
              Pusat Bantuan & FAQ
            </Text>
            <Text style={[styles.menuDesc, { color: theme.textMuted }]}>
              Solusi seputar akun dan pembayaran
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Hubungi Admin */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(
              'Bantuan Sekolah',
              'Hubungi administrator sekolah:\n\n• WhatsApp: 0812-8888-9999\n• Email: support@pedagogiai.sch.id'
            )
          }
          activeOpacity={0.6}
        >
          <View style={[styles.iconBox, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="chatbubbles-outline" size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
              Hubungi Admin Sekolah
            </Text>
            <Text style={[styles.menuDesc, { color: theme.textMuted }]}>
              Layanan bantuan siswa & orang tua
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Syarat & Privasi */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(
              'Kebijakan & Privasi',
              'Aplikasi PedaGogi AI Smart Canteen dilindungi oleh tata tertib sekolah dan enkripsi data siswa.'
            )
          }
          activeOpacity={0.6}
        >
          <View style={[styles.iconBox, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="shield-outline" size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
              Kebijakan Privasi
            </Text>
            <Text style={[styles.menuDesc, { color: theme.textMuted }]}>
              Ketentuan dan perlindungan data
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 5. LOGOUT ROW */}
      <TouchableOpacity
        style={[
          styles.logoutCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={18} color={theme.accentRose} />
        <Text style={[styles.logoutText, { color: theme.accentRose }]}>
          Keluar dari Akun
        </Text>
      </TouchableOpacity>

      {/* Version Footer */}
      <Text style={[styles.versionText, { color: theme.textMuted }]}>
        PedaGogi AI • Versi 2.4.0
      </Text>

      {/* ========================================================================= */}
      {/* MODAL: EDIT PROFIL */}
      {/* ========================================================================= */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProfileModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalSheetHeader}>
              <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                Informasi Profil
              </Text>
              <TouchableOpacity
                style={[styles.closeIconWrap, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setShowProfileModal(false)}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Nama Lengkap
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Nama Lengkap"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  NISN (Nomor Induk Siswa Nasional)
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: isDark ? '#141A2D' : '#F1F5F9',
                      borderColor: theme.border,
                      color: theme.textMuted,
                    },
                  ]}
                  value={displayNisn}
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Kelas
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={editClass}
                  onChangeText={setEditClass}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Email
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Nomor WhatsApp
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <AppButton
                title="Simpan Perubahan"
                onPress={handleSaveProfile}
                style={{ marginTop: 10, marginBottom: 24 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: UBAH KATA SANDI */}
      {/* ========================================================================= */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalSheetHeader}>
              <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                Ubah Kata Sandi
              </Text>
              <TouchableOpacity
                style={[styles.closeIconWrap, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Kata Sandi Lama
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry
                  placeholder="Masukkan kata sandi saat ini"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Kata Sandi Baru
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Minimal 8 karakter"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Konfirmasi Kata Sandi Baru
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Ulangi kata sandi baru"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <AppButton
                title="Perbarui Kata Sandi"
                onPress={handleChangePassword}
                style={{ marginTop: 10, marginBottom: 24 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: FAQ & BANTUAN */}
      {/* ========================================================================= */}
      <Modal
        visible={showFaqModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFaqModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalSheetHeader}>
              <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                Pusat Bantuan & FAQ
              </Text>
              <TouchableOpacity
                style={[styles.closeIconWrap, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setShowFaqModal(false)}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.faqItem, { borderColor: theme.border }]}>
                <Text style={[styles.faqQuestion, { color: theme.textPrimary }]}>
                  Bagaimana cara isi saldo dompet?
                </Text>
                <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                  Buka tab Dompet Digital di menu bawah, pilih nominal top up, lalu selesaikan pembayaran melalui QRIS atau transfer bank.
                </Text>
              </View>

              <View style={[styles.faqItem, { borderColor: theme.border }]}>
                <Text style={[styles.faqQuestion, { color: theme.textPrimary }]}>
                  Apa fungsi batas belanja harian?
                </Text>
                <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                  Fitur ini menjaga agar pengeluaran harian tidak melebihi batas yang ditentukan siswa atau orang tua.
                </Text>
              </View>

              <View style={[styles.faqItem, { borderColor: theme.border }]}>
                <Text style={[styles.faqQuestion, { color: theme.textPrimary }]}>
                  Bagaimana jika kartu pintar hilang?
                </Text>
                <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                  Anda dapat memblokir sementara kartu melalui menu Dompet Digital dan menghubungi Tata Usaha sekolah untuk penggantian.
                </Text>
              </View>

              <AppButton
                title="Tutup"
                variant="outline"
                onPress={() => setShowFaqModal(false)}
                style={{ marginTop: 14, marginBottom: 24 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // 1. Profile Card
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  profileMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  profileMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  editIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section Headers
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },

  // Grouped Menu Container
  groupedCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  menuDesc: {
    fontSize: 11,
    fontWeight: '400',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },

  // Logout Card
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 20,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputField: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '500',
  },

  // FAQ
  faqItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import SocialAuthOptions from '../../components/auth/SocialAuthOptions';
import { USER_ROLES } from '../../constants/roles';
import {
  validateEmail,
  validatePassword,
  validateName,
} from '../../utils/validation';

export default function RegisterScreen({ onNavigateToLogin }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { register, isLoading } = useAuth();

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const dynamicPaddingTop = safeTop + 16;
  const dynamicPaddingBottom = Math.max(insets.bottom || 0, 16) + 20;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState({});

  const handleRegister = async () => {
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, 8);
    let confirmError = null;

    if (!passwordConfirmation) {
      confirmError = 'Konfirmasi kata sandi wajib diisi';
    } else if (password !== passwordConfirmation) {
      confirmError = 'Konfirmasi kata sandi tidak cocok';
    }

    if (nameError || emailError || passwordError || confirmError) {
      setErrors({
        name: nameError,
        email: emailError,
        password: passwordError,
        passwordConfirmation: confirmError,
      });
      return;
    }

    setErrors({});
    const res = await register({
      name,
      email,
      role: USER_ROLES.SISWA,
      password,
    });

    if (res.success) {
      Alert.alert(
        'Pendaftaran Berhasil',
        `Selamat datang, ${res.user.name}! Akun Siswa Anda berhasil dibuat.`
      );
    } else {
      Alert.alert('Gagal Mendaftar', res.message);
    }
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: dynamicPaddingTop,
          paddingBottom: dynamicPaddingBottom,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >

      {/* ── Clean Header Typography ── */}
      <View style={styles.headerSection}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Buat Akun Baru
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Daftar akun siswa untuk memulai pembelajaran cerdas.
        </Text>
      </View>

      {/* ── Form Inputs ── */}
      <View style={styles.formSection}>
        <AppInput
          label="Nama Lengkap"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
          }}
          placeholder="Nama lengkap Anda"
          icon="person-outline"
          autoCapitalize="words"
          error={errors.name}
        />

        <AppInput
          label="Alamat Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
          }}
          placeholder="nama@sekolah.sch.id"
          icon="mail-outline"
          keyboardType="email-address"
          error={errors.email}
        />

        <AppInput
          label="Kata Sandi"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password)
              setErrors((prev) => ({ ...prev, password: null }));
          }}
          placeholder="Minimal 8 karakter"
          icon="lock-closed-outline"
          isPassword
          error={errors.password}
        />

        <AppInput
          label="Konfirmasi Kata Sandi"
          value={passwordConfirmation}
          onChangeText={(text) => {
            setPasswordConfirmation(text);
            if (errors.passwordConfirmation)
              setErrors((prev) => ({
                ...prev,
                passwordConfirmation: null,
              }));
          }}
          placeholder="Ulangi kata sandi"
          icon="shield-checkmark-outline"
          isPassword
          error={errors.passwordConfirmation}
        />

        {/* ── Primary Action Button ── */}
        <AppButton
          title="Daftar Sekarang"
          icon="arrow-forward"
          onPress={handleRegister}
          loading={isLoading}
          variant="primary"
          style={styles.ctaButton}
        />

        {/* ── Google SSO Option ── */}
        <SocialAuthOptions
          text="atau"
          onGooglePress={() =>
            Alert.alert(
              'Google Workspace',
              'Pendaftaran instan dengan akun Google Workspace / Belajar.id.'
            )
          }
        />

        {/* ── Switch to Login ── */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Sudah memiliki akun?{' '}
          </Text>
          <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
            <Text style={[styles.footerLink, { color: theme.primary }]}>
              Masuk di Sini
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 26,
  },
  logoImage: {
    width: 54,
    height: 54,
    borderRadius: 14,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
    letterSpacing: -0.2,
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  formSection: {
    width: '100%',
  },
  ctaButton: {
    marginTop: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});

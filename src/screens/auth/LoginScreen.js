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
import { validateEmail, validatePassword } from '../../utils/validation';

export default function LoginScreen({ onNavigateToRegister, onLoginSuccess }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { login, isLoading } = useAuth();

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const dynamicPaddingTop = safeTop + 16;
  const dynamicPaddingBottom = Math.max(insets.bottom || 0, 16) + 20;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});

  const handleLogin = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, 4);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    setErrors({});
    const res = await login({ email, password, rememberMe });
    if (res.success) {
      if (onLoginSuccess) {
        onLoginSuccess(res.user);
      }
    } else {
      Alert.alert('Gagal Masuk', res.message);
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
          Selamat Datang
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Masuk dengan akun sekolah Anda untuk melanjutkan.
        </Text>
      </View>

      {/* ── Input Fields ── */}
      <View style={styles.formSection}>
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
          placeholder="••••••••"
          icon="lock-closed-outline"
          isPassword
          error={errors.password}
        />

        {/* ── Options: Remember Me & Forgot Password ── */}
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: rememberMe ? theme.primary : theme.border,
                  backgroundColor: rememberMe ? theme.primary : 'transparent',
                },
              ]}
            >
              {rememberMe && (
                <Ionicons name="checkmark" size={13} color="#FFFFFF" />
              )}
            </View>
            <Text style={[styles.rememberText, { color: theme.textSecondary }]}>
              Ingat Saya
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Lupa Kata Sandi',
                'Silakan hubungi Administrator Sekolah untuk bantuan reset akun.'
              )
            }
            activeOpacity={0.7}
          >
            <Text style={[styles.forgotText, { color: theme.primary }]}>
              Lupa Sandi?
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Primary Action ── */}
        <AppButton
          title="Masuk Sekarang"
          icon="arrow-forward"
          onPress={handleLogin}
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
              'Koneksi SSO Google Workspace sekolah siap digunakan.'
            )
          }
        />

        {/* ── Register Switch ── */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Belum memiliki akun?{' '}
          </Text>
          <TouchableOpacity onPress={onNavigateToRegister} activeOpacity={0.7}>
            <Text style={[styles.footerLink, { color: theme.primary }]}>
              Daftar Sekarang
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
    marginBottom: 28,
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
    marginBottom: 28,
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 22,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    fontSize: 13,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ctaButton: {
    marginTop: 2,
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

import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import SocialAuthOptions from '../../components/auth/SocialAuthOptions';
import { validateEmail, validatePassword } from '../../utils/validation';
import { biometricService } from '../../services/biometricService';

export default function LoginScreen({ onNavigateToRegister, onLoginSuccess }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { login, loginWithBiometrics, isLoading } = useAuth();

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const dynamicPaddingTop = safeTop + 16;
  const dynamicPaddingBottom = Math.max(insets.bottom || 0, 16) + 20;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});

  // Biometrics state
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState(null);
  const [savedAccount, setSavedAccount] = useState(null);
  const [isBioAuthenticating, setIsBioAuthenticating] = useState(false);
  const hasAutoPromptedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const initBiometrics = async () => {
      try {
        const info = await biometricService.checkBiometricSupport();
        const isEnabled = await biometricService.isBiometricEnabled();
        const creds = await biometricService.getBiometricCredentials();

        if (isMounted) {
          setBiometricInfo(info);
          if (info.isAvailable && isEnabled && creds) {
            setCanUseBiometrics(true);
            setSavedAccount(creds.user || { email: creds.email });
            if (creds.email && !email) {
              setEmail(creds.email);
            }
          } else {
            setCanUseBiometrics(false);
          }
        }
      } catch (err) {
        console.warn('[LoginScreen] Biometric check warning:', err?.message);
      }
    };
    initBiometrics();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-prompt biometrics on screen load when enabled and credentials are ready
  useEffect(() => {
    if (canUseBiometrics && !hasAutoPromptedRef.current) {
      hasAutoPromptedRef.current = true;
      const timer = setTimeout(() => {
        handleBiometricLogin();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [canUseBiometrics]);

  const handleBiometricLogin = async () => {
    if (isBioAuthenticating) return;
    try {
      setIsBioAuthenticating(true);
      const label = biometricInfo?.label || 'Face ID / Biometrik';
      const auth = await biometricService.authenticate(
        `Masuk ke akun ${savedAccount?.name || savedAccount?.email || 'PedaGogiAI'} menggunakan ${label}`
      );

      if (auth?.success) {
        const res = await loginWithBiometrics();
        if (res?.success) {
          if (onLoginSuccess) {
            onLoginSuccess(res.user);
          }
        } else {
          Alert.alert('Gagal Masuk', res?.message || 'Sesi biometrik kedaluwarsa. Silakan masukkan kata sandi.');
        }
      }
      // If user cancelled, don't show any intrusive error modal
    } catch (err) {
      console.warn('[LoginScreen] Biometric auth error:', err?.message);
    } finally {
      setIsBioAuthenticating(false);
    }
  };

  const handleResetBiometrics = () => {
    Alert.alert(
      'Ganti Akun Biometrik',
      'Ingin menghapus akun tersimpan untuk biometrik dan masuk menggunakan akun lain?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus & Ganti Akun',
          style: 'destructive',
          onPress: async () => {
            await biometricService.clearBiometricCredentials();
            setCanUseBiometrics(false);
            setSavedAccount(null);
            setPassword('');
          },
        },
      ]
    );
  };

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
      try {
        const info = await biometricService.checkBiometricSupport();
        const isBio = await biometricService.isBiometricEnabled();

        // If hardware supports biometrics but it is not yet active, prompt user to enable it
        if (info.isAvailable && !isBio) {
          Alert.alert(
            `Aktifkan ${info.label}?`,
            `Gunakan ${info.label} agar Anda dapat masuk ke PedaGogiAI secara instan dan aman di masa mendatang.`,
            [
              {
                text: 'Nanti Saja',
                style: 'cancel',
                onPress: () => {
                  if (onLoginSuccess) onLoginSuccess(res.user);
                },
              },
              {
                text: `Aktifkan ${info.label}`,
                onPress: async () => {
                  const auth = await biometricService.authenticate(
                    `Konfirmasi ${info.label} untuk mengaktifkan login instan`
                  );
                  if (auth?.success) {
                    await biometricService.setBiometricEnabled(true);
                    await biometricService.saveBiometricCredentials({
                      email,
                      password,
                      token: res.token,
                      user: res.user,
                      savedAt: new Date().toISOString(),
                    });
                  }
                  if (onLoginSuccess) onLoginSuccess(res.user);
                },
              },
            ]
          );
          return;
        }
      } catch (checkErr) {
        console.warn('[LoginScreen] Post-login biometric check error:', checkErr);
      }

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

        {/* ── Biometric Quick Login ── */}
        {canUseBiometrics && (
          <View style={{ marginBottom: 14 }}>
            <TouchableOpacity
              style={[
                styles.biometricBtn,
                {
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.14)' : '#EEF2FF',
                  borderColor: isDark ? '#6366F1' : '#C7D2FE',
                },
              ]}
              onPress={handleBiometricLogin}
              disabled={isLoading || isBioAuthenticating}
              activeOpacity={0.8}
            >
              <View style={[styles.biometricIconBox, { backgroundColor: theme.primary }]}>
                {isBioAuthenticating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name={biometricInfo?.icon || 'finger-print-outline'}
                    size={20}
                    color="#FFFFFF"
                  />
                )}
              </View>
              <View style={styles.biometricInfoText}>
                <Text style={[styles.biometricTitle, { color: theme.textPrimary }]}>
                  Masuk Cepat dengan {biometricInfo?.label || 'Face ID'}
                </Text>
                <Text style={[styles.biometricSub, { color: theme.textSecondary }]} numberOfLines={1}>
                  {savedAccount?.name || savedAccount?.email || 'Akun tersimpan'}
                </Text>
              </View>
              <View
                style={[
                  styles.biometricArrowBox,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E0E7FF' },
                ]}
              >
                <Ionicons name="scan-outline" size={16} color={theme.primary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResetBiometrics}
              style={{ alignSelf: 'center', marginTop: 4 }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: '500' }}>
                Bukan akun Anda?{' '}
                <Text style={{ color: theme.primary, fontWeight: '700' }}>Ganti Akun</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Primary Action ── */}
        <AppButton
          title="Masuk Sekarang"
          icon="arrow-forward"
          onPress={handleLogin}
          loading={isLoading && !isBioAuthenticating}
          variant="primary"
          style={styles.ctaButton}
        />

        {/* Hint for unconfigured biometrics */}
        {biometricInfo?.isAvailable && !canUseBiometrics && (
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                `Masuk dengan ${biometricInfo?.label || 'Biometrik'}`,
                `Silakan masukkan email & kata sandi Anda terlebih dahulu. Sistem akan otomatis menawarkan untuk mengaktifkan ${biometricInfo?.label || 'Biometrik'} untuk login cepat di sesi berikutnya.`
              );
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              paddingVertical: 8,
              marginTop: 4,
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={biometricInfo?.icon || 'finger-print-outline'}
              size={17}
              color={theme.primary}
            />
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: theme.primary }}>
              Dukungan {biometricInfo?.label || 'Face ID'} Terdeteksi
            </Text>
          </TouchableOpacity>
        )}

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
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.2,
    marginBottom: 14,
    gap: 12,
  },
  biometricIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricInfoText: {
    flex: 1,
  },
  biometricTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  biometricSub: {
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '500',
  },
  biometricArrowBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
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

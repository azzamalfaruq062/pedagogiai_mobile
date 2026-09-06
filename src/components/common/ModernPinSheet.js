import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

/**
 * ModernPinSheet
 *
 * Professional, clean, and minimalist PIN pad interface
 * 100% In-App Keypad - NEVER invokes native Android/iOS soft keyboard!
 *
 * Props:
 * - visible: boolean
 * - onClose: () => void
 * - mode: 'setup' | 'verify'
 * - title: string
 * - subtitle: string
 * - amount: number (optional, for checkout payment mode)
 * - onComplete: (pin, confirmPin) => Promise<{ success: boolean, message?: string }>
 * - onSuccessClose?: () => void
 */
export default function ModernPinSheet({
  visible,
  onClose,
  mode = 'verify', // 'verify' | 'setup'
  title,
  subtitle,
  amount = null,
  onComplete,
  onSuccessClose,
}) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom || 0, 16);

  // Setup mode flow: 'enter_pin' -> 'confirm_pin' -> 'success'
  // Verify mode flow: 'enter_pin'
  const [step, setStep] = useState('enter_pin');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state whenever sheet opens
  useEffect(() => {
    if (visible) {
      setStep('enter_pin');
      setPin('');
      setConfirmPin('');
      setLoading(false);
      setErrorMessage('');
    }
  }, [visible, mode]);

  // Current PIN buffer depending on active step
  const currentPin = step === 'confirm_pin' ? confirmPin : pin;

  // Handle keypad digit press (100% in-app, zero native keyboard)
  const handleKeyPress = (digit) => {
    if (loading) return;
    if (errorMessage) setErrorMessage('');

    if (step === 'enter_pin') {
      if (pin.length < 6) {
        const nextPin = pin + digit;
        setPin(nextPin);

        if (nextPin.length === 6) {
          if (mode === 'setup') {
            // Smoothly advance to confirmation step
            setTimeout(() => {
              setStep('confirm_pin');
              setConfirmPin('');
              setErrorMessage('');
            }, 180);
          } else {
            // Verify / Checkout mode: auto-submit upon 6th digit
            handleFinalSubmit(nextPin);
          }
        }
      }
    } else if (step === 'confirm_pin') {
      if (confirmPin.length < 6) {
        const nextConfirm = confirmPin + digit;
        setConfirmPin(nextConfirm);

        if (nextConfirm.length === 6) {
          if (nextConfirm !== pin) {
            setTimeout(() => {
              setErrorMessage('PIN konfirmasi tidak cocok. Silakan ulangi.');
              setConfirmPin('');
            }, 180);
          } else {
            handleFinalSubmit(pin, nextConfirm);
          }
        }
      }
    }
  };

  // Handle keypad backspace
  const handleBackspace = () => {
    if (loading) return;
    if (errorMessage) setErrorMessage('');

    if (step === 'enter_pin') {
      setPin((prev) => prev.slice(0, -1));
    } else if (step === 'confirm_pin') {
      if (confirmPin.length > 0) {
        setConfirmPin((prev) => prev.slice(0, -1));
      } else {
        // Go back to first step if backspaced on empty confirm
        setStep('enter_pin');
      }
    }
  };

  // Handle final submit
  const handleFinalSubmit = async (finalPin, finalConfirm = null) => {
    if (loading) return;
    setLoading(true);
    setErrorMessage('');

    try {
      if (onComplete) {
        const res = await onComplete(finalPin, finalConfirm || finalPin);
        setLoading(false);

        if (res?.success) {
          if (mode === 'setup') {
            setStep('success');
          } else {
            onClose();
          }
        } else {
          setErrorMessage(res?.message || 'Otorisasi PIN gagal.');
          if (step === 'enter_pin') setPin('');
          if (step === 'confirm_pin') setConfirmPin('');
        }
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  // 4 rows keypad: 1-9, 0, backspace
  const keypad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'backspace'],
  ];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop tap to dismiss */}
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#F1F5F9',
              paddingBottom: safeBottom + 8,
            },
          ]}
        >
          {/* Top Pill Handle */}
          <View style={[styles.handleBar, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />

          {/* ══════════════════════════════════════════════════════
              SUCCESS VIEW (Layered Hexagon Shield Badge)
              ══════════════════════════════════════════════════════ */}
          {step === 'success' ? (
            <View style={styles.successContainer}>
              {/* Layered Hexagon Shield Badge */}
              <View style={styles.hexagonWrapper}>
                <View style={[styles.hexagonOuterRing, { backgroundColor: isDark ? 'rgba(99,102,241,0.18)' : '#EEF2FF' }]}>
                  <LinearGradient
                    colors={['#818CF8', '#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hexagonGlowLayer}
                  >
                    <View style={styles.hexagonInnerCircle}>
                      <Ionicons name="checkmark-sharp" size={36} color="#FFFFFF" />
                    </View>
                  </LinearGradient>
                </View>
              </View>

              <Text style={[styles.successTitle, { color: theme.textPrimary }]}>
                PIN Baru Berhasil Dibuat!
              </Text>
              <Text style={[styles.successSub, { color: theme.textSecondary }]}>
                PIN keamanan dompet digital Anda telah aktif dan siap digunakan untuk semua transaksi di kantin sekolah.
              </Text>

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  if (onSuccessClose) onSuccessClose();
                }}
                style={styles.successCTAWrapper}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.successCTA}
                >
                  <Text style={styles.successCTAText}>Selesai</Text>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* ══════════════════════════════════════════════════
                 CLEAN MINIMAL PIN & CUSTOM IN-APP KEYPAD
                 ══════════════════════════════════════════════════ */}
              <View style={styles.pinStepContainer}>
                {/* Screen Title & Subtitle */}
                <View style={styles.stepHeader}>
                  <Text style={[styles.mainHeading, { color: theme.textPrimary }]}>
                    {step === 'confirm_pin'
                      ? 'Konfirmasi PIN Baru'
                      : mode === 'setup'
                      ? 'Buat PIN Baru'
                      : (title || 'PIN Transaksi')}
                  </Text>

                  <Text style={[styles.subHeading, { color: theme.textSecondary }]}>
                    {step === 'confirm_pin'
                      ? 'Masukkan kembali 6 digit PIN yang baru saja Anda buat'
                      : subtitle
                      ? subtitle
                      : amount
                      ? `Total tagihan pembayaran: Rp ${amount.toLocaleString('id-ID')}`
                      : 'Buat 6 digit PIN untuk mengamankan pembayaran & transaksi Anda'}
                  </Text>
                </View>

                {/* Inline Error Notice */}
                {!!errorMessage && (
                  <View style={styles.inlineErrorBox}>
                    <Ionicons name="alert-circle" size={15} color="#EF4444" />
                    <Text style={styles.inlineErrorText}>{errorMessage}</Text>
                  </View>
                )}

                {/* ── 6 Clean Dots Display ── */}
                <View style={styles.pinDisplayContainer}>
                  <View style={styles.pinDotsRow}>
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const isFilled = currentPin[idx] !== undefined;

                      return (
                        <View key={idx} style={styles.pinCell}>
                          <View
                            style={[
                              styles.pinDotCircle,
                              {
                                backgroundColor: isFilled
                                  ? (isDark ? '#38BDF8' : '#2563EB')
                                  : 'transparent',
                                borderColor: isFilled
                                  ? (isDark ? '#38BDF8' : '#2563EB')
                                  : (isDark ? '#475569' : '#CBD5E1'),
                                borderWidth: isFilled ? 0 : 2,
                                transform: [{ scale: isFilled ? 1.25 : 1 }],
                              },
                            ]}
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Loading Spinner during API call */}
                {loading && (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={theme.primary || '#2563EB'} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                      Memproses otorisasi PIN...
                    </Text>
                  </View>
                )}

                {/* ── Modern Custom Numeric Keypad (1-9, 0, Backspace) ── */}
                <View style={styles.keypadContainer}>
                  {keypad.map((row, rowIdx) => (
                    <View key={rowIdx} style={styles.keypadRow}>
                      {row.map((k, colIdx) => {
                        if (k === '') {
                          return <View key={colIdx} style={styles.keypadEmptyKey} />;
                        }

                        if (k === 'backspace') {
                          return (
                            <TouchableOpacity
                              key={colIdx}
                              onPress={handleBackspace}
                              disabled={loading}
                              style={[
                                styles.keypadKey,
                                {
                                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#F1F5F9',
                                },
                              ]}
                              activeOpacity={0.6}
                            >
                              <Ionicons
                                name="backspace-outline"
                                size={25}
                                color={theme.textPrimary}
                              />
                            </TouchableOpacity>
                          );
                        }

                        return (
                          <TouchableOpacity
                            key={colIdx}
                            onPress={() => handleKeyPress(k)}
                            disabled={loading}
                            style={[
                              styles.keypadKey,
                              {
                                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#F1F5F9',
                              },
                            ]}
                            activeOpacity={0.6}
                          >
                            <Text style={[styles.keypadKeyText, { color: theme.textPrimary }]}>
                              {k}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 24, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 6,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },

  // Step Header
  stepHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  mainHeading: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },

  // PIN Display (Clean Dots)
  pinStepContainer: {
    alignItems: 'center',
  },
  pinDisplayContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  pinDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  pinCell: {
    width: 24,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDotCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },

  // Inline Error Box
  inlineErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginBottom: 8,
  },
  inlineErrorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Loading indicator
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Clean Custom Keypad
  keypadContainer: {
    width: '100%',
    maxWidth: 320,
    marginTop: 4,
    marginBottom: 4,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 5,
  },
  keypadKey: {
    width: 74,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadEmptyKey: {
    width: 74,
    height: 52,
  },
  keypadKeyText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Success View Styles
  successContainer: {
    alignItems: 'center',
    paddingVertical: 18,
    position: 'relative',
  },
  hexagonWrapper: {
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexagonOuterRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexagonGlowLayer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  hexagonInnerCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
    marginBottom: 24,
  },
  successCTAWrapper: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successCTA: {
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  successCTAText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

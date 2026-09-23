import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

export default function ServerConnectionError({
  onRetry,
  isRetrying = false,
  errorMessage,
  fullScreen = true,
}) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [localRetrying, setLocalRetrying] = useState(false);
  const [retryAttempted, setRetryAttempted] = useState(false);

  const activeLoading = isRetrying || localRetrying;

  const handlePressRetry = async () => {
    if (onRetry && !activeLoading) {
      setLocalRetrying(true);
      setRetryAttempted(false);
      try {
        await onRetry();
      } catch (_) {
        // Tetap di halaman error jika gagal
      } finally {
        setLocalRetrying(false);
        setRetryAttempted(true);
      }
    }
  };

  // Sederhanakan pesan jika berisi detail teknis atau kosong
  const displayMessage =
    !errorMessage ||
    errorMessage.includes('port 8000') ||
    errorMessage.includes('Laravel API') ||
    errorMessage.includes('backend')
      ? 'Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.'
      : errorMessage;

  const content = (
    <View style={styles.centerContainer}>
      {/* ICON */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isDark
              ? 'rgba(239, 68, 68, 0.12)'
              : '#FEE2E2',
          },
        ]}
      >
        <Ionicons name="cloud-offline-outline" size={44} color="#EF4444" />
      </View>

      {/* TITLES */}
      <Text style={[styles.mainTitle, { color: theme.textPrimary }]}>
        Gagal Terhubung
      </Text>
      <Text style={[styles.mainSubtitle, { color: theme.textSecondary }]}>
        {displayMessage}
      </Text>

      {/* RETRY NOTIFICATION IF STILL CANNOT CONNECT */}
      {retryAttempted && !activeLoading && (
        <View style={styles.noticeContainer}>
          <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
          <Text style={styles.noticeText}>
            Koneksi belum berhasil. Pastikan server aktif lalu coba lagi.
          </Text>
        </View>
      )}

      {/* ACTION BUTTON */}
      <View style={styles.buttonGroup}>
        {onRetry && (
          <TouchableOpacity
            style={[
              styles.retryButton,
              { opacity: activeLoading ? 0.75 : 1 },
            ]}
            onPress={handlePressRetry}
            disabled={activeLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1C2E5A', '#2B3B8B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryButtonGradient}
            >
              {activeLoading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.retryButtonText}>Menghubungkan...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="refresh" size={18} color="#FFFFFF" />
                  <Text style={styles.retryButtonText}>Coba Lagi</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (!fullScreen) {
    return <View style={styles.containerInline}>{content}</View>;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: Math.max(insets.top || 0, Platform.OS === 'android' ? 36 : 44) + 24,
          paddingBottom: Math.max(insets.bottom || 0, 20) + 32,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerInline: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    marginBottom: 18,
  },
  noticeText: {
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '500',
    flexShrink: 1,
  },
  buttonGroup: {
    width: '100%',
  },
  retryButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

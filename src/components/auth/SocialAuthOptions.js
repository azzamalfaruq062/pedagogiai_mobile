import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export default function SocialAuthOptions({
  onGooglePress,
  text = 'atau',
}) {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View
          style={[
            styles.line,
            { backgroundColor: isDark ? '#1F293D' : '#E2E8F0' },
          ]}
        />
        <Text style={[styles.dividerText, { color: theme.textMuted }]}>
          {text}
        </Text>
        <View
          style={[
            styles.line,
            { backgroundColor: isDark ? '#1F293D' : '#E2E8F0' },
          ]}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.socialButton,
          {
            backgroundColor: isDark ? '#121727' : '#FFFFFF',
            borderColor: isDark ? '#232D48' : '#E2E8F0',
          },
        ]}
        onPress={onGooglePress}
        activeOpacity={0.7}
      >
        <Ionicons name="logo-google" size={18} color="#EA4335" />
        <Text style={[styles.socialText, { color: theme.textPrimary }]}>
          Lanjutkan dengan Google
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 18,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 14,
    letterSpacing: 0.2,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

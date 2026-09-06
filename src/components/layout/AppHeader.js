import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useCanteen } from '../../hooks/useCanteen';
import { useNotifications } from '../../hooks/useNotifications';

export default function AppHeader({ onNotificationPress, onSearchFocus }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { searchQuery, setSearchQuery } = useCanteen();
  const { unreadCount } = useNotifications(true);

  // Clean padding from status bar, notch, and punch-hole cameras
  const dynamicPaddingTop =
    Math.max(insets.top || 0, Platform.OS === 'android' ? 26 : 18) + 6;

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: dynamicPaddingTop,
        },
      ]}
    >
      {/* ── Matching Floating Glassmorphism Header Capsule ── */}
      <View
        style={[
          styles.glassCapsule,
          {
            backgroundColor: isDark
              ? 'rgba(18, 24, 42, 0.92)'
              : 'rgba(255, 255, 255, 0.94)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(255, 255, 255, 0.8)',
            shadowColor: isDark ? '#000000' : '#4F46E5',
          },
        ]}
      >
        {/* Search Icon */}
        <Ionicons
          name="search"
          size={18}
          color={theme.primary}
          style={styles.searchIcon}
        />

        {/* Search Input Field */}
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder="Cari materi, kuis, atau menu kantin..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={onSearchFocus}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />

        {/* Clear Search Input Button (Android fallback) */}
        {searchQuery.length > 0 && Platform.OS !== 'ios' && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={17} color={theme.textMuted} />
          </TouchableOpacity>
        )}

        {/* Subtle Vertical Divider */}
        <View
          style={[
            styles.divider,
            { backgroundColor: isDark ? '#232D48' : '#E2E8F0' },
          ]}
        />

        {/* Notification Bell Button */}
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={onNotificationPress}
          activeOpacity={0.7}
          accessibilityLabel="Notifikasi"
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color={theme.textSecondary}
          />
          {/* Live Notification Badge — shows count when > 0, dot otherwise */}
          {unreadCount > 0 ? (
            <View style={styles.badgeCounter}>
              <Text style={styles.badgeCounterText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          ) : (
            <View style={styles.badgeDotHidden} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  glassCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 0,
    letterSpacing: -0.1,
  },
  clearBtn: {
    padding: 2,
    marginRight: 4,
  },
  divider: {
    width: 1,
    height: 22,
    marginHorizontal: 8,
  },
  notificationBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCounter: {
    position: 'absolute',
    top: 2,
    right: 1,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 8.5,
    backgroundColor: '#F43F5E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCounterText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    includeFontPadding: false,
  },
  badgeDotHidden: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 0,
    height: 0,
  },
});

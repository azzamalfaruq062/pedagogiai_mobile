import React, { useRef } from 'react';
import {
  View,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Text,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useCanteen } from '../../hooks/useCanteen';
import { useNotifications } from '../../hooks/useNotifications';

export default function AppHeader({ onNotificationPress, onSearchFocus }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { searchQuery, setSearchQuery } = useCanteen();
  const { unreadCount } = useNotifications(true);
  const bellScaleAnim = useRef(new Animated.Value(1)).current;

  const isIOS = Platform.OS === 'ios';

  // Clean padding from status bar, notch, and punch-hole cameras
  const dynamicPaddingTop = isIOS
    ? Math.max(insets.top || 0, 18) + 6
    : Math.max(StatusBar.currentHeight || 0, insets.top || 0, 24) + 6;

  const headerBgColor = isIOS
    ? (isDark ? 'rgba(10, 16, 30, 0.12)' : 'rgba(255, 255, 255, 0.05)')
    : (isDark ? 'rgba(15, 20, 32, 0.55)' : 'rgba(255, 255, 255, 0.50)');

  const headerBorderColor = isIOS
    ? (isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.45)')
    : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.70)');

  const handleBellPressIn = () => {
    Animated.spring(bellScaleAnim, {
      toValue: 0.88,
      speed: 35,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleBellPressOut = () => {
    Animated.spring(bellScaleAnim, {
      toValue: 1.0,
      speed: 24,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  };

  const CapsuleContainer = isIOS ? BlurView : View;

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: dynamicPaddingTop,
        },
      ]}
    >
      <View
        style={[
          styles.glassOuterShadow,
          {
            shadowColor: isDark ? '#000000' : '#4F46E5',
            backgroundColor: 'transparent',
            elevation: isIOS ? 6 : 4,
          },
        ]}
      >
        {/* ── Genuine Liquid Glass Header Capsule (Adaptive for iOS & Android) ── */}
        <CapsuleContainer
          {...(isIOS ? { intensity: 40, tint: isDark ? 'dark' : 'light' } : {})}
          style={[
            styles.glassCapsule,
            {
              backgroundColor: isIOS ? headerBgColor : 'transparent',
              borderColor: headerBorderColor,
            },
          ]}
        >
          {/* On Android: Prismatic Refraction Glass Gradient (Lighter & More Transparent) */}
          {!isIOS ? (
            <>
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(15, 20, 32, 0.55)'
                      : 'rgba(255, 255, 255, 0.50)',
                  },
                ]}
              />
              <LinearGradient
                colors={
                  isDark
                    ? [
                        'rgba(45, 58, 88, 0.55)',
                        'rgba(24, 32, 52, 0.35)',
                        'rgba(14, 18, 30, 0.50)',
                      ]
                    : [
                        'rgba(255, 255, 255, 0.65)',
                        'rgba(248, 251, 255, 0.35)',
                        'rgba(235, 243, 255, 0.45)',
                      ]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : null}

          {/* Search Icon */}
          <Ionicons
            name="search"
            size={18}
            color={!isIOS ? theme.textMuted : theme.primary}
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
            underlineColorAndroid="transparent"
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
              { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' },
            ]}
          />

          {/* Notification Bell Button with Tactile Spring */}
          <TouchableWithoutFeedback
            onPress={onNotificationPress}
            onPressIn={handleBellPressIn}
            onPressOut={handleBellPressOut}
            accessibilityLabel="Notifikasi"
          >
            <Animated.View
              style={[
                styles.notificationBtn,
                {
                  transform: [{ scale: bellScaleAnim }],
                },
              ]}
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
            </Animated.View>
          </TouchableWithoutFeedback>
        </CapsuleContainer>
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
  glassOuterShadow: {
    borderRadius: 25,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
    backgroundColor: 'transparent',
  },
  glassCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    overflow: 'hidden',
    position: 'relative',
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

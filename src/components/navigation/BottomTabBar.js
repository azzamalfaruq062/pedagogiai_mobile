import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useCanteen } from '../../hooks/useCanteen';
import { ROUTES } from '../../constants/routes';

export default function BottomTabBar({ currentRoute, onSelectRoute }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { cartCount } = useCanteen();

  const leftTabs = [
    {
      id: ROUTES.MAIN.DASHBOARD,
      label: 'Beranda',
      icon: 'home',
      iconOutline: 'home-outline',
      activeRoutes: [ROUTES.MAIN.DASHBOARD],
    },
    {
      id: ROUTES.MAIN.COURSE_LIST,
      label: 'Belajar',
      icon: 'school',
      iconOutline: 'school-outline',
      activeRoutes: [
        ROUTES.MAIN.COURSE_LIST,
        ROUTES.MAIN.COURSE_DETAIL,
        ROUTES.MAIN.LESSON,
        ROUTES.MAIN.QUIZ_ATTEMPT,
        ROUTES.MAIN.QUIZ_RESULT,
      ],
    },
  ];

  const rightTabs = [
    {
      id: ROUTES.MAIN.CANTEEN_MENU,
      label: 'Kantin',
      icon: 'restaurant',
      iconOutline: 'restaurant-outline',
      badge: cartCount > 0 ? cartCount : null,
      activeRoutes: [ROUTES.MAIN.CANTEEN_MENU],
    },
    {
      id: ROUTES.MAIN.PROFILE,
      label: 'Akun',
      icon: 'person',
      iconOutline: 'person-outline',
      activeRoutes: [ROUTES.MAIN.PROFILE],
    },
  ];

  const isWalletActive =
    currentRoute === ROUTES.MAIN.CANTEEN_WALLET ||
    currentRoute === ROUTES.MAIN.CANTEEN_HISTORY;

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View
        style={[
          styles.glassContainer,
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
        {/* Left Tabs (Beranda, Belajar) */}
        <View style={styles.tabGroup}>
          {leftTabs.map((tab) => {
            const isActive = tab.activeRoutes.includes(currentRoute);
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => onSelectRoute(tab.id)}
                style={styles.tabItem}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={isActive ? tab.icon : tab.iconOutline}
                    size={22}
                    color={isActive ? theme.primary : theme.textMuted}
                  />
                </View>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? theme.primary : theme.textMuted,
                      fontWeight: isActive ? '800' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>

                {/* Clean Subtle Active Indicator Dot */}
                {isActive ? (
                  <View
                    style={[
                      styles.activeDot,
                      { backgroundColor: theme.primary },
                    ]}
                  />
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Center Elevated Action Button: Scan QR / Bayar ── */}
        <View style={styles.centerFabContainer}>
          <TouchableOpacity
            onPress={() => onSelectRoute(ROUTES.MAIN.CANTEEN_WALLET)}
            activeOpacity={0.88}
            style={styles.fabTouchable}
            accessibilityLabel="Scan QR atau Bayar Kantin"
          >
            <LinearGradient
              colors={
                isWalletActive
                  ? ['#4338CA', '#4F46E5', '#6366F1']
                  : ['#4F46E5', '#6366F1', '#818CF8']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.fabGradient,
                {
                  borderColor: isDark ? '#12182A' : '#FFFFFF',
                  borderWidth: 3.5,
                },
              ]}
            >
              <Ionicons name="qr-code" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text
              style={[
                styles.fabLabel,
                {
                  color: isWalletActive ? theme.primary : theme.textSecondary,
                  fontWeight: isWalletActive ? '800' : '600',
                },
              ]}
            >
              Scan QR
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Tabs (Kantin, Akun) */}
        <View style={styles.tabGroup}>
          {rightTabs.map((tab) => {
            const isActive = tab.activeRoutes.includes(currentRoute);
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => onSelectRoute(tab.id)}
                style={styles.tabItem}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={isActive ? tab.icon : tab.iconOutline}
                    size={22}
                    color={isActive ? theme.primary : theme.textMuted}
                  />
                  {tab.badge ? (
                    <View
                      style={[
                        styles.badgeCircle,
                        { backgroundColor: theme.accentRose },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? theme.primary : theme.textMuted,
                      fontWeight: isActive ? '800' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>

                {/* Clean Subtle Active Indicator Dot */}
                {isActive ? (
                  <View
                    style={[
                      styles.activeDot,
                      { backgroundColor: theme.primary },
                    ]}
                  />
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  glassContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    borderRadius: 28,
    borderWidth: 1.2,
    paddingHorizontal: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 54,
  },
  iconWrap: {
    position: 'relative',
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCircle: {
    position: 'absolute',
    top: -3,
    right: -7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: -0.2,
    textAlign: 'center',
    marginTop: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 3,
  },
  centerFabContainer: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  fabGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabLabel: {
    fontSize: 10,
    letterSpacing: -0.2,
    marginTop: 2,
    textAlign: 'center',
  },
});

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useCanteen } from '../../hooks/useCanteen';
import { ROUTES } from '../../constants/routes';

/**
 * AnimatedTabItem - Smooth spring micro-interactions for tactile Apple-like response
 */
function AnimatedTabItem({ tab, isActive, theme, onSelect }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const activeAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: isActive ? 1 : 0,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      speed: 35,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.0,
      speed: 24,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  };

  const dotScale = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const dotOpacity = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const iconScale = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <TouchableWithoutFeedback
      onPress={onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View
        style={[
          styles.tabItem,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconWrap,
            {
              transform: [{ scale: iconScale }],
            },
          ]}
        >
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
        </Animated.View>

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

        {/* Smooth Animated Active Indicator Dot */}
        <Animated.View
          style={[
            styles.activeDot,
            {
              backgroundColor: theme.primary,
              opacity: dotOpacity,
              transform: [{ scale: dotScale }],
            },
          ]}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

export default function BottomTabBar({ currentRoute, onSelectRoute }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { cartCount } = useCanteen();
  const fabScaleAnim = useRef(new Animated.Value(1)).current;

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

  const handleFabPressIn = () => {
    Animated.spring(fabScaleAnim, {
      toValue: 0.9,
      speed: 35,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleFabPressOut = () => {
    Animated.spring(fabScaleAnim, {
      toValue: 1.0,
      speed: 24,
      bounciness: 12,
      useNativeDriver: true,
    }).start();
  };

  const isIOS = Platform.OS === 'ios';

  const dynamicPaddingBottom = isIOS
    ? Math.max(insets.bottom || 0, 8)
    : Math.max(insets.bottom || 0, 12) + 16;

  // Adaptive glass styling: iOS retains dense frosted look, Android gets slightly more translucency
  const glassBgColor = isIOS
    ? (isDark ? 'rgba(18, 24, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)')
    : (isDark ? 'rgba(18, 24, 42, 0.78)' : 'rgba(255, 255, 255, 0.80)');

  const glassBorderColor = isDark
    ? 'rgba(255, 255, 255, 0.16)'
    : (isIOS ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.75)');

  const glassGradientColors = isIOS
    ? (isDark
        ? [
            'rgba(34, 45, 72, 0.97)',
            'rgba(20, 27, 48, 0.92)',
            'rgba(14, 19, 34, 0.95)',
          ]
        : [
            'rgba(255, 255, 255, 0.98)',
            'rgba(246, 250, 255, 0.92)',
            'rgba(236, 243, 255, 0.95)',
          ])
    : (isDark
        ? [
            'rgba(34, 45, 72, 0.85)',
            'rgba(20, 27, 48, 0.70)',
            'rgba(14, 19, 34, 0.78)',
          ]
        : [
            'rgba(255, 255, 255, 0.86)',
            'rgba(244, 248, 255, 0.72)',
            'rgba(235, 243, 255, 0.78)',
          ]);

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: dynamicPaddingBottom,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.glassOuterShadow,
          {
            backgroundColor: glassBgColor,
            shadowColor: isDark ? '#000000' : '#4F46E5',
            shadowOpacity: isDark ? 0.35 : 0.12,
            borderColor: glassBorderColor,
            elevation: isIOS ? 0 : 8,
          },
        ]}
      >
        {/* Layer 1: Semi-Translucent Frosted Glass Background with Refraction Gradient */}
        <View style={styles.glassBackgroundClipper} pointerEvents="none">
          {/* Luminous Specular Refraction Glass Gradient */}
          <LinearGradient
            colors={glassGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Layer 2: 5 Symmetrical In-Flow Columns */}
        <View style={styles.tabsRow}>
          {/* Slot 1: Beranda */}
          <View style={styles.tabSlot}>
            <AnimatedTabItem
              tab={leftTabs[0]}
              isActive={leftTabs[0].activeRoutes.includes(currentRoute)}
              theme={theme}
              onSelect={() => onSelectRoute(leftTabs[0].id)}
            />
          </View>

          {/* Slot 2: Belajar */}
          <View style={styles.tabSlot}>
            <AnimatedTabItem
              tab={leftTabs[1]}
              isActive={leftTabs[1].activeRoutes.includes(currentRoute)}
              theme={theme}
              onSelect={() => onSelectRoute(leftTabs[1].id)}
            />
          </View>

          {/* Slot 3: Empty Spacer (Reserved for Elevated Floating FAB) */}
          <View style={styles.tabSlot} pointerEvents="none" />

          {/* Slot 4: Kantin */}
          <View style={styles.tabSlot}>
            <AnimatedTabItem
              tab={rightTabs[0]}
              isActive={rightTabs[0].activeRoutes.includes(currentRoute)}
              theme={theme}
              onSelect={() => onSelectRoute(rightTabs[0].id)}
            />
          </View>

          {/* Slot 5: Akun */}
          <View style={styles.tabSlot}>
            <AnimatedTabItem
              tab={rightTabs[1]}
              isActive={rightTabs[1].activeRoutes.includes(currentRoute)}
              theme={theme}
              onSelect={() => onSelectRoute(rightTabs[1].id)}
            />
          </View>
        </View>
      </View>

      {/* Floating Center Action Button (Positioned over Slot 3, outside glassOuterShadow to avoid Android outline clipping) */}
      <View style={styles.floatingFabWrapper} pointerEvents="box-none">
        <TouchableWithoutFeedback
          onPress={() => onSelectRoute(ROUTES.MAIN.CANTEEN_WALLET)}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          accessibilityLabel="Scan QR atau Bayar Kantin"
        >
          <Animated.View
            style={[
              styles.fabTouchable,
              {
                transform: [{ scale: fabScaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={
                isWalletActive
                  ? ['#3730A3', '#4338CA', '#4F46E5']
                  : ['#6366F1', '#4F46E5', '#4338CA']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.fabGradient,
                {
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.25)'
                    : '#FFFFFF',
                  borderWidth: 3.5,
                  elevation: isIOS ? 6 : 10,
                },
              ]}
            >
              <Ionicons name="qr-code" size={25} color="#FFFFFF" />
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
          </Animated.View>
        </TouchableWithoutFeedback>
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
  glassOuterShadow: {
    height: 64,
    borderRadius: 28,
    borderWidth: 1.2,
    position: 'relative',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    backgroundColor: 'transparent',
  },
  glassBackgroundClipper: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: 'hidden',
  },
  floatingFabWrapper: {
    position: 'absolute',
    top: -18,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 110,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 4,
    overflow: 'visible',
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    width: '100%',
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
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    marginTop: 3,
  },
  fabTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  fabLabel: {
    fontSize: 9.5,
    letterSpacing: -0.2,
    marginTop: 2,
    textAlign: 'center',
  },
});

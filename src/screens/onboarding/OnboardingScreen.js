import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'Belajar Cerdas dengan AI',
    description:
      'Akses materi KBM interaktif, rangkuman otomatis, dan bimbingan tutor AI kapan saja.',
    accentColor: '#4F46E5',
    lottieSource: require('../../../assets/lottie/ai_learning.json'),
    fallbackIcon: 'school-outline',
  },
  {
    id: '2',
    title: 'Kuis Adaptif & Prestasi',
    description:
      'Uji pemahamanmu lewat kuis latihan berkala dan pantau peringkat belajarmu di kelas.',
    accentColor: '#D97706',
    lottieSource: require('../../../assets/lottie/quiz_trophy.json'),
    fallbackIcon: 'trophy-outline',
  },
  {
    id: '3',
    title: 'Transaksi Cepat E-Kantin',
    description:
      'Pesan menu sehat dari kantin sekolah dan bayar nontunai secara praktis tanpa antre.',
    accentColor: '#059669',
    lottieSource: require('../../../assets/lottie/canteen_wallet.json'),
    fallbackIcon: 'wallet-outline',
  },
];

export default function OnboardingScreen({ onFinish, onNavigateToLogin }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const dynamicPaddingTop = safeTop + 14;
  const dynamicPaddingBottom = Math.max(insets.bottom || 0, 16) + 20;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      if (onFinish) onFinish();
    }
  };

  const handleSkip = () => {
    if (onFinish) onFinish();
  };

  const currentSlide = ONBOARDING_SLIDES[currentIndex];
  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  const renderSlide = ({ item }) => {
    return (
      <View style={[styles.slideContainer, { width }]}>
        {/* Minimalist Visual Area with Lottie */}
        <View style={styles.visualWrapper}>
          <LottieView
            source={item.lottieSource}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>

        {/* Clean Typography */}
        <View style={styles.textWrapper}>
          <Text style={[styles.slideTitle, { color: theme.textPrimary }]}>
            {item.title}
          </Text>
          <Text style={[styles.slideDescription, { color: theme.textSecondary }]}>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* ── Top Bar: Brand & Actions ── */}
      <View style={[styles.topBar, { paddingTop: dynamicPaddingTop }]}>
        <View style={styles.brandGroup}>
          <Image
            source={
              isDark
                ? require('../../../assets/images/logo_dark.png')
                : require('../../../assets/images/logo.png')
            }
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
            PedaGogi<Text style={{ color: theme.primary }}>AI</Text>
          </Text>
        </View>

        <View style={styles.topRightGroup}>
          {!isLastSlide && (
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipBtn}
              activeOpacity={0.7}
            >
              <Text style={[styles.skipText, { color: theme.textMuted }]}>
                Lewati
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Swipeable Slides Carousel ── */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        style={styles.carousel}
      />

      {/* ── Bottom Controls: Minimalist Indicators & Clean CTA ── */}
      <View
        style={[
          styles.bottomArea,
          {
            paddingBottom: dynamicPaddingBottom,
          },
        ]}
      >
        {/* Subtle Indicator Dots */}
        <View style={styles.indicatorRow}>
          {ONBOARDING_SLIDES.map((slide, idx) => {
            const active = idx === currentIndex;
            return (
              <View
                key={slide.id}
                style={[
                  styles.dot,
                  {
                    width: active ? 24 : 7,
                    backgroundColor: active
                      ? theme.primary
                      : isDark
                      ? '#222D47'
                      : '#CBD5E1',
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Clean Primary Button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.primaryButtonText}>
            {isLastSlide ? 'Mulai Sekarang' : 'Lanjutkan'}
          </Text>
          <Ionicons
            name={isLastSlide ? 'rocket-outline' : 'arrow-forward'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Secondary Link on Last Slide */}
        {isLastSlide ? (
          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: theme.textSecondary }]}>
              Sudah memiliki akun?{' '}
            </Text>
            <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
              <Text style={[styles.loginLink, { color: theme.primary }]}>
                Masuk
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ height: 24 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 11,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  topRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  carousel: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  visualWrapper: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  lottieAnimation: {
    width: 220,
    height: 220,
  },
  textWrapper: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  slideTitle: {
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.6,
    marginBottom: 10,
    lineHeight: 32,
  },
  slideDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  bottomArea: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 52,
    borderRadius: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    height: 24,
  },
  loginText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});

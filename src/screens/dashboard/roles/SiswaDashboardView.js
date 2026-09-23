import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../hooks/useAuth';
import { useCanteen } from '../../../hooks/useCanteen';
import { dashboardApi } from '../../../api/dashboardApi';
import { courseApi } from '../../../api/courseApi';
import { attendanceApi } from '../../../api/attendanceApi';
import AppButton from '../../../components/common/AppButton';
import ServerConnectionError from '../../../components/common/ServerConnectionError';

export default function SiswaDashboardView({
  onNavigateToCanteen,
  onNavigateToWallet,
  onNavigateToProfile,
  onNavigateToCourseList,
  onNavigateToCourseDetail,
  onNavigateToAttendance,
  onNavigateToLocationAttendance,
  onNavigateToBilling,
}) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { wallet } = useCanteen();

  const insets = useSafeAreaInsets();
  const safeBottomPadding = Math.max(insets.bottom || 0, 16) + 14;

  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);

  const [showPresensiModal, setShowPresensiModal] = useState(false);
  const [presensiData, setPresensiData] = useState(null);
  const [isLoadingPresensi, setIsLoadingPresensi] = useState(false);

  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [carouselPage, setCarouselPage] = useState(0);
  const carouselRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const SLIDE_WIDTH = SCREEN_WIDTH - 32;

  // Real Database Data
  const [dashboardData, setDashboardData] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  const loadPresensiData = useCallback(async () => {
    setIsLoadingPresensi(true);
    try {
      const res = await attendanceApi.getMyRecord().catch(() => null);
      if (res?.success && res?.data) {
        setPresensiData(res.data);
      } else {
        setPresensiData(null);
      }
    } catch (e) {
      console.log('Error loading presensi data:', e);
    } finally {
      setIsLoadingPresensi(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [sumRes, coursesRes] = await Promise.all([
        dashboardApi.getSummary(),
        courseApi.getCourses().catch(() => null),
      ]);
      if (sumRes?.success && sumRes?.data) {
        setConnectionError(null);
        setDashboardData(sumRes.data);
      } else if (sumRes?.data) {
        setConnectionError(null);
        setDashboardData(sumRes.data);
      } else {
        setDashboardData(null);
        setConnectionError('Gagal terhubung ke server.');
      }
      if (coursesRes?.success && Array.isArray(coursesRes.data)) {
        setAllCourses(coursesRes.data);
      } else {
        setAllCourses([]);
      }
    } catch (e) {
      console.log('Error loading siswa dashboard data:', e);
      setDashboardData(null);
      setConnectionError(
        e?.message || 'Gagal terhubung ke server.'
      );
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const scrollToSlide = (index) => {
    carouselRef.current?.scrollTo({ x: index * SLIDE_WIDTH, animated: true });
    setCarouselPage(index);
  };

  const [heroHeight, setHeroHeight] = useState(155);
  const [kpiHeight, setKpiHeight] = useState(215);

  const carouselHeight = scrollX.interpolate({
    inputRange: [0, SLIDE_WIDTH],
    outputRange: [heroHeight + 6, kpiHeight + 20],
    extrapolate: 'clamp',
  });

  // Interpolations for fluid animated pagination dots
  const dot0Width = scrollX.interpolate({
    inputRange: [-SLIDE_WIDTH, 0, SLIDE_WIDTH],
    outputRange: [7, 24, 7],
    extrapolate: 'clamp',
  });
  const dot0Opacity = scrollX.interpolate({
    inputRange: [-SLIDE_WIDTH, 0, SLIDE_WIDTH],
    outputRange: [0.35, 1, 0.35],
    extrapolate: 'clamp',
  });
  const dot0Bg = scrollX.interpolate({
    inputRange: [-SLIDE_WIDTH, 0, SLIDE_WIDTH],
    outputRange: [
      isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)',
      '#4F46E5',
      isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)',
    ],
    extrapolate: 'clamp',
  });

  const dot1Width = scrollX.interpolate({
    inputRange: [0, SLIDE_WIDTH, SLIDE_WIDTH * 2],
    outputRange: [7, 24, 7],
    extrapolate: 'clamp',
  });
  const dot1Opacity = scrollX.interpolate({
    inputRange: [0, SLIDE_WIDTH, SLIDE_WIDTH * 2],
    outputRange: [0.35, 1, 0.35],
    extrapolate: 'clamp',
  });
  const dot1Bg = scrollX.interpolate({
    inputRange: [0, SLIDE_WIDTH, SLIDE_WIDTH * 2],
    outputRange: [
      isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)',
      '#4F46E5',
      isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)',
    ],
    extrapolate: 'clamp',
  });

  // Scale depth effect for slides
  const slide0Scale = scrollX.interpolate({
    inputRange: [-SLIDE_WIDTH, 0, SLIDE_WIDTH],
    outputRange: [0.94, 1, 0.94],
    extrapolate: 'clamp',
  });
  const slide0Opacity = scrollX.interpolate({
    inputRange: [-SLIDE_WIDTH, 0, SLIDE_WIDTH],
    outputRange: [0.7, 1, 0.7],
    extrapolate: 'clamp',
  });

  const slide1Scale = scrollX.interpolate({
    inputRange: [0, SLIDE_WIDTH, SLIDE_WIDTH * 2],
    outputRange: [0.94, 1, 0.94],
    extrapolate: 'clamp',
  });
  const slide1Opacity = scrollX.interpolate({
    inputRange: [0, SLIDE_WIDTH, SLIDE_WIDTH * 2],
    outputRange: [0.7, 1, 0.7],
    extrapolate: 'clamp',
  });

  const displayName = user?.name || wallet?.holderName || 'Siswa';
  const firstName = displayName.split(' ')[0];

  const handleClaimReward = () => {
    if (dailyRewardClaimed) {
      Alert.alert('Info', 'Anda sudah mengklaim reward harian hari ini. Kembali lagi besok!');
      return;
    }
    setDailyRewardClaimed(true);
    Alert.alert('Selamat!', 'Anda mendapatkan +50 XP dan +5 AI Tokens untuk belajar hari ini!');
  };

  const handleCoursePress = (c) => {
    if (onNavigateToCourseDetail) {
      const targetCourse = allCourses.find((item) => item.id === c.id) || c;
      onNavigateToCourseDetail(targetCourse);
    } else {
      setSelectedCourse(c);
      setShowCourseModal(true);
    }
  };

  if (connectionError) {
    return (
      <ServerConnectionError
        onRetry={loadData}
        isRetrying={isLoadingData}
        errorMessage={connectionError}
      />
    );
  }

  const currentLevel = dashboardData?.stats?.level || dashboardData?.user?.level || 'Level 1';
  const currentExp = (dashboardData?.stats?.exp ?? 0) + (dailyRewardClaimed ? 50 : 0);
  const targetExp = dashboardData?.stats?.targetExp || 5000;
  const progressPercent = Math.min(100, Math.round((currentExp / targetExp) * 100));

  const studentStats = [
    {
      label: 'LEVEL SISWA',
      value: currentLevel,
      sub: dashboardData?.stats?.rank ? `Peringkat ${dashboardData.stats.rank}` : 'Aktif',
      icon: 'trophy',
      color: '#4F46E5',
      lightTint: 'rgba(79, 70, 229, 0.07)',
      borderColor: 'rgba(79, 70, 229, 0.25)',
    },
    {
      label: 'XP BELAJAR',
      value: `${currentExp} XP`,
      sub: dailyRewardClaimed ? '↑ +50 XP' : 'Hari Ini',
      icon: 'flash',
      color: '#F59E0B',
      lightTint: 'rgba(245, 158, 11, 0.07)',
      borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    {
      label: 'SALDO DOMPET',
      value: `Rp ${(wallet.balance / 1000).toFixed(0)}K`,
      sub: 'Siap Jajan',
      icon: 'wallet',
      color: '#10B981',
      lightTint: 'rgba(16, 185, 129, 0.07)',
      borderColor: 'rgba(16, 185, 129, 0.25)',
    },
    {
      label: 'STATUS KBM',
      value: 'Aktif',
      sub: 'Presensi Siswa',
      icon: 'calendar',
      color: '#8B5CF6',
      lightTint: 'rgba(139, 92, 246, 0.07)',
      borderColor: 'rgba(139, 92, 246, 0.25)',
    },
  ];

  const studentServices = [
    {
      id: 'srv_billing',
      title: 'Tagihan Sekolah',
      desc: 'SPP & Administrasi',
      icon: 'card-outline',
      color: '#4F46E5',
      bgColor: isDark ? 'rgba(79, 70, 229, 0.15)' : '#EEF2FF',
      action: onNavigateToBilling,
    },
    {
      id: 'srv_wallet',
      title: 'Dompet Digital',
      desc: `Rp ${wallet.balance.toLocaleString('id-ID')}`,
      descColor: '#10B981',
      icon: 'wallet-outline',
      color: '#10B981',
      bgColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
      action: onNavigateToWallet,
    },
    {
      id: 'srv_presensi',
      title: 'Presensi KBM',
      desc: 'Absensi Sesuai Kelas',
      descColor: '#F59E0B',
      icon: 'calendar-outline',
      color: '#F59E0B',
      bgColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
      action: () => {
        setShowPresensiModal(true);
        loadPresensiData();
      },
    },
    {
      id: 'srv_course',
      title: 'Katalog Modul',
      desc: 'Eksplorasi materi',
      icon: 'library-outline',
      color: '#0284C7',
      bgColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#F0F9FF',
      action: onNavigateToCourseList,
    },
  ];

  const activeCourses = dashboardData?.activeCourses && dashboardData.activeCourses.length > 0
    ? dashboardData.activeCourses
    : allCourses.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* CAROUSEL: HERO + KPI SLIDES */}
      <View style={styles.carouselWrapper}>
        <Animated.View style={{ height: carouselHeight, overflow: 'hidden' }}>
          <Animated.ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            bounces={false}
            scrollEventThrottle={16}
            contentContainerStyle={styles.carouselScrollContent}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(e) => {
              const page = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
              setCarouselPage(page);
            }}
          >
            {/* SLIDE 1: HERO WELCOME */}
            <Animated.View
              style={[
                styles.carouselSlide,
                {
                  width: SLIDE_WIDTH,
                  transform: [{ scale: slide0Scale }],
                  opacity: slide0Opacity,
                },
              ]}
            >
              <View
                style={styles.heroCardContainer}
                onLayout={(e) => {
                  const h = Math.round(e.nativeEvent.layout.height);
                  if (h > 0 && Math.abs(h - heroHeight) > 2) {
                    setHeroHeight(h);
                  }
                }}
              >
                <LinearGradient
                  colors={['#1C2E5A', '#2B3B8B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroDecorCircle1} />
                  <View style={styles.heroDecorCircle2} />

                  <View style={styles.heroContent}>
                    <View style={styles.heroTopRow}>
                      <View style={styles.heroTextCol}>
                        <Text style={styles.heroGreeting}>Halo, {firstName}!</Text>
                        <Text style={styles.heroSub}>
                          Siap lanjut belajar? Mari selesaikan modul hari ini.
                        </Text>
                      </View>

                      {onNavigateToProfile && (
                        <TouchableOpacity
                          style={styles.heroAvatarWrap}
                          onPress={onNavigateToProfile}
                          activeOpacity={0.8}
                        >
                          <View style={styles.heroAvatar}>
                            <Text style={styles.heroAvatarText}>
                              {firstName[0]?.toUpperCase() || 'A'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.heroButtonsRow}>
                      <TouchableOpacity
                        style={styles.heroWhiteBtn}
                        onPress={() => {
                          if (onNavigateToCourseList) {
                            onNavigateToCourseList();
                          } else {
                            Alert.alert('Katalog Course', 'Modul Informatika dan Sains siap dipelajari.');
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="compass-outline" size={16} color="#1C2E5A" />
                        <Text style={styles.heroWhiteBtnText}>Jelajahi Course</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.heroOutlineBtn}
                        onPress={() => setShowLeaderboardModal(true)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trophy-outline" size={15} color="#FFFFFF" />
                        <Text style={styles.heroOutlineBtnText}>Leaderboard</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>

            {/* SLIDE 2: KPI 4-GRID */}
            <Animated.View
              style={[
                styles.carouselSlide,
                {
                  width: SLIDE_WIDTH,
                  transform: [{ scale: slide1Scale }],
                  opacity: slide1Opacity,
                },
              ]}
            >
              <View
                style={styles.statsGrid}
                onLayout={(e) => {
                  const h = Math.round(e.nativeEvent.layout.height);
                  if (h > 0 && Math.abs(h - kpiHeight) > 2) {
                    setKpiHeight(h);
                  }
                }}
              >
                {studentStats.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.statCardContainer,
                      {
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : item.borderColor,
                        backgroundColor: theme.surface,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isDark
                          ? [theme.surface, theme.surface, 'rgba(30, 41, 59, 0.6)']
                          : ['#FFFFFF', '#FFFFFF', item.lightTint]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.statCardGradient}
                    >
                      {/* Circular Gradient Glow */}
                      <LinearGradient
                        colors={[item.color, 'transparent']}
                        start={{ x: 1, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        style={styles.statGradientCircle}
                      />

                      {/* Watermark Icon */}
                      <View style={styles.statWatermarkWrap}>
                        <Ionicons name={item.icon} size={66} color={item.color} />
                      </View>

                      {/* Card Content */}
                      <View style={styles.statCardContent}>
                        <Text style={[styles.statLabelText, { color: theme.textMuted }]}>
                          {item.label}
                        </Text>
                        <View style={styles.statNumberBadgeRow}>
                          <Text style={[styles.statBigNumber, { color: theme.textPrimary }]}>
                            {item.value}
                          </Text>
                          <View
                            style={[
                              styles.statBadgePill,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : item.lightTint,
                                borderColor: item.borderColor,
                              },
                            ]}
                          >
                            <Text style={[styles.statBadgePillText, { color: item.color }]}>
                              {item.sub}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            </Animated.View>
          </Animated.ScrollView>
        </Animated.View>

        {/* Fluid Animated Pagination Dots */}
        <View style={styles.carouselDotsRow}>
          <TouchableOpacity
            onPress={() => scrollToSlide(0)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Animated.View
              style={[
                styles.carouselDot,
                {
                  width: dot0Width,
                  opacity: dot0Opacity,
                  backgroundColor: dot0Bg,
                },
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => scrollToSlide(1)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Animated.View
              style={[
                styles.carouselDot,
                {
                  width: dot1Width,
                  opacity: dot1Opacity,
                  backgroundColor: dot1Bg,
                },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. GAMIFIKASI & XP REWARD (Sesuai Web Template) */}
      <View
        style={[
          styles.statCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.statTopRow}>
          <View style={styles.statRankCol}>
            <View style={styles.statIconBadge}>
              <Ionicons name="medal" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.statSubLabel, { color: theme.textMuted }]}>
                Progres Level Belajar
              </Text>
              <Text style={[styles.statValueBold, { color: theme.textPrimary }]}>
                {currentLevel} {dashboardData?.stats?.rank ? `(Peringkat ${dashboardData.stats.rank})` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.statTokenCol}>
            <Text style={[styles.statSubLabel, { color: theme.textMuted }]}>
              Target XP
            </Text>
            <View style={styles.tokenPill}>
              <Ionicons name="sparkles" size={13} color="#6366F1" />
              <Text style={[styles.tokenValue, { color: theme.textPrimary }]}>
                {targetExp.toLocaleString('id-ID')} XP
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.xpRow}>
          <Text style={[styles.xpText, { color: theme.textMuted }]}>
            {currentExp.toLocaleString('id-ID')} XP
          </Text>
          <Text style={[styles.xpText, { color: theme.textMuted }]}>
            {progressPercent}% Menuju Level Berikutnya
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: '#1C2E5A',
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.claimBtn,
            { backgroundColor: dailyRewardClaimed ? theme.surfaceMuted : '#D4A017' },
          ]}
          onPress={handleClaimReward}
          activeOpacity={0.8}
        >
          <Ionicons
            name="disc-outline"
            size={16}
            color={dailyRewardClaimed ? theme.textMuted : '#FFFFFF'}
          />
          <Text
            style={[
              styles.claimBtnText,
              { color: dailyRewardClaimed ? theme.textMuted : '#FFFFFF' },
            ]}
          >
            {dailyRewardClaimed ? '✓ Reward Harian Sudah Diklaim' : 'Klaim Reward Harian (+50 XP)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. LAYANAN SISWA TERPADU (2-COLUMN GRID - SERAGAM DENGAN ADMIN & KARYAWAN) */}
      <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
        LAYANAN SISWA TERPADU
      </Text>

      {/* 4-card 2-column grid */}
      <View style={styles.servicesGrid}>
        {studentServices.map((srv) => (
          <TouchableOpacity
            key={srv.id}
            style={[
              styles.serviceCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={srv.action}
            activeOpacity={0.72}
          >
            <View
              style={[
                styles.serviceIconWrap,
                { backgroundColor: srv.bgColor || theme.surfaceMuted },
              ]}
            >
              <Ionicons name={srv.icon} size={22} color={srv.color || theme.primary} />
            </View>
            <Text
              style={[styles.serviceTitle, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {srv.title}
            </Text>
            <Text
              style={[
                styles.serviceDesc,
                { color: srv.descColor || theme.textMuted },
              ]}
              numberOfLines={1}
            >
              {srv.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>


      {/* KURSUS AKTIF */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeadingNoMargin, { color: theme.textMuted }]}>
          KURSUS AKTIF
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (onNavigateToCourseList) {
              onNavigateToCourseList();
            } else {
              Alert.alert('Kursus Siswa', 'Membuka seluruh daftar kursus...');
            }
          }}
        >
          <Text style={[styles.seeAllLink, { color: theme.primary }]}>
            Lihat Semua →
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.coursesList}>
        {activeCourses.length > 0 ? (
          activeCourses.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.courseCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => handleCoursePress(c)}
              activeOpacity={0.88}
            >
              <View style={styles.courseHeader}>
                <View style={[styles.courseIconBox, { backgroundColor: isDark ? theme.surfaceMuted : '#EEF2FF' }]}>
                  <Ionicons name={c.icon || 'school-outline'} size={20} color={c.accentColor || theme.primary} />
                </View>
                <View style={styles.courseMetaCol}>
                  <Text
                    style={[styles.courseTitle, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {c.title}
                  </Text>
                  <Text style={[styles.courseCategory, { color: theme.textMuted }]}>
                    {c.category} • {c.subChaptersCount ? `${c.subChaptersCount} Materi` : (c.duration || 'Fleksibel')}
                  </Text>
                </View>
              </View>

              <Text style={[styles.chapterText, { color: theme.textSecondary }]} numberOfLines={1}>
                {c.currentChapter || c.chapter || 'Mulai Belajar'}
              </Text>

              <View style={styles.courseProgressRow}>
                <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
                  Progres Belajar
                </Text>
                <Text style={[styles.progressVal, { color: theme.textPrimary }]}>
                  {c.progress || 0}%
                </Text>
              </View>
              <View style={[styles.courseProgressTrack, { backgroundColor: theme.surfaceMuted }]}>
                <View
                  style={[
                    styles.courseProgressFill,
                    { width: `${c.progress || 0}%`, backgroundColor: c.accentColor || theme.primary },
                  ]}
                />
              </View>

              <View
                style={[
                  styles.courseCtaBtn,
                  { backgroundColor: isDark ? '#1C2346' : '#EEF2FF' },
                ]}
              >
                <Text style={[styles.courseCtaText, { color: c.accentColor || theme.primary }]}>
                  Lanjutkan Belajar →
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.courseCard, { backgroundColor: theme.surface, borderColor: theme.border, paddingVertical: 24, alignItems: 'center' }]}>
            <Ionicons name="library-outline" size={28} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, marginTop: 8, fontSize: 13 }}>
              Belum ada kursus aktif yang terdaftar.
            </Text>
          </View>
        )}
      </View>

      {/* LEADERBOARD PREVIEW */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeadingNoMargin, { color: theme.textMuted }]}>
          LEADERBOARD KELAS
        </Text>
        <TouchableOpacity onPress={() => setShowLeaderboardModal(true)}>
          <Text style={[styles.seeAllLink, { color: theme.primary }]}>
            Peringkat Lengkap →
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.leaderboardCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {Array.isArray(dashboardData?.leaderboard) && dashboardData.leaderboard.length > 0 ? (
          dashboardData.leaderboard.map((item, idx, arr) => (
            <React.Fragment key={item.id || idx}>
              <View
                style={[
                  styles.leaderboardRow,
                  item.isCurrentUser && {
                    backgroundColor: isDark ? '#162238' : '#EEF2FF',
                    borderRadius: 10,
                    paddingHorizontal: 8,
                  },
                ]}
              >
                <View style={[styles.rankNumberCircle, { backgroundColor: item.rank === 1 ? '#1C2E5A' : item.isCurrentUser ? '#4F46E5' : theme.surfaceMuted }]}>
                  <Text style={item.rank <= 2 ? styles.rankNumberTextWhite : [styles.rankNumberText, { color: theme.textMuted }]}>{item.rank}</Text>
                </View>
                <Text style={[styles.leaderName, { color: theme.textPrimary, fontWeight: item.isCurrentUser ? '700' : '500' }]}>
                  {item.name}
                </Text>
                <Text style={[styles.leaderXp, { color: item.isCurrentUser ? theme.primary : '#10B981', fontWeight: item.isCurrentUser ? '700' : '600' }]}>
                  {item.points} XP
                </Text>
              </View>
              {idx < arr.length - 1 && <View style={[styles.leaderDivider, { backgroundColor: theme.border }]} />}
            </React.Fragment>
          ))
        ) : (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <Ionicons name="trophy-outline" size={26} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 6 }}>
              Belum ada data leaderboard kelas dari server.
            </Text>
          </View>
        )}
      </View>

      {/* PRESENSI KBM MODAL */}
      <Modal
        visible={showPresensiModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPresensiModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.surface,
                paddingBottom: safeBottomPadding,
                maxHeight: '85%',
              },
            ]}
          >
            {/* Header */}
            <View
              style={{
                marginBottom: 14,
                paddingBottom: 12,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.border,
              }}
            >
              {/* Top Row: Title + Close Button */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                    Presensi KBM Kelas
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.closeIconWrap, { backgroundColor: theme.surfaceMuted }]}
                  onPress={() => setShowPresensiModal(false)}
                >
                  <Ionicons name="close" size={18} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Sub Row: Date & Attendance Rate */}
              {presensiData?.todayLabel ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 10,
                    paddingHorizontal: 2,
                  }}
                >
                  <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '600' }}>
                    {presensiData.todayLabel}
                  </Text>

                  {presensiData.attendanceRate !== undefined ? (
                    <View
                      style={{
                        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A',
                      }}
                    >
                      <Text style={{ color: '#F59E0B', fontSize: 10.5, fontWeight: '800' }}>
                        {presensiData.attendanceRate}% HADIR
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
              bounces={false}
            >
              {isLoadingPresensi ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color="#F59E0B" />
                  <Text style={[{ color: theme.textMuted, marginTop: 12, fontSize: 14 }]}>
                    Memuat data presensi…
                  </Text>
                </View>
              ) : presensiData ? (
                <>

                  {/* Today's Records */}
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 }}>
                    PRESENSI HARI INI
                  </Text>

                  {presensiData.todayRecords && presensiData.todayRecords.length > 0 ? (
                    presensiData.todayRecords.map((rec, idx) => (
                      <View
                        key={rec.id ?? idx}
                        style={{
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA',
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: theme.border,
                          padding: 12,
                          marginBottom: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        {/* Status badge */}
                        <View style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: `${rec.statusColor}18`,
                          borderWidth: 1.5,
                          borderColor: `${rec.statusColor}50`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: rec.statusColor }}>
                            {rec.status}
                          </Text>
                        </View>

                        {/* Info */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
                            {rec.subject}
                          </Text>
                          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 1 }}>
                            {rec.period}{rec.timeSlot ? ` - ${rec.timeSlot}` : ''}{rec.className ? ` - ${rec.className}` : ''}
                          </Text>
                          {rec.notes ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                              <Ionicons name="information-circle-outline" size={12} color={theme.textMuted} />
                              <Text style={{ color: theme.textMuted, fontSize: 11, fontStyle: 'italic', flex: 1 }} numberOfLines={1}>
                                {rec.notes}
                              </Text>
                            </View>
                          ) : null}
                          {rec.teachingMaterial ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                              <Ionicons name="book-outline" size={12} color={isDark ? '#A5B4FC' : '#4F46E5'} />
                              <Text style={{ color: isDark ? '#A5B4FC' : '#4F46E5', fontSize: 11, flex: 1 }} numberOfLines={1}>
                                {rec.teachingMaterial}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Status label */}
                        <Text style={{ color: rec.statusColor, fontSize: 12, fontWeight: '700' }}>
                          {rec.statusLabel}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={{
                      alignItems: 'center',
                      paddingVertical: 20,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderStyle: 'dashed',
                      marginBottom: 8,
                    }}>
                      <Ionicons name="time-outline" size={28} color={theme.textMuted} />
                      <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                        Guru belum menginput presensi{'\n'}untuk hari ini.
                      </Text>
                    </View>
                  )}

                  {/* Rekap Total All-Time */}
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginTop: 8, marginBottom: 10 }}>
                    REKAP KEHADIRAN TOTAL
                  </Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                    {[
                      { key: 'H', label: 'Hadir',     color: '#10B981', bg: isDark ? 'rgba(16,185,129,0.12)' : '#F0FDF4' },
                      { key: 'S', label: 'Sakit',     color: '#3B82F6', bg: isDark ? 'rgba(59,130,246,0.12)' : '#EFF6FF' },
                      { key: 'I', label: 'Izin',      color: '#8B5CF6', bg: isDark ? 'rgba(139,92,246,0.12)' : '#F5F3FF' },
                      { key: 'A', label: 'Alpa',      color: '#EF4444', bg: isDark ? 'rgba(239,68,68,0.12)'  : '#FEF2F2' },
                      { key: 'T', label: 'Terlambat', color: '#F59E0B', bg: isDark ? 'rgba(245,158,11,0.12)' : '#FFFBEB' },
                      { key: 'B', label: 'Bolos',     color: '#DC2626', bg: isDark ? 'rgba(220,38,38,0.12)'  : '#FEF2F2' },
                    ].map((item) => (
                      <View
                        key={item.key}
                        style={{
                          width: '30.5%',
                          backgroundColor: item.bg,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: `${item.color}30`,
                          paddingVertical: 10,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: item.color, fontSize: 20, fontWeight: '800' }}>
                          {presensiData.recap?.[item.key] ?? 0}
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2, fontWeight: '600' }}>
                          {item.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'center', marginTop: 6 }}>
                    Total {presensiData.grandTotal ?? 0} pertemuan tercatat
                  </Text>
                </>
              ) : (
                /* No data at all */
                <View style={{ alignItems: 'center', paddingVertical: 36 }}>
                  <View style={{
                    width: 72, height: 72, borderRadius: 36,
                    backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB',
                    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                  }}>
                    <Ionicons name="calendar-outline" size={36} color="#F59E0B" />
                  </View>
                  <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
                    Data Presensi Belum Tersedia
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                    Belum ada data presensi yang dicatat oleh guru untuk Anda.
                  </Text>
                </View>
              )}

              <AppButton
                title="Tutup"
                variant="outline"
                onPress={() => setShowPresensiModal(false)}
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>


      {/* LEADERBOARD MODAL */}
      <Modal
        visible={showLeaderboardModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLeaderboardModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.surface,
                paddingBottom: safeBottomPadding,
              },
            ]}
          >
            <View style={styles.modalSheetHeader}>
              <View style={styles.aiModalTitleRow}>
                <Ionicons name="trophy" size={20} color="#D4A017" />
                <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                  Peringkat Kelas
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeIconWrap, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setShowLeaderboardModal(false)}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <AppButton
              title="Tutup Peringkat"
              onPress={() => setShowLeaderboardModal(false)}
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>

      {/* COURSE MODAL */}
      <Modal
        visible={showCourseModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCourseModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.surface,
                paddingBottom: safeBottomPadding,
              },
            ]}
          >
            <View style={styles.modalSheetHeader}>
              <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                {selectedCourse?.title}
              </Text>
              <TouchableOpacity
                style={[styles.closeIconWrap, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setShowCourseModal(false)}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.aiModalDesc, { color: theme.textSecondary }]}>
              {selectedCourse?.chapter}
            </Text>

            <AppButton
              title="Mulai Sesi Belajar"
              icon="play-outline"
              onPress={() => {
                setShowCourseModal(false);
                Alert.alert('Belajar Mandiri', `Membuka materi ${selectedCourse?.title}...`);
              }}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselWrapper: {
    marginBottom: 16,
  },
  carouselScrollContent: {
    alignItems: 'flex-start',
  },
  carouselSlide: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  carouselDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 4,
    gap: 6,
    marginTop: 10,
  },
  carouselDot: {
    height: 6,
    borderRadius: 3,
  },
  heroCardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 0,
    shadowColor: '#1C2E5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  heroGradient: {
    padding: 18,
    position: 'relative',
  },
  heroDecorCircle1: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  heroDecorCircle2: {
    position: 'absolute',
    right: 50,
    bottom: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    opacity: 0.05,
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroTextCol: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.82)',
    lineHeight: 17,
  },
  heroAvatarWrap: {
    marginLeft: 12,
  },
  heroAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  heroButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroWhiteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  heroWhiteBtnText: {
    color: '#1C2E5A',
    fontSize: 12,
    fontWeight: '700',
  },
  heroOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  heroOutlineBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
    paddingBottom: 16,
    paddingHorizontal: 2,
    marginBottom: 0,
  },
  statCardContainer: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardGradient: {
    padding: 14,
    minHeight: 92,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  statGradientCircle: {
    position: 'absolute',
    right: -16,
    bottom: -16,
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    opacity: 0.25,
  },
  statWatermarkWrap: {
    position: 'absolute',
    right: -6,
    bottom: -8,
    transform: [{ rotate: '-12deg' }],
    opacity: 0.16,
  },
  statCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  statLabelText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statNumberBadgeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  statBigNumber: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  statBadgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statRankCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1C2E5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statSubLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValueBold: {
    fontSize: 15,
    fontWeight: '800',
  },
  statTokenCol: {
    alignItems: 'flex-end',
  },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  tokenValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  claimBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  sectionHeadingNoMargin: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  seeAllLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  serviceCard: {
    width: '48.3%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: 11,
    fontWeight: '500',
  },
  coursesList: {
    gap: 12,
    marginBottom: 20,
  },
  courseCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  courseMetaCol: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  courseCategory: {
    fontSize: 11,
    fontWeight: '500',
  },
  chapterText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 10,
  },
  courseProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  courseProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  courseProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  courseCtaBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  courseCtaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  leaderboardCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  rankNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumberTextWhite: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  rankNumberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  leaderName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  leaderXp: {
    fontSize: 12,
    fontWeight: '700',
  },
  leaderDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  aiModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiModalDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  aiPromptSectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  aiChipsWrap: {
    gap: 8,
    marginBottom: 14,
  },
  aiChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  aiChipText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  aiInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  aiTextInput: {
    flex: 1,
    fontSize: 13,
    minHeight: 40,
    maxHeight: 80,
    paddingRight: 8,
  },
  aiSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  aiLoadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  aiAnswerCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  aiAnswerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiAnswerTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  aiAnswerBody: {
    fontSize: 12.5,
    lineHeight: 18,
  },
});

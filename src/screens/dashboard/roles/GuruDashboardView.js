import React, { useState, useRef, useEffect } from 'react';
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
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../hooks/useAuth';
import { dashboardApi } from '../../../api/dashboardApi';
import { courseApi } from '../../../api/courseApi';
import AppButton from '../../../components/common/AppButton';

export default function GuruDashboardView({
  onNavigateToCourseList,
  onNavigateToCourseDetail,
  onNavigateToProfile,
  onNavigateToCanteen,
  onNavigateToAttendance,
  onNavigateToLocationAttendance,
}) {
  const { theme, isDark } = useTheme();

  const [carouselPage, setCarouselPage] = useState(0);
  const carouselRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const SLIDE_WIDTH = SCREEN_WIDTH - 32;

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

  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sumRes, cRes] = await Promise.all([
          dashboardApi.getSummary().catch(() => null),
          courseApi.getMyCourses().catch(() => null),
        ]);
        if (sumRes?.success && sumRes.data) {
          setDashboardData(sumRes.data);
          if (Array.isArray(sumRes.data.courses) && sumRes.data.courses.length > 0) {
            setCourses(sumRes.data.courses);
          }
        }
        if (cRes?.success && Array.isArray(cRes.data) && cRes.data.length > 0) {
          setCourses(cRes.data);
        }
      } catch (err) {
        console.log('Error loading guru dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // State for Course Editing
  const [editingCourse, setEditingCourse] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLevel, setEditLevel] = useState('beginner');
  const [editStatus, setEditStatus] = useState('published');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  const handleOpenEditCourse = (course) => {
    setEditingCourse(course);
    setEditTitle(course.title || '');
    setEditCategory(course.category?.name || course.category || 'Informatika');
    setEditLevel(course.level || 'beginner');
    setEditStatus(course.statusCode || (course.status === 'Aktif' ? 'published' : (course.status || 'published')));
    setEditDescription(course.description || '');
  };

  const handleSaveEditCourse = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Peringatan', 'Judul kursus tidak boleh kosong.');
      return;
    }

    setIsSavingCourse(true);
    try {
      const res = await courseApi.updateCourse(editingCourse.id, {
        title: editTitle.trim(),
        category: editCategory.trim(),
        level: editLevel,
        status: editStatus,
        description: editDescription.trim(),
      });

      if (res?.success) {
        const updatedCourse = res.data;
        setCourses((prev) =>
          prev.map((c) =>
            c.id === editingCourse.id
              ? {
                  ...c,
                  title: updatedCourse.title,
                  category: updatedCourse.category,
                  level: updatedCourse.level,
                  status: updatedCourse.status === 'published' ? 'Aktif' : 'Draft',
                  statusCode: updatedCourse.status,
                  description: updatedCourse.description,
                }
              : c
          )
        );
        setEditingCourse(null);
        Alert.alert('Sukses', 'Data kursus berhasil diperbarui.');
      } else {
        Alert.alert('Gagal', res?.message || 'Gagal memperbarui data kursus.');
      }
    } catch (err) {
      Alert.alert('Kesalahan', err?.message || 'Terjadi kesalahan saat menyimpan kursus.');
    } finally {
      setIsSavingCourse(false);
    }
  };

  const [showAiGeneratorModal, setShowAiGeneratorModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const stats = dashboardData?.stats || {};
  const teacherStats = [
    {
      label: 'TOTAL SISWA',
      value: String(stats.studentsCount || '28'),
      sub: 'Siswa Aktif',
      icon: 'people',
      color: '#4F46E5',
      lightTint: 'rgba(79, 70, 229, 0.07)',
      borderColor: 'rgba(79, 70, 229, 0.25)',
    },
    {
      label: 'KELAS DIAJAR',
      value: String(stats.classesCount || '4'),
      sub: 'Kelas Aktif',
      icon: 'school',
      color: '#10B981',
      lightTint: 'rgba(16, 185, 129, 0.07)',
      borderColor: 'rgba(16, 185, 129, 0.25)',
    },
    {
      label: 'KURSUS DIBINA',
      value: String(courses.length || stats.coursesCount || '2'),
      sub: 'Tersedia',
      icon: 'library',
      color: '#F59E0B',
      lightTint: 'rgba(245, 158, 11, 0.07)',
      borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    {
      label: 'JAM MENGAJAR',
      value: `${stats.teachingHours || 18} Jam`,
      sub: 'Minggu Ini',
      icon: 'time',
      color: '#8B5CF6',
      lightTint: 'rgba(139, 92, 246, 0.07)',
      borderColor: 'rgba(139, 92, 246, 0.25)',
    },
  ];

  // Use real API data only — empty array if no schedule today (e.g. weekend)
  const todaySchedules = Array.isArray(dashboardData?.todaySchedules)
    ? dashboardData.todaySchedules
    : [];

  const weeklySchedule = dashboardData?.weeklySchedule || null;
  const weeklyDays = Array.isArray(weeklySchedule?.days) ? weeklySchedule.days : [];

  const todayLabel = (() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  })();

  const pendingTasks = [
    {
      id: 'task_1',
      studentName: 'Ahmad Siswa',
      class: 'XII MIPA 2',
      title: 'Praktikum Percabangan Python',
      submittedAt: '08:30 WIB',
      score: null,
    },
    {
      id: 'task_2',
      studentName: 'Citra Wijaya',
      class: 'XII MIPA 2',
      title: 'Tugas Logika Boolean Mandiri',
      submittedAt: '09:10 WIB',
      score: null,
    },
  ];

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
            {/* SLIDE 1: HERO TEACHER BANNER */}
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
                        <View style={styles.roleChipHero}>
                          <Ionicons name="school" size={12} color="#FFFFFF" />
                          <Text style={styles.roleChipHeroText}>PORTAL GURU & PENGAJAR</Text>
                        </View>
                        <Text style={styles.heroGreeting}>Halo, {user?.name || 'Bpk. Guru'}!</Text>
                        <Text style={styles.heroSub}>
                          Semangat membimbing siswa hari ini. Portal KBM siap digunakan.
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
                              {user?.name ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : 'BG'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Quick Action Buttons */}
                    <View style={styles.heroButtonsRow}>
                      <TouchableOpacity
                        style={styles.heroWhiteBtn}
                        onPress={() =>
                          onNavigateToLocationAttendance
                            ? onNavigateToLocationAttendance()
                            : Alert.alert('Presensi GPS', 'Membuka lembar presensi lokasi GPS...')
                        }
                        activeOpacity={0.8}
                      >
                        <Ionicons name="location" size={15} color="#1C2E5A" />
                        <Text style={styles.heroWhiteBtnText}>Presensi GPS</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.heroOutlineBtn}
                        onPress={() =>
                          onNavigateToAttendance
                            ? onNavigateToAttendance()
                            : Alert.alert('Presensi Kelas', 'Membuka lembar presensi KBM kelas aktif...')
                        }
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkbox-outline" size={15} color="#FFFFFF" />
                        <Text style={styles.heroOutlineBtnText}>Presensi Siswa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.heroOutlineBtn, { paddingHorizontal: 10 }]}
                        onPress={() => setShowAiGeneratorModal(true)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="sparkles" size={15} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>

            {/* SLIDE 2: STATS 4-GRID (TEACHER METRICS) */}
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
                {teacherStats.map((item, idx) => (
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

                      {/* Watermark Giant Vector Icon Rotated -12deg */}
                      <View style={styles.statWatermarkWrap}>
                        <Ionicons
                          name={item.icon}
                          size={66}
                          color={item.color}
                        />
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

      {/* 3. WIDGET: JADWAL & AKTIVITAS MENGAJAR HARI INI (Activity Timeline - Sesuai Template Web) */}
      <View
        style={[
          styles.timelineCardWrapper,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Header Widget */}
        <View style={[styles.timelineCardHeader, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.timelineCardTitle, { color: theme.textPrimary }]}>
              Jadwal Mengajar Hari Ini
            </Text>
            <Text style={[styles.timelineCardSub, { color: theme.textMuted }]}>
              {todayLabel} • Jam KBM & Infal
            </Text>
          </View>

          <View style={styles.piketBadge}>
            <View style={styles.piketPulseDot} />
            <Text style={styles.piketBadgeText}>Petugas Piket</Text>
          </View>
        </View>

        {/* Timeline Content */}
        <View style={styles.timelineContainer}>
          {/* Vertical Connecting Line — only show when there are schedules */}
          {todaySchedules.length > 0 && (
            <View
              style={[
                styles.timelineTrackLine,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0' },
              ]}
            />
          )}

          {/* Empty State — no schedule today */}
          {todaySchedules.length === 0 && (
            <View style={styles.scheduleEmptyState}>
              <View style={[styles.scheduleEmptyIcon, { backgroundColor: isDark ? 'rgba(79,70,229,0.12)' : '#EEF2FF' }]}>
                <Ionicons name="calendar-outline" size={28} color="#6366F1" />
              </View>
              <Text style={[styles.scheduleEmptyTitle, { color: theme.textPrimary }]}>
                Tidak Ada Jadwal Hari Ini
              </Text>
              <Text style={[styles.scheduleEmptyDesc, { color: theme.textMuted }]}>
                {isLoading ? 'Memuat jadwal...' : 'Selamat beristirahat. Tidak ada sesi KBM yang terjadwal untuk hari ini.'}
              </Text>
            </View>
          )}

          {todaySchedules.map((sch, index) => {
            const isLast = index === todaySchedules.length - 1;
            const nodeColor =
              sch.type === 'ekskul'
                ? '#F59E0B'
                : sch.type === 'infal'
                  ? '#EF4444'
                  : '#4F46E5';

            const cardBg = isDark
              ? sch.isActive
                ? 'rgba(79, 70, 229, 0.13)'
                : sch.type === 'ekskul'
                  ? 'rgba(245, 158, 11, 0.08)'
                  : sch.type === 'infal'
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'rgba(30, 41, 59, 0.5)'
              : sch.isActive
                ? 'rgba(238, 242, 255, 0.9)'
                : sch.type === 'ekskul'
                  ? '#FFFBEB'
                  : sch.type === 'infal'
                    ? '#FEF2F2'
                    : '#F8FAFC';

            const cardBorder = isDark
              ? sch.isActive
                ? 'rgba(99, 102, 241, 0.45)'
                : sch.type === 'ekskul'
                  ? 'rgba(245, 158, 11, 0.25)'
                  : sch.type === 'infal'
                    ? 'rgba(239, 68, 68, 0.25)'
                    : 'rgba(255, 255, 255, 0.08)'
              : sch.isActive
                ? '#818CF8'
                : sch.type === 'ekskul'
                  ? '#FDE68A'
                  : sch.type === 'infal'
                    ? '#FECACA'
                    : '#E2E8F0';

            return (
              <View
                key={sch.id}
                style={[styles.timelineItemRow, isLast && { marginBottom: 0 }]}
              >
                {/* Node Marker Badge */}
                <View style={[styles.timelineNode, { backgroundColor: nodeColor }]}>
                  {sch.type === 'ekskul' ? (
                    <Ionicons name="trophy" size={13} color="#FFFFFF" />
                  ) : sch.type === 'infal' ? (
                    <Ionicons name="swap-horizontal" size={14} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.timelineNodeText}>{sch.periodNumber}</Text>
                  )}
                </View>

                {/* Speech Bubble Arrow Notch */}
                <View
                  style={[
                    styles.timelineNotch,
                    {
                      backgroundColor: cardBg,
                      borderLeftColor: cardBorder,
                      borderBottomColor: cardBorder,
                    },
                  ]}
                />

                {/* Timeline Card Item */}
                <View
                  style={[
                    styles.timelineItemCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      borderWidth: sch.isActive ? 1.5 : 1,
                    },
                  ]}
                >
                  {/* Top Line: Time & Status Badges */}
                  <View style={styles.timelineItemTop}>
                    <Text
                      style={[
                        styles.timelinePeriodTime,
                        {
                          color:
                            sch.type === 'ekskul'
                              ? '#D97706'
                              : sch.type === 'infal'
                                ? '#DC2626'
                                : theme.textMuted,
                        },
                      ]}
                    >
                      {sch.periodLabel} • {sch.time}
                    </Text>

                    <View
                      style={[
                        styles.timelineBadgePill,
                        sch.isActive
                          ? { backgroundColor: '#10B981' }
                          : sch.type === 'infal'
                            ? { backgroundColor: '#EF4444' }
                            : sch.type === 'ekskul'
                              ? { backgroundColor: '#F59E0B' }
                              : {
                                backgroundColor: isDark
                                  ? 'rgba(255, 255, 255, 0.1)'
                                  : '#FFFFFF',
                                borderColor: isDark ? 'transparent' : '#CBD5E1',
                                borderWidth: isDark ? 0 : 1,
                              },
                      ]}
                    >
                      {sch.isActive && <View style={styles.activeDotPulse} />}
                      <Text
                        style={[
                          styles.timelineBadgePillText,
                          {
                            color:
                              sch.isActive ||
                                sch.type === 'infal' ||
                                sch.type === 'ekskul'
                                ? '#FFFFFF'
                                : theme.textPrimary,
                          },
                        ]}
                      >
                        {sch.badgeLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Main Title: Classroom & Subject */}
                  <Text
                    style={[
                      styles.timelineSubjectTitle,
                      { color: theme.textPrimary },
                    ]}
                  >
                    Kelas {sch.class}:{' '}
                    <Text
                      style={{
                        color:
                          sch.type === 'infal'
                            ? '#EF4444'
                            : sch.type === 'ekskul'
                              ? '#D97706'
                              : '#4F46E5',
                        fontWeight: '800',
                      }}
                    >
                      {sch.subject}
                    </Text>
                  </Text>

                  {/* Sub-info: Room & Note */}
                  <View style={styles.timelineLocationRow}>
                    <Ionicons
                      name="location-outline"
                      size={13}
                      color={theme.textMuted}
                    />
                    <Text
                      style={[
                        styles.timelineLocationText,
                        { color: theme.textMuted },
                      ]}
                    >
                      {sch.room} • {sch.note}
                    </Text>
                  </View>

                  {/* Presensi & Jurnal Action Footer */}
                  <View
                    style={[
                      styles.timelineActionFooter,
                      {
                        borderTopColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.timelineActionBtn,
                        sch.isActive
                          ? { backgroundColor: '#4F46E5' }
                          : sch.type === 'ekskul'
                            ? { backgroundColor: '#F59E0B' }
                            : {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.06)'
                                : '#FFFFFF',
                              borderColor: isDark
                                ? 'rgba(255, 255, 255, 0.12)'
                                : '#CBD5E1',
                              borderWidth: 1,
                            },
                      ]}
                      onPress={() =>
                        onNavigateToAttendance
                          ? onNavigateToAttendance(sch)
                          : Alert.alert(
                              sch.subject,
                              `Membuka sesi presensi ${sch.subject}`
                            )
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={sch.actionIcon}
                        size={14}
                        color={
                          sch.isActive || sch.type === 'ekskul'
                            ? '#FFFFFF'
                            : theme.textMuted
                        }
                      />
                      <Text
                        style={[
                          styles.timelineActionBtnText,
                          {
                            color:
                              sch.isActive || sch.type === 'ekskul'
                                ? '#FFFFFF'
                                : theme.textMuted,
                          },
                        ]}
                      >
                        {sch.actionText}
                      </Text>
                    </TouchableOpacity>

                    {sch.attendanceTime && (
                      <View style={styles.attendanceStampWrap}>
                        <Text
                          style={[
                            styles.attendanceStampLabel,
                            { color: theme.textMuted },
                          ]}
                        >
                          Masuk:{' '}
                          <Text
                            style={{
                              color: theme.textPrimary,
                              fontWeight: '800',
                            }}
                          >
                            {sch.attendanceTime}
                          </Text>
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer Link: Jadwal Lengkap */}
        <TouchableOpacity
          style={[
            styles.timelineFooterBtn,
            {
              borderTopColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : '#F1F5F9',
            },
          ]}
          onPress={() => setShowScheduleModal(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.timelineFooterBtnText, { color: theme.primary }]}>
            Lihat Jadwal Mengajar Lengkap Mingguan →
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. TUGAS SISWA PERLU DINILAI */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
          TUGAS MENUNGGU REVIEW (8)
        </Text>
        <TouchableOpacity
          onPress={() => Alert.alert('Review Tugas', 'Membuka seluruh antrean koreksi tugas...')}
        >
          <Text style={[styles.seeAllLink, { color: theme.primary }]}>
            Koreksi Semua →
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.reviewCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {pendingTasks.map((t, index) => (
          <View key={t.id}>
            <View style={styles.taskItemRow}>
              <View style={[styles.taskAvatarCircle, { backgroundColor: theme.surfaceMuted }]}>
                <Text style={[styles.taskAvatarText, { color: theme.textPrimary }]}>
                  {t.studentName[0]}
                </Text>
              </View>
              <View style={styles.taskMeta}>
                <Text style={[styles.taskStudentName, { color: theme.textPrimary }]}>
                  {t.studentName}
                </Text>
                <Text style={[styles.taskTitle, { color: theme.textMuted }]}>
                  {t.title} • {t.class}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.scoreBtn, { backgroundColor: theme.primary }]}
                onPress={() => {
                  setSelectedTask(t);
                  setShowReviewModal(true);
                }}
              >
                <Text style={styles.scoreBtnText}>Beri Nilai</Text>
              </TouchableOpacity>
            </View>
            {index < pendingTasks.length - 1 && (
              <View style={[styles.taskDivider, { backgroundColor: theme.border }]} />
            )}
          </View>
        ))}
      </View>

      {/* 5. KURSUS & MODUL AJAR */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeadingNoMargin, { color: theme.textMuted }]}>
          KURSUS & MODUL DIAJAR
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (onNavigateToCourseList) {
              onNavigateToCourseList();
            } else {
              Alert.alert('Katalog Kursus', 'Membuka seluruh katalog kursus...');
            }
          }}
        >
          <Text style={[styles.seeAllLink, { color: theme.primary }]}>
            Lihat Semua →
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.coursesList}>
        {courses.length > 0 ? (
          courses.slice(0, 3).map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.courseCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => {
                if (onNavigateToCourseDetail) {
                  onNavigateToCourseDetail(c);
                } else if (onNavigateToCourseList) {
                  onNavigateToCourseList();
                }
              }}
              activeOpacity={0.88}
            >
              <View style={styles.courseHeader}>
                <View
                  style={[
                    styles.courseIconBox,
                    { backgroundColor: isDark ? theme.surfaceMuted : '#EEF2FF' },
                  ]}
                >
                  <Ionicons
                    name="book-outline"
                    size={20}
                    color={theme.primary}
                  />
                </View>
                <View style={styles.courseMetaCol}>
                  <Text
                    style={[styles.courseTitle, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {c.title}
                  </Text>
                  <Text style={[styles.courseCategory, { color: theme.textMuted }]}>
                    {c.category?.name || c.category || 'Materi KBM'} • {c.sub_chapters_count || c.subChaptersCount || 0} Materi
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TouchableOpacity
                    style={[
                      styles.editCourseBtn,
                      { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.22)' : '#EEF2FF' },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      handleOpenEditCourse(c);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={13} color="#4F46E5" />
                    <Text style={styles.editCourseBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                </View>
              </View>
              {c.description ? (
                <Text
                  style={[styles.courseDesc, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {c.description}
                </Text>
              ) : null}
              <View style={styles.courseFooterBadges}>
                <View style={[styles.courseLevelBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}>
                  <Text style={[styles.courseLevelBadgeText, { color: theme.textSecondary }]}>
                    {c.level === 'advanced' ? 'Mahir' : (c.level === 'intermediate' ? 'Menengah' : 'Pemula')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.courseStatusBadge,
                    {
                      backgroundColor: (c.statusCode === 'published' || c.status === 'Aktif')
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(100, 116, 139, 0.12)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.courseStatusBadgeText,
                      {
                        color: (c.statusCode === 'published' || c.status === 'Aktif')
                          ? '#10B981'
                          : '#64748B',
                      },
                    ]}
                  >
                    {(c.statusCode === 'published' || c.status === 'Aktif') ? 'Aktif' : 'Draf'}
                  </Text>
                </View>
                <View style={{ flex: 1 }} />
                <Text style={[styles.courseStudentCount, { color: theme.textMuted }]}>
                  {c.studentsCount || c.students_count || 0} Siswa
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View
            style={[
              styles.emptyCoursesCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons name="library-outline" size={32} color={theme.textMuted} />
            <Text style={[styles.emptyCoursesText, { color: theme.textMuted }]}>
              Belum ada kursus aktif. Buka katalog untuk mulai membuat atau menugaskan modul.
            </Text>
            {onNavigateToCourseList && (
              <TouchableOpacity
                style={[styles.emptyCoursesBtn, { backgroundColor: theme.primary }]}
                onPress={onNavigateToCourseList}
              >
                <Text style={styles.emptyCoursesBtnText}>Buka Katalog Kursus</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* 6. QUICK TEACHER TOOLS */}
      <Text style={[styles.sectionHeading, { color: theme.textMuted, marginTop: 10 }]}>
        ALAT PENGAJAR & ADMINISTRASI KBM
      </Text>

      <View style={styles.toolsGrid}>
        <TouchableOpacity
          style={[
            styles.toolItem,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => setShowAiGeneratorModal(true)}
        >
          <View style={[styles.toolIconBox, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="sparkles" size={20} color="#7C3AED" />
          </View>
          <Text style={[styles.toolTitle, { color: theme.textPrimary }]}>AI Generator</Text>
          <Text style={[styles.toolDesc, { color: theme.textMuted }]}>Bikin soal otomatis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toolItem,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => {
            if (onNavigateToCourseList) {
              onNavigateToCourseList();
            } else {
              Alert.alert('Kelola Kursus', 'Membuka katalog modul pembelajaran...');
            }
          }}
        >
          <View style={[styles.toolIconBox, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="book-outline" size={20} color="#10B981" />
          </View>
          <Text style={[styles.toolTitle, { color: theme.textPrimary }]}>Kelola Kursus</Text>
          <Text style={[styles.toolDesc, { color: theme.textMuted }]}>Katalog modul KBM</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toolItem,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => {
            if (onNavigateToCanteen) {
              onNavigateToCanteen();
            } else {
              Alert.alert('Kantin Sekolah', 'Membuka pemesanan kantin sekolah...');
            }
          }}
        >
          <View style={[styles.toolIconBox, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="fast-food-outline" size={20} color="#F59E0B" />
          </View>
          <Text style={[styles.toolTitle, { color: theme.textPrimary }]}>Kantin Sekolah</Text>
          <Text style={[styles.toolDesc, { color: theme.textMuted }]}>Pesan menu kantin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toolItem,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => Alert.alert('Jurnal Mengajar', 'Catatan KBM harian tersimpan otomatis.')}
        >
          <View style={[styles.toolIconBox, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="create-outline" size={20} color="#4F46E5" />
          </View>
          <Text style={[styles.toolTitle, { color: theme.textPrimary }]}>Jurnal Guru</Text>
          <Text style={[styles.toolDesc, { color: theme.textMuted }]}>Catatan KBM harian</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL: AI SOAL GENERATOR */}
      <Modal
        visible={showAiGeneratorModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAiGeneratorModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalSheetHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="sparkles" size={20} color="#7C3AED" />
                <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                  AI Generator Soal KBM
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeIconWrap, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setShowAiGeneratorModal(false)}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescText, { color: theme.textSecondary }]}>
              Buat paket soal kuis atau ulangan harian otomatis berdasarkan topik kurikulum dengan bantuan AI PedaGogi.
            </Text>

            <View style={styles.generatorBox}>
              <Text style={[styles.generatorPresetLabel, { color: theme.textMuted }]}>
                PILIH PRESET KELAS & MATERI:
              </Text>
              <TouchableOpacity
                style={[styles.presetOption, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => {
                  setShowAiGeneratorModal(false);
                  Alert.alert('AI Sukses', 'Berhasil membuat 10 soal Pilihan Ganda & Kunci Jawaban materi "Algoritma Python".');
                }}
              >
                <Ionicons name="flash-outline" size={16} color="#7C3AED" />
                <Text style={[styles.presetOptionText, { color: theme.textPrimary }]}>
                  10 Soal: Informatika XII (Percabangan & Looping)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetOption, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => {
                  setShowAiGeneratorModal(false);
                  Alert.alert('AI Sukses', 'Berhasil membuat 5 soal Esai Analisis materi "Energi Mekanik".');
                }}
              >
                <Ionicons name="flash-outline" size={16} color="#7C3AED" />
                <Text style={[styles.presetOptionText, { color: theme.textPrimary }]}>
                  5 Soal Esai: Fisika XII (Hukum Kekekalan Energi)
                </Text>
              </TouchableOpacity>
            </View>

            <AppButton
              title="Tutup"
              variant="outline"
              onPress={() => setShowAiGeneratorModal(false)}
              style={{ marginTop: 12, marginBottom: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL: REVIEW TASK */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalSheetHeader}>
              <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                Penilaian Tugas Siswa
              </Text>
              <TouchableOpacity
                style={[styles.closeIconWrap, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setShowReviewModal(false)}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescText, { color: theme.textSecondary }]}>
              Siswa: {selectedTask?.studentName} ({selectedTask?.class})
              {'\n'}Materi: {selectedTask?.title}
            </Text>

            <View style={styles.scoreRow}>
              {[80, 85, 90, 95, 100].map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[styles.scoreOptionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setShowReviewModal(false);
                    Alert.alert('Nilai Tersimpan', `Nilai ${score} berhasil diberikan kepada ${selectedTask?.studentName}.`);
                  }}
                >
                  <Text style={styles.scoreOptionText}>{score}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <AppButton
              title="Batal"
              variant="outline"
              onPress={() => setShowReviewModal(false)}
              style={{ marginTop: 16, marginBottom: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL: JADWAL MENGAJAR LENGKAP */}
      <Modal
        visible={showScheduleModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface, maxHeight: '88%' }]}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                  Jadwal Mengajar Mingguan
                </Text>
                <Text style={[styles.modalDescText, { color: theme.textMuted, marginTop: 2, marginBottom: 0 }]}>
                  {weeklySchedule?.subtitle || 'Semester Ganjil 2026/2027'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeIconWrap, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setShowScheduleModal(false)}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 12 }}>
              {weeklyDays.length === 0 ? (
                <View style={[styles.scheduleEmptyState, { marginVertical: 24 }]}>
                  <Ionicons name="calendar-outline" size={40} color={theme.textMuted} />
                  <Text style={[styles.scheduleEmptyTitle, { color: theme.textPrimary, marginTop: 10 }]}>
                    Belum Ada Jadwal Mingguan
                  </Text>
                  <Text style={[styles.scheduleEmptyDesc, { color: theme.textMuted, textAlign: 'center', marginTop: 4 }]}>
                    Tidak ada plotting jadwal mengajar KBM ataupun kegiatan ekskul pada versi dan semester aktif saat ini.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {weeklyDays.map((sch, i) => (
                    <View
                      key={i}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        backgroundColor: theme.surfaceMuted,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8,
                          paddingBottom: 6,
                          borderBottomWidth: 1,
                          borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5' }} />
                          <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary }}>
                            {sch.day}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#4F46E5' }}>
                          {sch.count}
                        </Text>
                      </View>

                      {Array.isArray(sch.slots) && sch.slots.length > 0 ? (
                        <View style={{ gap: 6 }}>
                          {sch.slots.map((slot, sIdx) => (
                            <View
                              key={sIdx}
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EDF2F7',
                              }}
                            >
                              <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textPrimary }} numberOfLines={1}>
                                  {slot.subject}
                                </Text>
                                <Text style={{ fontSize: 11, fontWeight: '600', color: slot.type === 'ekskul' ? '#D97706' : '#4F46E5', marginTop: 1 }}>
                                  {slot.classroom}
                                </Text>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textPrimary }}>
                                  {slot.periodLabel}
                                </Text>
                                <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 1 }}>
                                  {slot.time}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>
                          {sch.items}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <AppButton
              title="Tutup"
              variant="outline"
              onPress={() => setShowScheduleModal(false)}
              style={{ marginBottom: 12 }}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL: EDIT DATA KURSUS */}
      <Modal
        visible={!!editingCourse}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingCourse(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalSheet, { backgroundColor: theme.surface, maxHeight: '85%' }]}>
            <View style={styles.modalSheetHeader}>
              <View>
                <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                  Edit Data Kursus
                </Text>
                <Text style={[styles.modalDescText, { color: theme.textMuted, marginTop: 2, marginBottom: 0 }]}>
                  Perbarui modul dan kurikulum yang Anda bina
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }]}
                onPress={() => setEditingCourse(null)}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
              {/* Judul Kursus */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  JUDUL KURSUS
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC',
                      borderColor: isDark ? theme.border : '#CBD5E1',
                      color: theme.textPrimary,
                    },
                  ]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Masukkan judul kursus..."
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              {/* Kategori */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  KATEGORI
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC',
                      borderColor: isDark ? theme.border : '#CBD5E1',
                      color: theme.textPrimary,
                    },
                  ]}
                  value={editCategory}
                  onChangeText={setEditCategory}
                  placeholder="Contoh: Coding & Robotika, Informatika..."
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              {/* Tingkat Kesulitan */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  TINGKAT KESULITAN
                </Text>
                <View style={styles.segmentedRow}>
                  {[
                    { id: 'beginner', label: 'Pemula' },
                    { id: 'intermediate', label: 'Menengah' },
                    { id: 'advanced', label: 'Mahir' },
                  ].map((lvl) => {
                    const isSelected = editLevel === lvl.id;
                    return (
                      <TouchableOpacity
                        key={lvl.id}
                        style={[
                          styles.segmentedBtn,
                          isSelected
                            ? { backgroundColor: '#4F46E5' }
                            : { backgroundColor: isDark ? theme.surfaceMuted : '#F1F5F9' },
                        ]}
                        onPress={() => setEditLevel(lvl.id)}
                      >
                        <Text
                          style={[
                            styles.segmentedBtnText,
                            { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                          ]}
                        >
                          {lvl.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Status Publikasi */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  STATUS PUBLIKASI
                </Text>
                <View style={styles.segmentedRow}>
                  {[
                    { id: 'published', label: 'Dipublikasikan (Aktif)' },
                    { id: 'draft', label: 'Simpan Draf' },
                  ].map((st) => {
                    const isSelected = editStatus === st.id;
                    return (
                      <TouchableOpacity
                        key={st.id}
                        style={[
                          styles.segmentedBtn,
                          isSelected
                            ? { backgroundColor: st.id === 'published' ? '#10B981' : '#64748B' }
                            : { backgroundColor: isDark ? theme.surfaceMuted : '#F1F5F9' },
                        ]}
                        onPress={() => setEditStatus(st.id)}
                      >
                        <Text
                          style={[
                            styles.segmentedBtnText,
                            { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                          ]}
                        >
                          {st.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Deskripsi */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  DESKRIPSI KURSUS
                </Text>
                <TextInput
                  style={[
                    styles.formInputMulti,
                    {
                      backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC',
                      borderColor: isDark ? theme.border : '#CBD5E1',
                      color: theme.textPrimary,
                    },
                  ]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Tuliskan deskripsi ringkas silabus kursus..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[
                    styles.cancelModalBtn,
                    { borderColor: isDark ? theme.border : '#CBD5E1' },
                  ]}
                  onPress={() => setEditingCourse(null)}
                  disabled={isSavingCourse}
                >
                  <Text style={[styles.cancelModalBtnText, { color: theme.textSecondary }]}>
                    Batal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveModalBtn, { backgroundColor: '#4F46E5' }]}
                  onPress={handleSaveEditCourse}
                  disabled={isSavingCourse}
                >
                  {isSavingCourse ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.saveModalBtnText}>Simpan Perubahan</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  roleChipHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  roleChipHeroText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    gap: 10,
    paddingTop: 4,
    paddingBottom: 16,
    paddingHorizontal: 2,
    marginBottom: 0,
  },
  statCardContainer: {
    width: '48.3%',
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
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  statBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    transform: [{ translateY: -2 }],
  },
  statBadgePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionHeading: {
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
  // Activity Timeline Styles (Web Parity)
  timelineCardWrapper: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#1C2E5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  timelineCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  timelineCardSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  piketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  piketPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  piketBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 36,
  },
  timelineTrackLine: {
    position: 'absolute',
    left: 13,
    top: 14,
    bottom: 24,
    width: 2,
  },
  scheduleEmptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  scheduleEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scheduleEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  scheduleEmptyDesc: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  timelineItemRow: {
    position: 'relative',
    marginBottom: 16,
  },
  timelineNode: {
    position: 'absolute',
    left: -36,
    top: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineNodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timelineNotch: {
    position: 'absolute',
    left: -5,
    top: 21,
    width: 10,
    height: 10,
    transform: [{ rotate: '45deg' }],
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    zIndex: 2,
  },
  timelineItemCard: {
    borderRadius: 14,
    padding: 13,
    position: 'relative',
    zIndex: 1,
    overflow: 'hidden',
  },
  timelineItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 6,
    flexWrap: 'wrap',
  },
  timelinePeriodTime: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  timelineBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  activeDotPulse: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  timelineBadgePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  timelineSubjectTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 4,
  },
  timelineLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  timelineLocationText: {
    fontSize: 11.5,
    fontWeight: '500',
    flex: 1,
  },
  timelineActionFooter: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  timelineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  timelineActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  attendanceStampWrap: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  attendanceStampLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  timelineFooterBtn: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineFooterBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  taskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  taskAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  taskMeta: {
    flex: 1,
  },
  taskStudentName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  taskTitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  scoreBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  taskDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  toolItem: {
    width: '48.3%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  toolIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  toolDesc: {
    fontSize: 11,
    fontWeight: '500',
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
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDescText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  generatorBox: {
    gap: 10,
    marginBottom: 14,
  },
  generatorPresetLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  presetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  presetOptionText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  scoreOptionBtn: {
    width: 48,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeadingNoMargin: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  coursesList: {
    gap: 12,
    marginBottom: 20,
  },
  courseCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courseIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseMetaCol: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  courseCategory: {
    fontSize: 11,
    fontWeight: '500',
  },
  courseDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  emptyCoursesCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  emptyCoursesText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyCoursesBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  emptyCoursesBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  editCourseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editCourseBtnText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
  },
  courseFooterBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  courseLevelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  courseLevelBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  courseStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  courseStatusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  courseStudentCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  formInputMulti: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 20,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveModalBtn: {
    flex: 1.6,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

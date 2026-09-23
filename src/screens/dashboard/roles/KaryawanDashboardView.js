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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../hooks/useAuth';
import { dashboardApi } from '../../../api/dashboardApi';
import AppButton from '../../../components/common/AppButton';
import ServerConnectionError from '../../../components/common/ServerConnectionError';

export default function KaryawanDashboardView({
  onNavigateToCanteen,
  onNavigateToWallet,
  onNavigateToCourseList,
  onNavigateToProfile,
}) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  const [carouselPage, setCarouselPage] = useState(0);
  const carouselRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const SLIDE_WIDTH = SCREEN_WIDTH - 32;

  const scrollToSlide = (index) => {
    carouselRef.current?.scrollTo({ x: index * SLIDE_WIDTH, animated: true });
    setCarouselPage(index);
  };

  const [heroHeight, setHeroHeight] = useState(150);
  const [kpiHeight, setKpiHeight] = useState(196);

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

  const [showJournalModal, setShowJournalModal] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardApi.getSummary();
      if (res?.success && res.data) {
        setConnectionError(null);
        setDashboardData(res.data);
      } else {
        setConnectionError('Gagal terhubung ke server.');
      }
    } catch (err) {
      console.log('Error loading karyawan summary:', err);
      setDashboardData(null);
      setConnectionError(
        err?.message || 'Gagal terhubung ke server.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (connectionError) {
    return (
      <ServerConnectionError
        onRetry={load}
        isRetrying={isLoading}
        errorMessage={connectionError}
      />
    );
  }

  const [tasks, setTasks] = useState([
    { id: '1', title: 'Validasi berkas beasiswa 10 siswa baru', tag: 'DAPODIK', done: false, priority: 'Tinggi' },
    { id: '2', title: 'Pencetakan 2 smart card siswa yang hilang', tag: 'Smart Card', done: true, priority: 'Sedang' },
    { id: '3', title: 'Rekapitulasi berkas surat masuk dinas pendidikan', tag: 'Arsip TU', done: false, priority: 'Normal' },
  ]);

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const stats = dashboardData?.stats || {};

  const staffStats = [
    {
      label: 'PRESENSI KERJA',
      value: stats.attendanceStatus || 'Hadir',
      sub: stats.attendanceTime || '06:45 WIB',
      icon: 'time',
      color: '#10B981',
      lightTint: 'rgba(16, 185, 129, 0.07)',
      borderColor: 'rgba(16, 185, 129, 0.25)',
    },
    {
      label: 'TUGAS PENDING',
      value: String(stats.pendingTasksCount ?? '3'),
      sub: 'Agenda Kerja',
      icon: 'clipboard',
      color: '#4F46E5',
      lightTint: 'rgba(79, 70, 229, 0.07)',
      borderColor: 'rgba(79, 70, 229, 0.25)',
    },
    {
      label: 'BERKAS MASUK',
      value: '12',
      sub: 'Verifikasi Arsip',
      icon: 'folder-open',
      color: '#F59E0B',
      lightTint: 'rgba(245, 158, 11, 0.07)',
      borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    {
      label: 'TIKET BANTUAN',
      value: String(stats.supportTicketsCount ?? '2'),
      sub: 'Perlu Respon',
      icon: 'chatbox-ellipses',
      color: '#8B5CF6',
      lightTint: 'rgba(139, 92, 246, 0.07)',
      borderColor: 'rgba(139, 92, 246, 0.25)',
    },
  ];

  const staffServices = [
    {
      id: 'srv_1',
      title: 'Kantin Sekolah',
      desc: 'Pesan makan & minuman',
      icon: 'fast-food-outline',
      color: '#F59E0B',
      action: onNavigateToCanteen,
    },
    {
      id: 'srv_2',
      title: 'Dompet & Saldo',
      desc: 'Cek saldo digital Anda',
      icon: 'wallet-outline',
      color: '#10B981',
      action: onNavigateToWallet,
    },
    {
      id: 'srv_3',
      title: 'Work Journal Harian',
      desc: 'Catatan kerja operasional',
      icon: 'reader-outline',
      color: '#4F46E5',
      action: () => setShowJournalModal(true),
    },
    {
      id: 'srv_4',
      title: 'Katalog Kursus & Materi',
      desc: 'Lihat modul pembelajaran',
      icon: 'book-outline',
      color: '#8B5CF6',
      action: onNavigateToCourseList,
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
            {/* SLIDE 1: HERO STAFF BANNER */}
            <Animated.View
              style={[
                styles.carouselSlide,
                {
                  width: SLIDE_WIDTH,
                  transform: [{ scale: slide0Scale }],
                  opacity: slide0Opacity,
                },
              ]}
              onLayout={(e) => {
                const h = Math.round(e.nativeEvent.layout.height);
                if (h > 0 && Math.abs(h - heroHeight) > 2) {
                  setHeroHeight(h);
                }
              }}
            >
              <View style={styles.heroCardContainer}>
                <LinearGradient
                  colors={['#1C2E5A', '#253B73']}
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
                          <Ionicons name="briefcase" size={12} color="#FFFFFF" />
                          <Text style={styles.roleChipHeroText}>PORTAL TATA USAHA & STAF</Text>
                        </View>
                        <Text style={styles.heroGreeting}>Halo, {user?.name || 'Staf Operasional'}</Text>
                        <Text style={styles.heroSub}>
                          Presensi: Hadir ({stats.attendanceTime || '06:45 WIB'}) • Agenda kerja siap dikerjakan
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
                              {user?.name ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : 'ST'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Quick Action Buttons */}
                    <View style={styles.heroButtonsRow}>
                      <TouchableOpacity
                        style={styles.heroWhiteBtn}
                        onPress={() => setShowJournalModal(true)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="create" size={15} color="#1C2E5A" />
                        <Text style={styles.heroWhiteBtnText}>Isi Work Journal</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.heroOutlineBtn}
                        onPress={() =>
                          Alert.alert('Cetak Kartu', 'Membuka modul antrean pencetakan Smart Card RFID siswa...')
                        }
                        activeOpacity={0.8}
                      >
                        <Ionicons name="card-outline" size={15} color="#FFFFFF" />
                        <Text style={styles.heroOutlineBtnText}>Cetak Smart Card</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>

            {/* SLIDE 2: STATS 4-GRID (STAFF METRICS) */}
            <Animated.View
              style={[
                styles.carouselSlide,
                {
                  width: SLIDE_WIDTH,
                  transform: [{ scale: slide1Scale }],
                  opacity: slide1Opacity,
                },
              ]}
              onLayout={(e) => {
                const h = Math.round(e.nativeEvent.layout.height);
                if (h > 0 && Math.abs(h - kpiHeight) > 2) {
                  setKpiHeight(h);
                }
              }}
            >
              <View style={styles.statsGrid}>
                {staffStats.map((item, idx) => (
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

      {/* 3. LAYANAN OPERASIONAL TATA USAHA */}
      <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
        LAYANAN OPERASIONAL TATA USAHA
      </Text>

      <View style={styles.servicesGrid}>
        {staffServices.map((srv) => (
          <TouchableOpacity
            key={srv.id}
            style={[
              styles.serviceCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => {
              if (srv.action) {
                srv.action();
              } else {
                Alert.alert(srv.title, `Membuka layanan ${srv.title} untuk pengelolaan berkas sekolah.`);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.serviceIconWrap, { backgroundColor: theme.surfaceMuted }]}>
              <Ionicons name={srv.icon} size={22} color={srv.color} />
            </View>
            <Text style={[styles.serviceTitle, { color: theme.textPrimary }]}>
              {srv.title}
            </Text>
            <Text style={[styles.serviceDesc, { color: theme.textMuted }]}>
              {srv.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 4. AGENDA & CHECKLIST KERJA HARI INI */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
          AGENDA & WORK JOURNAL HARI INI
        </Text>
        <TouchableOpacity onPress={() => setShowJournalModal(true)}>
          <Text style={[styles.seeAllLink, { color: theme.primary }]}>
            + Tambah Tugas
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.agendaCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {tasks.map((task, index) => (
          <View key={task.id}>
            <TouchableOpacity
              style={styles.taskRow}
              onPress={() => toggleTask(task.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={task.done ? 'checkbox' : 'square-outline'}
                size={22}
                color={task.done ? '#10B981' : theme.textMuted}
              />
              <View style={styles.taskTextWrap}>
                <Text
                  style={[
                    styles.taskTitleText,
                    {
                      color: task.done ? theme.textMuted : theme.textPrimary,
                      textDecorationLine: task.done ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {task.title}
                </Text>
                <View style={styles.taskMetaRow}>
                  <View style={[styles.tagPill, { backgroundColor: theme.surfaceMuted }]}>
                    <Text style={[styles.tagPillText, { color: theme.textSecondary }]}>
                      {task.tag}
                    </Text>
                  </View>
                  <Text style={[styles.priorityText, { color: task.priority === 'Tinggi' ? '#EF4444' : theme.textMuted }]}>
                    Prioritas: {task.priority}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            {index < tasks.length - 1 && (
              <View style={[styles.taskDivider, { backgroundColor: theme.border }]} />
            )}
          </View>
        ))}
      </View>

      {/* MODAL: WORK JOURNAL */}
      <Modal
        visible={showJournalModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowJournalModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalSheetHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="reader" size={20} color="#1C2E5A" />
                <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                  Work Journal Staf TU
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeIconWrap, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setShowJournalModal(false)}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescText, { color: theme.textSecondary }]}>
              Catat progres tugas harian, input data kesiswaan, atau arsip surat masuk untuk verifikasi pimpinan.
            </Text>

            <AppButton
              title="Simpan Jurnal Kerja"
              icon="checkmark-outline"
              onPress={() => {
                setShowJournalModal(false);
                Alert.alert('Sukses', 'Work Journal harian Anda berhasil disimpan.');
              }}
              style={{ marginTop: 12, marginBottom: 20 }}
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
    paddingHorizontal: 1,
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
    gap: 6,
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
    marginBottom: 10,
    textTransform: 'uppercase',
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
  agendaCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
  },
  taskTextWrap: {
    flex: 1,
  },
  taskTitleText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
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
});

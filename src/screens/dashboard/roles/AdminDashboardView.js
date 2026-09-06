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
import { dashboardApi } from '../../../api/dashboardApi';
import AppButton from '../../../components/common/AppButton';

export default function AdminDashboardView({
  onNavigateToCourseList,
  onNavigateToCanteen,
  onNavigateToWallet,
  onNavigateToProfile,
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

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await dashboardApi.getSummary();
        if (res?.success && res.data) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.log('Error loading admin summary:', err);
      }
    }
    load();
  }, []);

  const stats = dashboardData?.stats || {};

  const adminStats = [
    {
      label: 'TOTAL SISWA',
      value: String(stats.studentsCount ?? '1.120'),
      sub: 'Terdaftar Aktif',
      icon: 'people',
      color: '#4F46E5',
      lightTint: 'rgba(79, 70, 229, 0.07)',
      borderColor: 'rgba(79, 70, 229, 0.25)',
    },
    {
      label: 'GURU & STAF',
      value: String((stats.teachersCount || 0) + (stats.staffCount || 0) || '68'),
      sub: 'Pengajar & Tendik',
      icon: 'school',
      color: '#10B981',
      lightTint: 'rgba(16, 185, 129, 0.07)',
      borderColor: 'rgba(16, 185, 129, 0.25)',
    },
    {
      label: 'KURSUS & MODUL',
      value: String(stats.coursesCount ?? '4'),
      sub: 'Materi KBM Aktif',
      icon: 'library',
      color: '#F59E0B',
      lightTint: 'rgba(245, 158, 11, 0.07)',
      borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    {
      label: 'TOTAL PENGGUNA',
      value: String(stats.totalUsers ?? '1.188'),
      sub: 'Akun Terdaftar',
      icon: 'shield-checkmark',
      color: '#8B5CF6',
      lightTint: 'rgba(139, 92, 246, 0.07)',
      borderColor: 'rgba(139, 92, 246, 0.25)',
    },
  ];

  const quickControls = [
    {
      id: 'ctrl_1',
      title: 'Katalog Kursus & Materi',
      desc: 'Semua modul pembelajaran',
      icon: 'book-outline',
      color: '#4F46E5',
      action: onNavigateToCourseList,
    },
    {
      id: 'ctrl_2',
      title: 'Kantin Sekolah',
      desc: 'Pemesanan & menu kantin',
      icon: 'fast-food-outline',
      color: '#10B981',
      action: onNavigateToCanteen,
    },
    {
      id: 'ctrl_3',
      title: 'Keuangan & Saldo',
      desc: 'Rekap dompet digital',
      icon: 'wallet-outline',
      color: '#F59E0B',
      action: onNavigateToWallet,
    },
    {
      id: 'ctrl_4',
      title: 'Broadcast Pengumuman',
      desc: 'Kirim notif ke seluruh user',
      icon: 'megaphone-outline',
      color: '#8B5CF6',
      action: () => setShowBroadcastModal(true),
    },
  ];

  const recentAuditLogs = [
    { id: 'log_1', text: 'Top-up saldo siswa via QRIS Midtrans (Rp 50.000)', time: '09:42 WIB', tag: 'Kantin' },
    { id: 'log_2', text: 'Guru Bpk. Hendra menginput ledger nilai XII MIPA 2', time: '09:15 WIB', tag: 'Akademik' },
    { id: 'log_3', text: 'Pencetakan smart card siswa baru (NISN 0087429110)', time: '08:50 WIB', tag: 'TU' },
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
            {/* SLIDE 1: HERO ADMIN BANNER */}
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
                  colors={['#0B3592', '#1C2E5A']}
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
                          <View style={styles.pulseDotGreen} />
                          <Text style={styles.roleChipHeroText}>SIKAD COMMAND CENTER</Text>
                        </View>
                        <Text style={styles.heroGreeting}>Administrator Sistem</Text>
                        <Text style={styles.heroSub}>
                          Jadwal Master Aktif: Semester Genap • Status Server Normal
                        </Text>
                      </View>

                      {onNavigateToProfile && (
                        <TouchableOpacity
                          style={styles.heroAvatarWrap}
                          onPress={onNavigateToProfile}
                          activeOpacity={0.8}
                        >
                          <View style={styles.heroAvatar}>
                            <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Quick Action Buttons */}
                    <View style={styles.heroButtonsRow}>
                      <TouchableOpacity
                        style={styles.heroWhiteBtn}
                        onPress={() => setShowBroadcastModal(true)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="megaphone" size={15} color="#0B3592" />
                        <Text style={styles.heroWhiteBtnText}>Kirim Broadcast</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.heroOutlineBtn}
                        onPress={() => setShowAuditModal(true)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="shield-outline" size={15} color="#FFFFFF" />
                        <Text style={styles.heroOutlineBtnText}>Audit Trail</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>

            {/* SLIDE 2: EXECUTIVE METRICS GRID */}
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
                {adminStats.map((item, idx) => (
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

      {/* 3. CORE MANAGEMENT CONTROLS */}
      <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
        KONTROL ADMINISTRASI UTAMA
      </Text>

      <View style={styles.controlsGrid}>
        {quickControls.map((ctrl) => (
          <TouchableOpacity
            key={ctrl.id}
            style={[
              styles.controlCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => {
              if (ctrl.action) {
                ctrl.action();
              } else {
                Alert.alert(ctrl.title, `Membuka modul ${ctrl.title} untuk pengelolaan database sekolah.`);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.controlIconWrap, { backgroundColor: theme.surfaceMuted }]}>
              <Ionicons name={ctrl.icon} size={22} color={ctrl.color} />
            </View>
            <Text style={[styles.controlTitle, { color: theme.textPrimary }]}>
              {ctrl.title}
            </Text>
            <Text style={[styles.controlDesc, { color: theme.textMuted }]}>
              {ctrl.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 4. SERVER HEALTH & SECURITY */}
      <View
        style={[
          styles.healthCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.healthTopRow}>
          <View style={styles.healthStatusTag}>
            <View style={styles.pulseDotGreen} />
            <Text style={[styles.healthStatusText, { color: '#10B981' }]}>
              SISTEM NORMAL & AMAN
            </Text>
          </View>
          <Text style={[styles.healthVersion, { color: theme.textMuted }]}>
            Uptime 99.98%
          </Text>
        </View>

        <Text style={[styles.healthDesc, { color: theme.textSecondary }]}>
          Cluster Server Cloud PedaGogi AI terenkripsi TLS 1.3. Backup data harian terjadwal otomatis setiap pukul 03:00 WIB.
        </Text>

        <View style={styles.healthMetricsRow}>
          <View style={[styles.healthMetricPill, { backgroundColor: theme.surfaceMuted }]}>
            <Text style={[styles.healthMetricText, { color: theme.textPrimary }]}>
              CPU: 18%
            </Text>
          </View>
          <View style={[styles.healthMetricPill, { backgroundColor: theme.surfaceMuted }]}>
            <Text style={[styles.healthMetricText, { color: theme.textPrimary }]}>
              Memory: 2.4 GB / 8 GB
            </Text>
          </View>
          <View style={[styles.healthMetricPill, { backgroundColor: theme.surfaceMuted }]}>
            <Text style={[styles.healthMetricText, { color: theme.textPrimary }]}>
              Database: Sinkron
            </Text>
          </View>
        </View>
      </View>

      {/* 5. RECENT AUDIT LOGS */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
          LOG AKTIVITAS TERAKHIR
        </Text>
        <TouchableOpacity onPress={() => setShowAuditModal(true)}>
          <Text style={[styles.seeAllLink, { color: theme.primary }]}>
            Semua Log →
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.logsCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {recentAuditLogs.map((log, idx) => (
          <View key={log.id}>
            <View style={styles.logRow}>
              <View style={[styles.logIconBox, { backgroundColor: theme.surfaceMuted }]}>
                <Ionicons name="time-outline" size={15} color={theme.textSecondary} />
              </View>
              <View style={styles.logTextCol}>
                <Text style={[styles.logText, { color: theme.textPrimary }]} numberOfLines={2}>
                  {log.text}
                </Text>
                <View style={styles.logMetaRow}>
                  <Text style={[styles.logTime, { color: theme.textMuted }]}>{log.time}</Text>
                  <View style={[styles.logTag, { backgroundColor: theme.surfaceMuted }]}>
                    <Text style={[styles.logTagText, { color: theme.textPrimary }]}>{log.tag}</Text>
                  </View>
                </View>
              </View>
            </View>
            {idx < recentAuditLogs.length - 1 && (
              <View style={[styles.logDivider, { backgroundColor: theme.border }]} />
            )}
          </View>
        ))}
      </View>

      {/* MODAL: BROADCAST */}
      <Modal
        visible={showBroadcastModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBroadcastModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalSheetHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="megaphone" size={20} color="#0B3592" />
                <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                  Broadcast Pengumuman
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeIconWrap, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setShowBroadcastModal(false)}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescText, { color: theme.textSecondary }]}>
              Kirim pengumuman massal yang akan muncul di perangkat seluruh siswa, guru, dan staf sekolah.
            </Text>

            <AppButton
              title="Kirim Notifikasi Sekolah"
              icon="send-outline"
              onPress={() => {
                setShowBroadcastModal(false);
                Alert.alert('Sukses', 'Pengumuman sekolah berhasil disiarkan ke 1.188 pengguna aktif.');
              }}
              style={{ marginTop: 12, marginBottom: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL: AUDIT TRAIL */}
      <Modal
        visible={showAuditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAuditModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalSheetHeader}>
              <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                Audit Trail & Log Sistem
              </Text>
              <TouchableOpacity
                style={[styles.closeIconWrap, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setShowAuditModal(false)}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescText, { color: theme.textSecondary }]}>
              Seluruh operasi database, otentikasi login, dan transaksi Midtrans tercatat otomatis dalam log terenkripsi.
            </Text>

            <AppButton
              title="Tutup Log"
              variant="outline"
              onPress={() => setShowAuditModal(false)}
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
    shadowColor: '#0B3592',
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
  pulseDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
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
    color: '#0B3592',
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
  controlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  controlCard: {
    width: '48.3%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  controlIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  controlTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  controlDesc: {
    fontSize: 11,
    fontWeight: '500',
  },
  healthCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  healthTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  healthStatusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  healthVersion: {
    fontSize: 11,
    fontWeight: '600',
  },
  healthDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  healthMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  healthMetricPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  healthMetricText: {
    fontSize: 11,
    fontWeight: '600',
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
  logsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  logIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  logTextCol: {
    flex: 1,
  },
  logText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 4,
  },
  logMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  logTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  logTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  logDivider: {
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

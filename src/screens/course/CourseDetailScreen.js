import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Animated, Platform, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { courseApi } from '../../api/courseApi';
import { CourseDetailSkeleton } from '../../components/common/SkeletonLoader';

const SCREEN_WIDTH = Dimensions.get('window').width;

const LEVEL_META = {
  beginner:     { label: 'Pemula',   bg: '#D1FAE5', color: '#065F46' },
  intermediate: { label: 'Menengah', bg: '#FEF3C7', color: '#92400E' },
  advanced:     { label: 'Mahir',    bg: '#EDE9FE', color: '#6B21A8' },
};

// ─── ChapterAccordion ─────────────────────────────────────────────────────────
function ChapterAccordion({ chapter, theme, isDark, onSubChapterPress, activeSubChapter }) {
  const [isOpen, setIsOpen] = useState(chapter.id <= 2);
  const rotateAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  const toggle = () => {
    const toValue = isOpen ? 0 : 1;
    Animated.spring(rotateAnim, { toValue, useNativeDriver: true, speed: 20, bounciness: 0 }).start();
    setIsOpen(!isOpen);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const subChapters = chapter.subChapters || [];
  const completedCount = subChapters.filter((s) => s.isCompleted).length;
  const chapterPct = subChapters.length > 0 ? Math.round((completedCount / subChapters.length) * 100) : 0;

  return (
    <View style={[
      styles.chapterWrap,
      { borderColor: isDark ? theme.border : '#E2E8F0', backgroundColor: isDark ? theme.surface : '#FFFFFF' },
    ]}>
      {/* Chapter Header */}
      <TouchableOpacity style={styles.chapterHeader} onPress={toggle} activeOpacity={0.8}>
        <View style={[styles.chapterIcon, { backgroundColor: isDark ? theme.surfaceMuted : '#EEF2FF' }]}>
          <Ionicons name="book-outline" size={14} color={theme.primary} />
        </View>
        <View style={styles.chapterTitleWrap}>
          <Text style={[styles.chapterTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {chapter.title}
          </Text>
          <View style={styles.chapterMetaRow}>
            <Text style={[styles.chapterMeta, { color: theme.textMuted }]}>
              {completedCount}/{subChapters.length} selesai
            </Text>
            {chapterPct > 0 && (
              <View style={[styles.chapterProgressPill, { backgroundColor: isDark ? theme.border : '#E8EDF4' }]}>
                <View style={[styles.chapterProgressFill, { width: `${chapterPct}%`, backgroundColor: theme.primary }]} />
              </View>
            )}
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {/* Sub Chapter List */}
      {isOpen && (
        <View style={[styles.subList, { borderTopColor: isDark ? theme.border : '#F1F5F9' }]}>
          {subChapters.map((sub, idx) => {
            const isActive = activeSubChapter === sub.id;
            const isLast = idx === subChapters.length - 1;

            let statusIcon = 'ellipse-outline';
            let statusColor = isDark ? '#334155' : '#CBD5E1';
            if (sub.isLocked)                          { statusIcon = 'lock-closed';             statusColor = isDark ? '#475569' : '#94A3B8'; }
            else if (sub.isCompleted && sub.quizPassed){ statusIcon = 'checkmark-circle';         statusColor = '#10B981'; }
            else if (sub.isCompleted)                  { statusIcon = 'checkmark-circle-outline'; statusColor = '#10B981'; }
            else if (isActive)                         { statusIcon = 'radio-button-on';          statusColor = theme.primary; }

            return (
              <TouchableOpacity
                key={sub.id}
                style={[
                  styles.subItem,
                  isActive && { backgroundColor: isDark ? theme.surfaceHighlight : '#EEF2FF' },
                  sub.isLocked && { opacity: 0.7, backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : '#FAFCFF' },
                  !isLast && { borderBottomWidth: 1, borderBottomColor: isDark ? theme.border : '#F8FAFC' },
                ]}
                onPress={() => {
                  if (sub.isLocked) {
                    Alert.alert(
                      'Materi Terkunci',
                      `Sub-bab "${sub.title}" masih terkunci.\n\nSelesaikan pembelajaran dan kuis pada materi sebelumnya terlebih dahulu untuk membuka kunci materi ini.`,
                      [{ text: 'Mengerti', style: 'default' }]
                    );
                    return;
                  }
                  onSubChapterPress(sub);
                }}
                activeOpacity={0.75}
              >
                {isActive && <View style={[styles.activeBar, { backgroundColor: theme.primary }]} />}

                <Ionicons name={statusIcon} size={16} color={statusColor} style={styles.subIconView} />

                <View style={styles.subBody}>
                  <Text
                    style={[
                      styles.subTitle,
                      { color: isActive ? theme.primary : (sub.isLocked ? theme.textMuted : theme.textPrimary) },
                      isActive && { fontWeight: '800' },
                    ]}
                    numberOfLines={2}
                  >
                    {sub.title}
                  </Text>
                  <View style={styles.subMetaRow}>
                    <Ionicons name="time-outline" size={10} color={theme.textMuted} />
                    <Text style={[styles.subDuration, { color: theme.textMuted }]}>{sub.duration} mnt</Text>
                    {sub.isLocked ? (
                      <View style={[styles.lockedPill, { backgroundColor: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9' }]}>
                        <Ionicons name="lock-closed" size={9} color={theme.textMuted} />
                        <Text style={[styles.lockedPillText, { color: theme.textMuted }]}>Terkunci</Text>
                      </View>
                    ) : sub.quizPassed ? (
                      <>
                        <View style={[styles.subMetaDot, { backgroundColor: theme.textMuted }]} />
                        <Ionicons name="clipboard" size={10} color="#10B981" />
                        <Text style={styles.subQuizText}>Quiz Lulus</Text>
                      </>
                    ) : null}
                  </View>
                </View>

                {sub.isLocked ? (
                  <Ionicons name="lock-closed-outline" size={14} color={isDark ? '#475569' : '#94A3B8'} />
                ) : (
                  <Ionicons name="chevron-forward" size={14} color={isActive ? theme.primary : (isDark ? '#475569' : '#CBD5E1')} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function CourseDetailScreen({ course: propCourse, onBack, onStartLesson }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [course, setCourse] = useState(propCourse || null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [activeSubChapter, setActiveSubChapter] = useState(null);

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const dynamicHeroPaddingTop = safeTop + 14;
  const dynamicCtaPaddingBottom = Math.max(insets.bottom, 16) + 12;

  const fetchDetail = useCallback(async (courseId) => {
    if (!courseId) return;
    setIsLoadingDetail(true);
    try {
      const res = await courseApi.getCourseDetail(courseId);
      if (res && res.success && res.data) {
        setCourse(res.data);
      }
    } catch (err) {
      console.log('Error fetching course detail from API:', err?.message || err);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (propCourse?.id) {
      fetchDetail(propCourse.id);
    }
  }, [propCourse?.id, fetchDetail]);

  const handleEnroll = async () => {
    if (isEnrolling || !course?.id) return;
    setIsEnrolling(true);
    try {
      const res = await courseApi.enrollCourse(course.id);
      if (res && res.success) {
        Alert.alert('Selamat!', res.message || 'Anda berhasil terdaftar di kursus ini. Selamat belajar!');
        setCourse((prev) => ({
          ...prev,
          isEnrolled: true,
        }));
        // Re-fetch detail to refresh unlocked chapters
        fetchDetail(course.id);
      } else {
        Alert.alert('Info', res?.message || 'Tidak dapat memproses pendaftaran.');
      }
    } catch (err) {
      Alert.alert('Pemberitahuan', err?.message || 'Gagal mendaftar kursus.');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoadingDetail && (!course || !course.chapters || course.chapters.length === 0)) {
    return (
      <CourseDetailSkeleton
        isDark={isDark}
        dynamicHeroPaddingTop={dynamicHeroPaddingTop}
      />
    );
  }

  if (!course) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const levelMeta = LEVEL_META[course.level] || LEVEL_META.beginner;
  const allSubs = course.chapters?.flatMap((ch) => ch.subChapters || []) || [];
  const totalSubChapters = allSubs.length;
  const completedCount = allSubs.filter((s) => s.isCompleted).length;
  const totalDuration = allSubs.reduce((a, s) => a + (s.duration || 0), 0);
  const progressPct = totalSubChapters > 0 ? Math.round((completedCount / totalSubChapters) * 100) : (course.progress || 0);
  const firstUnlocked = allSubs.find((s) => !s.isLocked && !s.isCompleted) || allSubs.find((s) => !s.isLocked) || allSubs[0];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: dynamicCtaPaddingBottom + 70 }]}
      >
        {/* ── Hero Banner ── */}
        <LinearGradient
          colors={course.gradientColors || ['#1C2E5A', '#2B3B8B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBanner, { paddingTop: dynamicHeroPaddingTop }]}
        >
          {/* Decorative circles */}
          <View style={styles.heroBg1} />
          <View style={styles.heroBg2} />
          <View style={styles.heroBg3} />

          {/* Back Button — inside hero */}
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Badges */}
          <View style={styles.heroBadgeRow}>
            <View style={[styles.heroBadge, { backgroundColor: levelMeta.bg }]}>
              <Text style={[styles.heroBadgeText, { color: levelMeta.color }]}>{levelMeta.label}</Text>
            </View>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={[styles.heroBadgeText, { color: '#FFF' }]}>{course.category}</Text>
            </View>
            {course.isFree && (
              <View style={[styles.heroBadge, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.heroBadgeText, { color: '#065F46' }]}>Gratis</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>{course.title}</Text>

          {/* Teacher + Meta row */}
          <View style={styles.heroMetaRow}>
            <View style={[styles.heroAvatar, { backgroundColor: `${course.teacherColor}33`, borderColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={styles.heroAvatarText}>{course.teacherInitials}</Text>
            </View>
            <Text style={styles.heroTeacherName} numberOfLines={1}>{course.teacherName}</Text>
            <View style={styles.heroDivider} />
            <Ionicons name="people" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroMetaText}>{course.studentsCount} siswa</Text>
            <View style={styles.heroDivider} />
            <Ionicons name="layers" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroMetaText}>{course.chaptersCount} bab</Text>
          </View>
        </LinearGradient>

        {/* ── Progress + Stats Card ── */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E8EDF4' }]}>
          {course.isEnrolled && (
            <View style={styles.progressBlock}>
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Progress Belajar</Text>
                <Text style={[styles.progressPct, { color: course.accentColor || theme.primary }]}>{progressPct}%</Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: isDark ? theme.border : '#E8EDF4' }]}>
                <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: course.accentColor || theme.primary }]} />
              </View>
              <Text style={[styles.progressSub, { color: theme.textMuted }]}>
                {completedCount} dari {totalSubChapters} materi selesai
              </Text>
            </View>
          )}

          <View style={styles.statsGrid}>
            {[
              { icon: 'layers-outline',        label: 'Bab',    value: String(course.chaptersCount) },
              { icon: 'document-text-outline', label: 'Materi', value: String(totalSubChapters) },
              { icon: 'time-outline',          label: 'Durasi', value: `${Math.round(totalDuration / 60)}j` },
              { icon: 'people-outline',        label: 'Siswa',  value: String(course.studentsCount) },
            ].map((item) => (
              <View
                key={item.label}
                style={[styles.statBox, { backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC', borderColor: isDark ? theme.border : '#EEF2FF' }]}
              >
                <View style={[styles.statIconWrap, { backgroundColor: isDark ? theme.surfaceHighlight : '#EEF2FF' }]}>
                  <Ionicons name={item.icon} size={16} color={theme.primary} />
                </View>
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>{item.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Description Card ── */}
        {course.description && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E8EDF4' }]}>
            <View style={styles.sectionLabelRow}>
              <View style={[styles.sectionDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Tentang Kursus</Text>
            </View>
            <Text style={[styles.descText, { color: theme.textSecondary }]}>{course.description}</Text>
          </View>
        )}

        {/* ── Chapter Tree ── */}
        <View style={styles.treeSection}>
          <View style={styles.treeLabelRow}>
            <View style={[styles.sectionDot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Daftar Materi</Text>
            <View style={[styles.treeCountBadge, { backgroundColor: isDark ? theme.surfaceMuted : '#EEF2FF' }]}>
              <Text style={[styles.treeCountText, { color: theme.primary }]}>{course.chapters?.length || 0} bab</Text>
            </View>
          </View>

          {isLoadingDetail && (!course.chapters || course.chapters.length === 0) ? (
            <View style={[styles.loadingBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textMuted }]}>Memuat silabus materi...</Text>
            </View>
          ) : (
            course.chapters?.map((ch) => (
              <ChapterAccordion
                key={ch.id}
                chapter={ch}
                theme={theme}
                isDark={isDark}
                activeSubChapter={activeSubChapter}
                onSubChapterPress={(sub) => {
                  setActiveSubChapter(sub.id);
                  onStartLesson && onStartLesson(course, sub);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Sticky CTA Bar ── */}
      <View style={[styles.ctaBar, { backgroundColor: theme.surface, borderTopColor: isDark ? theme.border : '#E8EDF4', paddingBottom: dynamicCtaPaddingBottom }]}>
        {course.isEnrolled ? (
          <TouchableOpacity
            style={styles.ctaPrimary}
            onPress={() => onStartLesson && onStartLesson(course, firstUnlocked)}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={course.gradientColors || ['#1C2E5A', '#2B3B8B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGrad}
            >
              <Ionicons name="play-circle" size={22} color="#FFF" />
              <Text style={styles.ctaText}>{progressPct > 0 ? 'Lanjutkan Belajar' : 'Mulai Belajar'}</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.65)" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ctaSecondary, isEnrolling && { opacity: 0.7 }]}
            onPress={handleEnroll}
            disabled={isEnrolling}
            activeOpacity={0.88}
          >
            {isEnrolling ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="school-outline" size={18} color="#FFF" />
                <Text style={styles.ctaText}>Ikuti Kursus Ini</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 110 },

  // ── Hero ──
  heroBanner: {
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  heroBg1: { position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.07)' },
  heroBg2: { position: 'absolute', left: -20, bottom: -20, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroBg3: { position: 'absolute', right: 50, top: 50, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.04)' },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  heroBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  heroBadgeText: { fontSize: 10, fontWeight: '800' },
  heroTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 18,
    lineHeight: 29,
    letterSpacing: -0.3,
  },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  heroAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  heroAvatarText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  heroTeacherName: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)', flexShrink: 1 },
  heroDivider: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.4)' },
  heroMetaText: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  // ── Card (shared) ──
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Progress ──
  progressBlock: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { fontSize: 12, fontWeight: '700' },
  progressPct: { fontSize: 14, fontWeight: '900' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 8, borderRadius: 4 },
  progressSub: { fontSize: 11, fontWeight: '500' },

  // ── Stats Grid ──
  statsGrid: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1, gap: 6 },
  statIconWrap: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 15, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '500' },

  // ── Section Labels ──
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  sectionLabel: { fontSize: 14, fontWeight: '800' },
  descText: { fontSize: 13, lineHeight: 22, fontWeight: '400' },

  // ── Chapter Tree ──
  treeSection: { paddingHorizontal: 16, marginTop: 14, paddingBottom: 4, gap: 8 },
  treeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  treeCountBadge: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  treeCountText: { fontSize: 11, fontWeight: '800' },
  loadingBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Chapter Accordion ──
  chapterWrap: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  chapterIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chapterTitleWrap: { flex: 1 },
  chapterTitle: { fontSize: 13, fontWeight: '800', marginBottom: 5 },
  chapterMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chapterMeta: { fontSize: 10, fontWeight: '500' },
  chapterProgressPill: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden', maxWidth: 56 },
  chapterProgressFill: { height: 4, borderRadius: 2 },

  // ── Sub Chapters ──
  subList: { borderTopWidth: 1 },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    position: 'relative',
    gap: 12,
  },
  activeBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  subIconView: { flexShrink: 0 },
  subBody: { flex: 1 },
  subTitle: { fontSize: 12, fontWeight: '600', lineHeight: 18, marginBottom: 5 },
  subMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subDuration: { fontSize: 10, fontWeight: '500' },
  subMetaDot: { width: 2, height: 2, borderRadius: 1 },
  subQuizText: { fontSize: 9, fontWeight: '700', color: '#10B981' },
  lockedPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6, marginLeft: 2 },
  lockedPillText: { fontSize: 9, fontWeight: '700' },

  // ── Sticky CTA ──
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  ctaPrimary: { borderRadius: 18, overflow: 'hidden' },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  ctaSecondary: {
    backgroundColor: '#1C2E5A',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  ctaText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});

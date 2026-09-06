import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Dimensions, Animated, Platform, StatusBar,
  RefreshControl, ActivityIndicator, Image, Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { courseApi } from '../../api/courseApi';

import { CourseCardSkeleton } from '../../components/common/SkeletonLoader';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2;

const LEVEL_OPTIONS = [
  { id: 'all', label: 'Semua Tingkat' },
  { id: 'beginner', label: 'Pemula' },
  { id: 'intermediate', label: 'Menengah' },
  { id: 'advanced', label: 'Mahir' },
];

const STATUS_OPTIONS = [
  { id: 'all', label: 'Semua Status' },
  { id: 'enrolled', label: 'Terdaftar' },
  { id: 'not_enrolled', label: 'Belum Terdaftar' },
];

const SORT_OPTIONS = [
  { id: 'latest', label: 'Terbaru' },
  { id: 'popular', label: 'Terpopuler' },
  { id: 'chapters', label: 'Bab Terbanyak' },
  { id: 'name', label: 'Nama (A - Z)' },
];

const LEVEL_META = {
  beginner: { label: 'Pemula', bg: 'rgba(209,250,229,0.95)', color: '#065F46' },
  intermediate: { label: 'Menengah', bg: 'rgba(254,243,199,0.95)', color: '#92400E' },
  advanced: { label: 'Mahir', bg: 'rgba(237,233,254,0.95)', color: '#6B21A8' },
};

function CourseCard({ course, onPress, onEdit, theme, isDark, isGuru }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const levelMeta = LEVEL_META[course.level] || LEVEL_META.beginner;
  const canEdit = isGuru && (course.isMine || course.user_id === undefined || course.is_creator);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.965, useNativeDriver: true, speed: 30, bounciness: 0 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 5 }).start();

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={() => onPress(course)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E8EDF4' }]}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnailWrap}>
          <LinearGradient colors={course.gradientColors || ['#1C2E5A', '#2D4B8E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.thumbnailGrad}>
            <View style={styles.thumbBg1} />
            <View style={styles.thumbBg2} />
            <View style={styles.thumbIcon}>
              <Ionicons name="library" size={44} color="rgba(255,255,255,0.15)" />
            </View>
            <View style={styles.thumbTopRow}>
              <View style={[styles.levelBadge, { backgroundColor: levelMeta.bg }]}>
                <Text style={[styles.levelBadgeText, { color: levelMeta.color }]}>{levelMeta.label}</Text>
              </View>
              {course.status && (
                <View style={[styles.statusBadge, { backgroundColor: course.status === 'published' ? 'rgba(209,250,229,0.95)' : 'rgba(254,243,199,0.95)' }]}>
                  <Text style={[styles.statusBadgeText, { color: course.status === 'published' ? '#065F46' : '#92400E' }]}>
                    {course.status === 'published' ? 'Aktif' : 'Draft'}
                  </Text>
                </View>
              )}
            </View>
            {course.isEnrolled && course.progress > 0 && (
              <View style={styles.thumbProgressRow}>
                <View style={styles.thumbProgressTrack}>
                  <View style={[styles.thumbProgressFill, { width: `${course.progress}%`, backgroundColor: course.accentColor || '#4F46E5' }]} />
                </View>
                <Text style={styles.thumbProgressText}>{course.progress}%</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <View style={styles.categoryRow}>
            <View style={[styles.categoryChip, { backgroundColor: `${course.accentColor || '#4F46E5'}18` }]}>
              <Text style={[styles.categoryChipText, { color: course.accentColor || '#4F46E5' }]}>{course.category || 'Umum'}</Text>
            </View>
            <View style={styles.miniStat}>
              <Ionicons name="people" size={10} color={theme.textMuted} />
              <Text style={[styles.miniStatText, { color: theme.textMuted }]}>{course.studentsCount || 0}</Text>
            </View>
          </View>

          <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={2}>{course.title}</Text>
          <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={3}>{course.description || 'Tidak ada deskripsi kursus.'}</Text>

          {/* Spacer */}
          <View style={styles.cardSpacer} />

          <View style={[styles.teacherRow, { borderTopColor: isDark ? theme.border : '#F1F5F9' }]}>
            <View style={[styles.teacherAv, { backgroundColor: `${course.teacherColor || '#4F46E5'}22`, borderColor: `${course.teacherColor || '#4F46E5'}44` }]}>
              <Text style={[styles.teacherAvText, { color: course.teacherColor || '#4F46E5' }]}>{course.teacherInitials || 'GR'}</Text>
            </View>
            <Text style={[styles.teacherName, { color: theme.textMuted }]} numberOfLines={1}>{course.teacherName || 'Pengajar'}</Text>
          </View>

          <View style={[styles.statsRow, { borderTopColor: isDark ? theme.border : '#F1F5F9' }]}>
            <View style={styles.statItem}>
              <Ionicons name="layers-outline" size={11} color={theme.textMuted} />
              <Text style={[styles.statText, { color: theme.textMuted }]}>{course.chaptersCount || 0} Bab</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={11} color={theme.textMuted} />
              <Text style={[styles.statText, { color: theme.textMuted }]}>{(course.chaptersCount || 1) * 45}m</Text>
            </View>
          </View>

          {canEdit ? (
            <View style={styles.guruActionRow}>
              <TouchableOpacity
                style={[styles.cta, styles.ctaEdit, { backgroundColor: isDark ? 'rgba(79,70,229,0.2)' : '#EEF2FF', borderColor: theme.primary }]}
                onPress={() => onEdit && onEdit(course)}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={13} color={theme.primary} />
                <Text style={[styles.ctaEditText, { color: theme.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cta, styles.ctaDetail, { backgroundColor: '#1C2E5A' }]}
                onPress={() => onPress(course)}
                activeOpacity={0.85}
              >
                <Ionicons name="eye-outline" size={13} color="#FFFFFF" />
                <Text style={styles.ctaPrimaryText}>Buka</Text>
              </TouchableOpacity>
            </View>
          ) : course.isEnrolled ? (
            <TouchableOpacity style={[styles.cta, styles.ctaPrimary]} onPress={() => onPress(course)} activeOpacity={0.85}>
              <Ionicons name="play-circle" size={14} color="#FFFFFF" />
              <Text style={styles.ctaPrimaryText}>{course.progress > 0 ? 'Lanjutkan' : 'Mulai'}</Text>
              <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.cta, styles.ctaOutline, { borderColor: theme.border, backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC' }]}
              onPress={() => onPress(course)}
              activeOpacity={0.85}
            >
              <Ionicons name="lock-closed-outline" size={12} color={theme.textSecondary} />
              <Text style={[styles.ctaOutlineText, { color: theme.textSecondary }]}>Minta Akses</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CourseListScreen({ onNavigateToCourseDetail, onBack }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const isGuru = user?.role === 'guru';

  // Teacher scope: defaults to 'mine' for guru
  const [teacherScope, setTeacherScope] = useState(isGuru ? 'mine' : 'all');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLevel, setActiveLevel] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  // Modal Filter state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [tempCategory, setTempCategory] = useState('all');
  const [tempLevel, setTempLevel] = useState('all');
  const [tempStatus, setTempStatus] = useState('all');
  const [tempSortBy, setTempSortBy] = useState('latest');

  // Edit Course Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLevel, setEditLevel] = useState('beginner');
  const [editStatus, setEditStatus] = useState('published');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  // Data state
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const dynamicTop = safeTop + 10;
  const dynamicBottom = Math.max(insets.bottom || 0, 14) + 86;

  const loadCourses = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsLoading(true);
    setApiError(null);
    try {
      let response;
      if (isGuru && teacherScope === 'mine') {
        response = await courseApi.getMyCourses();
      } else {
        response = await courseApi.getCourses();
      }
      if (response && response.success && Array.isArray(response.data)) {
        setCourses(response.data);
      }
    } catch (err) {
      console.log('CourseApi error:', err?.message || err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isGuru, teacherScope]);

  useEffect(() => {
    loadCourses(true);
  }, [loadCourses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCourses(false);
  }, [loadCourses]);

  // Extract dynamic categories from courses
  const categories = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ['all', ...Array.from(set)];
  }, [courses]);

  // Filter & sort courses
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return courses
      .filter((c) => {
        const matchSearch =
          !q ||
          (c.title || '').toLowerCase().includes(q) ||
          (c.category || '').toLowerCase().includes(q) ||
          (c.teacherName || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q);

        const matchCategory =
          activeCategory === 'all' ||
          (c.category || '').toLowerCase() === activeCategory.toLowerCase();

        const matchLevel =
          activeLevel === 'all' ||
          (c.level || '').toLowerCase() === activeLevel.toLowerCase();

        let matchStatus = true;
        if (activeStatus === 'enrolled') {
          matchStatus = !!c.isEnrolled;
        } else if (activeStatus === 'not_enrolled') {
          matchStatus = !c.isEnrolled;
        }

        return matchSearch && matchCategory && matchLevel && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') return (b.studentsCount || 0) - (a.studentsCount || 0);
        if (sortBy === 'chapters') return (b.chaptersCount || 0) - (a.chaptersCount || 0);
        if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
        return (b.id || 0) - (a.id || 0); // latest
      });
  }, [courses, searchQuery, activeCategory, activeLevel, activeStatus, sortBy]);

  // Count active non-default filters
  const activeFilterCount =
    (activeCategory !== 'all' ? 1 : 0) +
    (activeLevel !== 'all' ? 1 : 0) +
    (activeStatus !== 'all' ? 1 : 0) +
    (sortBy !== 'latest' ? 1 : 0);

  // Modal open & close handlers
  const openFilterModal = () => {
    setTempCategory(activeCategory);
    setTempLevel(activeLevel);
    setTempStatus(activeStatus);
    setTempSortBy(sortBy);
    setFilterModalVisible(true);
  };

  const applyFilters = () => {
    setActiveCategory(tempCategory);
    setActiveLevel(tempLevel);
    setActiveStatus(tempStatus);
    setSortBy(tempSortBy);
    setFilterModalVisible(false);
  };

  const resetTempFilters = () => {
    setTempCategory('all');
    setTempLevel('all');
    setTempStatus('all');
    setTempSortBy('latest');
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setActiveLevel('all');
    setActiveStatus('all');
    setSortBy('latest');
    setTempCategory('all');
    setTempLevel('all');
    setTempStatus('all');
    setTempSortBy('latest');
  };

  const handleOpenEditModal = (course) => {
    setEditingCourse(course);
    setEditTitle(course.title || '');
    setEditCategory(course.category || '');
    setEditLevel(course.level || 'beginner');
    setEditStatus(course.status || 'published');
    setEditDescription(course.description || '');
    setEditModalVisible(true);
  };

  const handleSaveCourse = async () => {
    if (!editingCourse) return;
    if (!editTitle.trim()) {
      Alert.alert('Perhatian', 'Judul kursus wajib diisi.');
      return;
    }

    setIsSavingCourse(true);
    try {
      const payload = {
        title: editTitle.trim(),
        category: editCategory.trim() || 'Umum',
        level: editLevel,
        status: editStatus,
        description: editDescription.trim(),
      };
      const res = await courseApi.updateCourse(editingCourse.id, payload);
      if (res && res.success) {
        setCourses((prev) =>
          prev.map((c) => (c.id === editingCourse.id ? { ...c, ...res.data } : c))
        );
        setEditModalVisible(false);
        Alert.alert('Berhasil', 'Data kursus berhasil diperbarui.');
      } else {
        Alert.alert('Gagal', res?.message || 'Gagal memperbarui kursus.');
      }
    } catch (err) {
      Alert.alert('Kesalahan', err?.message || 'Terjadi kesalahan sistem saat menyimpan.');
    } finally {
      setIsSavingCourse(false);
    }
  };

  // Live match count inside modal
  const tempMatchedCount = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return courses.filter((c) => {
      const matchSearch =
        !q ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.teacherName || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q);

      const matchCat =
        tempCategory === 'all' ||
        (c.category || '').toLowerCase() === tempCategory.toLowerCase();

      const matchLvl =
        tempLevel === 'all' ||
        (c.level || '').toLowerCase() === tempLevel.toLowerCase();

      let matchStat = true;
      if (tempStatus === 'enrolled') {
        matchStat = !!c.isEnrolled;
      } else if (tempStatus === 'not_enrolled') {
        matchStat = !c.isEnrolled;
      }

      return matchSearch && matchCat && matchLvl && matchStat;
    }).length;
  }, [courses, searchQuery, tempCategory, tempLevel, tempStatus]);

  const enrolledCount = courses.filter((c) => c.isEnrolled).length;
  const inProgress = courses.filter((c) => c.isEnrolled && c.progress > 0);

  // Dynamic Section Title
  const sectionTitle = useMemo(() => {
    const parts = [];
    if (activeCategory !== 'all') parts.push(activeCategory);
    if (activeLevel !== 'all') parts.push(LEVEL_META[activeLevel]?.label || activeLevel);
    if (activeStatus === 'enrolled') parts.push('Terdaftar');
    if (activeStatus === 'not_enrolled') parts.push('Belum Terdaftar');
    if (parts.length === 0) return 'Semua Course';
    return parts.join(' · ');
  }, [activeCategory, activeLevel, activeStatus]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: dynamicBottom }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Header */}
        <View style={[styles.pageHeader, { paddingTop: dynamicTop }]}>
          <View style={styles.headerLeft}>
            {onBack && (
              <TouchableOpacity
                style={[styles.headerBackBtn, { backgroundColor: isDark ? theme.surfaceMuted : '#EEF2FF', borderColor: isDark ? theme.border : '#E2E8F0' }]}
                onPress={onBack}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            )}
            <View>
              <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Jelajahi Course</Text>
              <Text style={[styles.pageSub, { color: theme.textMuted }]}>
                {enrolledCount} terdaftar · {courses.length} tersedia
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.headerBtn,
              {
                backgroundColor: activeFilterCount > 0 ? (isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF') : (isDark ? theme.surfaceMuted : '#EEF2FF'),
                borderColor: activeFilterCount > 0 ? theme.primary : (isDark ? theme.border : 'rgba(79,70,229,0.15)'),
              },
            ]}
            onPress={openFilterModal}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={18} color={theme.primary} />
            {activeFilterCount > 0 && (
              <View style={[styles.headerBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.headerBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Teacher Scope Tabs */}
        {isGuru && (
          <View style={styles.scopeContainer}>
            <TouchableOpacity
              style={[
                styles.scopeTab,
                { backgroundColor: teacherScope === 'mine' ? theme.primary : (isDark ? theme.surfaceMuted : '#F1F5F9'), borderColor: teacherScope === 'mine' ? theme.primary : theme.border },
              ]}
              onPress={() => setTeacherScope('mine')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-outline"
                size={14}
                color={teacherScope === 'mine' ? '#FFFFFF' : theme.textSecondary}
              />
              <Text
                style={[
                  styles.scopeTabText,
                  { color: teacherScope === 'mine' ? '#FFFFFF' : theme.textSecondary, fontWeight: teacherScope === 'mine' ? '700' : '600' },
                ]}
              >
                Kursus Binaan Saya
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.scopeTab,
                { backgroundColor: teacherScope === 'all' ? theme.primary : (isDark ? theme.surfaceMuted : '#F1F5F9'), borderColor: teacherScope === 'all' ? theme.primary : theme.border },
              ]}
              onPress={() => setTeacherScope('all')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="grid-outline"
                size={14}
                color={teacherScope === 'all' ? '#FFFFFF' : theme.textSecondary}
              />
              <Text
                style={[
                  styles.scopeTabText,
                  { color: teacherScope === 'all' ? '#FFFFFF' : theme.textSecondary, fontWeight: teacherScope === 'all' ? '700' : '600' },
                ]}
              >
                Katalog Semua
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={17} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Cari course, guru, kategori..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={17} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Horizontal Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            const count = cat === 'all' ? courses.length : courses.filter((c) => c.category === cat).length;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.primary : (isDark ? theme.surfaceMuted : '#F1F5F9'),
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {cat === 'all' ? 'Semua' : cat}
                </Text>
                <View
                  style={[
                    styles.chipCountBadge,
                    {
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipCountText,
                      { color: isSelected ? '#FFFFFF' : theme.textMuted },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Filters Summary Strip */}
        {activeFilterCount > 0 && (
          <View style={styles.activeFiltersBar}>
            <Text style={[styles.activeFiltersLabel, { color: theme.textMuted }]}>Filter aktif:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersScroll}>
              {activeCategory !== 'all' && (
                <TouchableOpacity
                  style={[styles.activeTag, { backgroundColor: isDark ? theme.surfaceMuted : '#EEF2FF', borderColor: theme.primary }]}
                  onPress={() => setActiveCategory('all')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.activeTagText, { color: theme.primary }]}>{activeCategory}</Text>
                  <Ionicons name="close" size={13} color={theme.primary} />
                </TouchableOpacity>
              )}
              {activeLevel !== 'all' && (
                <TouchableOpacity
                  style={[styles.activeTag, { backgroundColor: isDark ? theme.surfaceMuted : '#EEF2FF', borderColor: theme.primary }]}
                  onPress={() => setActiveLevel('all')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.activeTagText, { color: theme.primary }]}>
                    {LEVEL_META[activeLevel]?.label || activeLevel}
                  </Text>
                  <Ionicons name="close" size={13} color={theme.primary} />
                </TouchableOpacity>
              )}
              {activeStatus !== 'all' && (
                <TouchableOpacity
                  style={[styles.activeTag, { backgroundColor: isDark ? theme.surfaceMuted : '#EEF2FF', borderColor: theme.primary }]}
                  onPress={() => setActiveStatus('all')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.activeTagText, { color: theme.primary }]}>
                    {activeStatus === 'enrolled' ? 'Terdaftar' : 'Belum Terdaftar'}
                  </Text>
                  <Ionicons name="close" size={13} color={theme.primary} />
                </TouchableOpacity>
              )}
              {sortBy !== 'latest' && (
                <TouchableOpacity
                  style={[styles.activeTag, { backgroundColor: isDark ? theme.surfaceMuted : '#EEF2FF', borderColor: theme.primary }]}
                  onPress={() => setSortBy('latest')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.activeTagText, { color: theme.primary }]}>
                    {SORT_OPTIONS.find((s) => s.id === sortBy)?.label || sortBy}
                  </Text>
                  <Ionicons name="close" size={13} color={theme.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={resetAllFilters} style={styles.resetAllBtn} activeOpacity={0.7}>
                <Text style={[styles.resetAllText, { color: theme.primary }]}>Reset Semua</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* In Progress Section */}
        {activeFilterCount === 0 && searchQuery === '' && inProgress.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <View style={[styles.sectionDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Sedang Berjalan</Text>
              </View>
              <Text style={[styles.sectionAction, { color: theme.primary }]}>Lihat semua</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inProgRow}>
              {inProgress.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.inProgCard, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E2E8F0' }]}
                  onPress={() => onNavigateToCourseDetail && onNavigateToCourseDetail(c)}
                  activeOpacity={0.88}
                >
                  <LinearGradient colors={c.gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.inProgThumb}>
                    <Ionicons name="library" size={26} color="rgba(255,255,255,0.25)" />
                  </LinearGradient>
                  <View style={styles.inProgBody}>
                    <Text style={[styles.inProgTitle, { color: theme.textPrimary }]} numberOfLines={2}>{c.title}</Text>
                    <View style={styles.inProgProgRow}>
                      <View style={[styles.inProgTrack, { backgroundColor: isDark ? theme.border : '#E2E8F0' }]}>
                        <View style={[styles.inProgFill, { width: `${c.progress}%`, backgroundColor: c.accentColor }]} />
                      </View>
                      <Text style={[styles.inProgPct, { color: c.accentColor }]}>{c.progress}%</Text>
                    </View>
                    <Text style={[styles.inProgSub, { color: theme.textMuted }]}>
                      {Math.round(c.chaptersCount * c.progress / 100)}/{c.chaptersCount} Bab
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Course Catalog Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleWrap}>
              <View style={[styles.sectionDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {sectionTitle}
              </Text>
            </View>
            <Text style={[styles.sectionCount, { color: theme.textMuted }]}>{filtered.length} course</Text>
          </View>

          {isLoading && courses.length === 0 ? (
            <CourseCardSkeleton count={4} isDark={isDark} />
          ) : filtered.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: isDark ? theme.surfaceMuted : '#EEF2FF' }]}>
                <Ionicons name="funnel-outline" size={28} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Course Tidak Ditemukan</Text>
              <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>
                Tidak ada pembelajaran yang cocok dengan kata kunci atau filter yang dipilih.
              </Text>
              <TouchableOpacity
                style={[styles.emptyResetBtn, { backgroundColor: theme.primary }]}
                onPress={resetAllFilters}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={15} color="#FFFFFF" />
                <Text style={styles.emptyResetBtnText}>Reset Semua Filter</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.grid}>
              {filtered.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  theme={theme}
                  isDark={isDark}
                  isGuru={isGuru}
                  onEdit={handleOpenEditModal}
                  onPress={(course) => onNavigateToCourseDetail && onNavigateToCourseDetail(course)}
                />
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Filter Bottom Sheet Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          />
          <View style={[styles.modalSheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Handle bar */}
            <View style={styles.modalHandleWrap}>
              <View style={[styles.modalHandle, { backgroundColor: isDark ? '#475569' : '#CBD5E1' }]} />
            </View>

            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? theme.border : '#F1F5F9' }]}>
              <View style={styles.modalHeaderTitleWrap}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: isDark ? theme.surfaceMuted : '#EEF2FF' }]}>
                  <Ionicons name="options" size={18} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Filter & Urutkan</Text>
                  <Text style={[styles.modalSub, { color: theme.textMuted }]}>Sesuaikan kursus yang ingin ditampilkan</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? theme.surfaceMuted : '#F1F5F9' }]}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Modal Scroll Content */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {/* Kategori Section */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionLabel, { color: theme.textPrimary }]}>Kategori Pembelajaran</Text>
                <View style={styles.modalChipsGrid}>
                  {categories.map((cat) => {
                    const active = tempCategory === cat;
                    const count = cat === 'all' ? courses.length : courses.filter((c) => c.category === cat).length;
                    return (
                      <TouchableOpacity
                        key={`modal-cat-${cat}`}
                        style={[
                          styles.modalChip,
                          {
                            backgroundColor: active ? theme.primary : (isDark ? theme.surfaceMuted : '#F8FAFC'),
                            borderColor: active ? theme.primary : (isDark ? theme.border : '#E2E8F0'),
                          },
                        ]}
                        onPress={() => setTempCategory(cat)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.modalChipText,
                            { color: active ? '#FFFFFF' : theme.textSecondary, fontWeight: active ? '700' : '500' },
                          ]}
                        >
                          {cat === 'all' ? 'Semua Kategori' : cat}
                        </Text>
                        <Text
                          style={[
                            styles.modalChipCount,
                            { color: active ? 'rgba(255,255,255,0.8)' : theme.textMuted },
                          ]}
                        >
                          ({count})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Tingkat Kesulitan Section */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionLabel, { color: theme.textPrimary }]}>Tingkat Kesulitan</Text>
                <View style={styles.modalChipsGrid}>
                  {LEVEL_OPTIONS.map((lvl) => {
                    const active = tempLevel === lvl.id;
                    return (
                      <TouchableOpacity
                        key={`modal-lvl-${lvl.id}`}
                        style={[
                          styles.modalChip,
                          {
                            backgroundColor: active ? theme.primary : (isDark ? theme.surfaceMuted : '#F8FAFC'),
                            borderColor: active ? theme.primary : (isDark ? theme.border : '#E2E8F0'),
                          },
                        ]}
                        onPress={() => setTempLevel(lvl.id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.modalChipText,
                            { color: active ? '#FFFFFF' : theme.textSecondary, fontWeight: active ? '700' : '500' },
                          ]}
                        >
                          {lvl.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Status Belajar Section */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionLabel, { color: theme.textPrimary }]}>Status Akses</Text>
                <View style={styles.modalChipsGrid}>
                  {STATUS_OPTIONS.map((stat) => {
                    const active = tempStatus === stat.id;
                    return (
                      <TouchableOpacity
                        key={`modal-stat-${stat.id}`}
                        style={[
                          styles.modalChip,
                          {
                            backgroundColor: active ? theme.primary : (isDark ? theme.surfaceMuted : '#F8FAFC'),
                            borderColor: active ? theme.primary : (isDark ? theme.border : '#E2E8F0'),
                          },
                        ]}
                        onPress={() => setTempStatus(stat.id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.modalChipText,
                            { color: active ? '#FFFFFF' : theme.textSecondary, fontWeight: active ? '700' : '500' },
                          ]}
                        >
                          {stat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Urutkan Berdasarkan Section */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionLabel, { color: theme.textPrimary }]}>Urutkan Berdasarkan</Text>
                <View style={styles.modalChipsGrid}>
                  {SORT_OPTIONS.map((srt) => {
                    const active = tempSortBy === srt.id;
                    return (
                      <TouchableOpacity
                        key={`modal-srt-${srt.id}`}
                        style={[
                          styles.modalChip,
                          {
                            backgroundColor: active ? theme.primary : (isDark ? theme.surfaceMuted : '#F8FAFC'),
                            borderColor: active ? theme.primary : (isDark ? theme.border : '#E2E8F0'),
                          },
                        ]}
                        onPress={() => setTempSortBy(srt.id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.modalChipText,
                            { color: active ? '#FFFFFF' : theme.textSecondary, fontWeight: active ? '700' : '500' },
                          ]}
                        >
                          {srt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer Actions */}
            <View
              style={[
                styles.modalFooter,
                {
                  borderTopColor: isDark ? theme.border : '#F1F5F9',
                  paddingBottom: Math.max(insets.bottom || 0, 16) + 8,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.modalResetBtn, { borderColor: theme.border, backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC' }]}
                onPress={resetTempFilters}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.modalResetBtnText, { color: theme.textSecondary }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalApplyBtn, { backgroundColor: theme.primary }]}
                onPress={applyFilters}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text style={styles.modalApplyBtnText}>
                  Terapkan ({tempMatchedCount} Course)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !isSavingCourse && setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => !isSavingCourse && setEditModalVisible(false)}
          />
          <View style={[styles.modalSheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHandleWrap}>
              <View style={[styles.modalHandle, { backgroundColor: isDark ? '#475569' : '#CBD5E1' }]} />
            </View>

            <View style={[styles.modalHeader, { borderBottomColor: isDark ? theme.border : '#F1F5F9' }]}>
              <View style={styles.modalHeaderTitleWrap}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: isDark ? 'rgba(79,70,229,0.2)' : '#EEF2FF' }]}>
                  <Ionicons name="create-outline" size={18} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Edit Data Kursus</Text>
                  <Text style={[styles.modalSub, { color: theme.textMuted }]}>Perbarui detail kurikulum pembelajaran</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? theme.surfaceMuted : '#F1F5F9' }]}
                onPress={() => !isSavingCourse && setEditModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <View style={styles.editFieldGroup}>
                <Text style={[styles.editFieldLabel, { color: theme.textSecondary }]}>Judul Kursus</Text>
                <TextInput
                  style={[styles.editInput, { backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC', borderColor: theme.border, color: theme.textPrimary }]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Masukkan judul kursus..."
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.editFieldGroup}>
                <Text style={[styles.editFieldLabel, { color: theme.textSecondary }]}>Kategori</Text>
                <TextInput
                  style={[styles.editInput, { backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC', borderColor: theme.border, color: theme.textPrimary }]}
                  value={editCategory}
                  onChangeText={setEditCategory}
                  placeholder="Contoh: Matematika, Fisika, dll."
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.editFieldGroup}>
                <Text style={[styles.editFieldLabel, { color: theme.textSecondary }]}>Tingkat Kesulitan</Text>
                <View style={styles.modalChipsGrid}>
                  {[
                    { id: 'beginner', label: 'Pemula' },
                    { id: 'intermediate', label: 'Menengah' },
                    { id: 'advanced', label: 'Mahir' },
                  ].map((lvl) => {
                    const active = editLevel === lvl.id;
                    return (
                      <TouchableOpacity
                        key={`edit-lvl-${lvl.id}`}
                        style={[
                          styles.modalChip,
                          {
                            backgroundColor: active ? theme.primary : (isDark ? theme.surfaceMuted : '#F8FAFC'),
                            borderColor: active ? theme.primary : (isDark ? theme.border : '#E2E8F0'),
                          },
                        ]}
                        onPress={() => setEditLevel(lvl.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.modalChipText, { color: active ? '#FFFFFF' : theme.textSecondary, fontWeight: active ? '700' : '500' }]}>
                          {lvl.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.editFieldGroup}>
                <Text style={[styles.editFieldLabel, { color: theme.textSecondary }]}>Status Publikasi</Text>
                <View style={styles.modalChipsGrid}>
                  {[
                    { id: 'published', label: 'Dipublikasikan (Aktif)' },
                    { id: 'draft', label: 'Draft (Disimpan)' },
                  ].map((st) => {
                    const active = editStatus === st.id;
                    return (
                      <TouchableOpacity
                        key={`edit-st-${st.id}`}
                        style={[
                          styles.modalChip,
                          {
                            backgroundColor: active ? theme.primary : (isDark ? theme.surfaceMuted : '#F8FAFC'),
                            borderColor: active ? theme.primary : (isDark ? theme.border : '#E2E8F0'),
                          },
                        ]}
                        onPress={() => setEditStatus(st.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.modalChipText, { color: active ? '#FFFFFF' : theme.textSecondary, fontWeight: active ? '700' : '500' }]}>
                          {st.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.editFieldGroup}>
                <Text style={[styles.editFieldLabel, { color: theme.textSecondary }]}>Deskripsi Kursus</Text>
                <TextInput
                  style={[
                    styles.editInput,
                    styles.editTextArea,
                    { backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC', borderColor: theme.border, color: theme.textPrimary },
                  ]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Tuliskan gambaran materi pembelajaran..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: isDark ? theme.border : '#F1F5F9', paddingBottom: Math.max(insets.bottom || 0, 16) + 8 }]}>
              <TouchableOpacity
                style={[styles.modalResetBtn, { borderColor: theme.border, backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC' }]}
                onPress={() => !isSavingCourse && setEditModalVisible(false)}
                disabled={isSavingCourse}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalResetBtnText, { color: theme.textSecondary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalApplyBtn, { backgroundColor: theme.primary, opacity: isSavingCourse ? 0.7 : 1 }]}
                onPress={handleSaveCourse}
                disabled={isSavingCourse}
                activeOpacity={0.85}
              >
                {isSavingCourse ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.modalApplyBtnText}>Simpan Perubahan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerBackBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  pageSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  headerBtn: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  headerBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' },
  headerBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  filterRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, borderWidth: 1 },
  filterChipText: { fontSize: 12 },
  chipCountBadge: { paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 8 },
  chipCountText: { fontSize: 10, fontWeight: '700' },

  // Active filters bar
  activeFiltersBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  activeFiltersLabel: { fontSize: 11, fontWeight: '600' },
  activeFiltersScroll: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  activeTagText: { fontSize: 11, fontWeight: '700' },
  resetAllBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  resetAllText: { fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  sectionAction: { fontSize: 12, fontWeight: '600' },
  sectionCount: { fontSize: 12, fontWeight: '500' },
  inProgRow: { gap: 12, paddingRight: 4 },
  inProgCard: { width: 220, borderRadius: 18, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  inProgThumb: { height: 88, alignItems: 'center', justifyContent: 'center' },
  inProgBody: { padding: 12 },
  inProgTitle: { fontSize: 12, fontWeight: '700', marginBottom: 8, lineHeight: 17 },
  inProgProgRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  inProgTrack: { flex: 1, height: 4, borderRadius: 2 },
  inProgFill: { height: 4, borderRadius: 2 },
  inProgPct: { fontSize: 11, fontWeight: '800' },
  inProgSub: { fontSize: 10, fontWeight: '500' },
  // Grid: alignItems stretch makes all cards in same row equal height
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'stretch' },
  // cardWrapper: fixed width, stretch so it fills equal height with sibling
  cardWrapper: { width: CARD_WIDTH, alignSelf: 'stretch' },
  // card: flex:1 so it fills the wrapper height end-to-end
  card: { flex: 1, flexDirection: 'column', borderRadius: 20, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  thumbnailWrap: { width: '100%', height: 108 },
  thumbnailGrad: { flex: 1, padding: 10, justifyContent: 'space-between' },
  thumbBg1: { position: 'absolute', right: -16, top: -16, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.07)' },
  thumbBg2: { position: 'absolute', left: -10, bottom: -10, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.05)' },
  thumbIcon: { position: 'absolute', right: 8, bottom: 6 },
  thumbTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  levelBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  levelBadgeText: { fontSize: 9, fontWeight: '800' },
  freeBadge: { backgroundColor: 'rgba(209,250,229,0.92)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  freeBadgeText: { fontSize: 9, fontWeight: '800', color: '#065F46' },
  thumbProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, position: 'absolute', bottom: 8, left: 10, right: 10 },
  thumbProgressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2 },
  thumbProgressFill: { height: 4, borderRadius: 2 },
  thumbProgressText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
  // cardBody: flex:1 + flexDirection column so CTA is always pinned to bottom
  cardBody: { flex: 1, padding: 11, flexDirection: 'column' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  categoryChip: { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 7 },
  categoryChipText: { fontSize: 9, fontWeight: '800' },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  miniStatText: { fontSize: 9, fontWeight: '600' },
  // Fixed line heights for title (2 lines) and desc (3 lines) = consistent spacing
  cardTitle: { fontSize: 12, fontWeight: '800', lineHeight: 17, height: 34, marginBottom: 4 },
  cardDesc: { fontSize: 10, lineHeight: 15, height: 45, marginBottom: 9, fontWeight: '400' },
  // spacer pushes teacher/stats/CTA to bottom of the card
  cardSpacer: { flex: 1 },
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, borderTopWidth: 1, marginBottom: 7 },
  teacherAv: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  teacherAvText: { fontSize: 7, fontWeight: '900' },
  teacherName: { fontSize: 9, fontWeight: '500', flex: 1 },
  statsRow: { flexDirection: 'row', gap: 10, paddingTop: 7, borderTopWidth: 1, marginBottom: 9 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 9, fontWeight: '500' },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 11 },
  ctaPrimary: { backgroundColor: '#1C2E5A' },
  ctaPrimaryText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  ctaOutline: { borderWidth: 1 },
  ctaOutlineText: { fontSize: 11, fontWeight: '600' },
  empty: { padding: 32, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  emptyDesc: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginBottom: 16 },
  emptyResetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12 },
  emptyResetBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  // Filter BottomSheet Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  modalBackdrop: { flex: 1 },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '82%', borderWidth: 1, borderBottomWidth: 0, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 16 },
  modalHandleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  modalHandle: { width: 38, height: 4.5, borderRadius: 3 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  modalHeaderTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  modalHeaderIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalSub: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBody: { paddingHorizontal: 20, paddingVertical: 12 },
  modalSection: { marginBottom: 20 },
  modalSectionLabel: { fontSize: 13, fontWeight: '800', marginBottom: 10, letterSpacing: -0.2 },
  modalChipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  modalChipText: { fontSize: 12 },
  modalChipCount: { fontSize: 11 },
  modalFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  modalResetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1 },
  modalResetBtnText: { fontSize: 13, fontWeight: '700' },
  modalApplyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  modalApplyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  statusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  statusBadgeText: { fontSize: 9, fontWeight: '800' },
  guruActionRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  ctaEdit: { flex: 1, borderWidth: 1 },
  ctaDetail: { flex: 1 },
  ctaEditText: { fontSize: 11, fontWeight: '700' },
  scopeContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  scopeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  scopeTabText: { fontSize: 12 },
  editFieldGroup: { marginBottom: 16 },
  editFieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  editInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, fontWeight: '500' },
  editTextArea: { height: 90, paddingTop: 10 },
});


import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * Basic shimmering box primitive
 */
export function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style, isDark }) {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const defaultBg = isDark ? '#1E293B' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: defaultBg,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

/**
 * Vertical full-width list of course card skeletons (manjang kebawah, tidak berdampingan)
 */
export function CourseCardSkeleton({ count = 4, isDark }) {
  const items = Array.from({ length: count });

  return (
    <View style={styles.cardVerticalList}>
      {items.map((_, idx) => (
        <View
          key={idx}
          style={[
            styles.cardSkeletonVertical,
            {
              backgroundColor: isDark ? '#13182E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E8EDF4',
            },
          ]}
        >
          {/* Top Banner Thumbnail Box */}
          <SkeletonBox
            width="100%"
            height={116}
            borderRadius={14}
            isDark={isDark}
            style={{ marginBottom: 12 }}
          />

          {/* Category chip & level stat row */}
          <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 10 }]}>
            <SkeletonBox width={72} height={18} borderRadius={7} isDark={isDark} />
            <SkeletonBox width={48} height={16} borderRadius={6} isDark={isDark} />
          </View>

          {/* Title lines */}
          <SkeletonBox
            width="90%"
            height={16}
            borderRadius={6}
            isDark={isDark}
            style={{ marginBottom: 6 }}
          />
          <SkeletonBox
            width="65%"
            height={14}
            borderRadius={6}
            isDark={isDark}
            style={{ marginBottom: 10 }}
          />

          {/* Description line */}
          <SkeletonBox
            width="82%"
            height={12}
            borderRadius={5}
            isDark={isDark}
            style={{ marginBottom: 14 }}
          />

          {/* Teacher row & CTA action placeholder */}
          <View style={[styles.row, { justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
            <View style={styles.row}>
              <SkeletonBox
                width={24}
                height={24}
                borderRadius={12}
                isDark={isDark}
              />
              <SkeletonBox
                width={95}
                height={12}
                borderRadius={5}
                isDark={isDark}
                style={{ marginLeft: 8 }}
              />
            </View>
            <SkeletonBox
              width={75}
              height={28}
              borderRadius={8}
              isDark={isDark}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Course detail skeleton (Hero banner + Syllabus chapters)
 */
export function CourseDetailSkeleton({ isDark, dynamicHeroPaddingTop = 60 }) {
  return (
    <View style={{ flex: 1 }}>
      {/* Hero Banner skeleton */}
      <View
        style={[
          styles.detailHeroSkeleton,
          {
            paddingTop: dynamicHeroPaddingTop,
            backgroundColor: isDark ? '#13182E' : '#1C2E5A',
          },
        ]}
      >
        <SkeletonBox
          width={80}
          height={22}
          borderRadius={10}
          isDark={isDark}
          style={{ marginBottom: 16 }}
        />
        <SkeletonBox
          width="85%"
          height={26}
          borderRadius={8}
          isDark={isDark}
          style={{ marginBottom: 10 }}
        />
        <SkeletonBox
          width="95%"
          height={14}
          borderRadius={6}
          isDark={isDark}
          style={{ marginBottom: 6 }}
        />
        <SkeletonBox
          width="70%"
          height={14}
          borderRadius={6}
          isDark={isDark}
          style={{ marginBottom: 20 }}
        />

        {/* Stats row */}
        <View style={styles.detailStatsRow}>
          <SkeletonBox width="28%" height={38} borderRadius={10} isDark={isDark} />
          <SkeletonBox width="28%" height={38} borderRadius={10} isDark={isDark} />
          <SkeletonBox width="28%" height={38} borderRadius={10} isDark={isDark} />
        </View>
      </View>

      {/* Chapters list skeleton */}
      <View style={{ padding: 16, gap: 12 }}>
        <SkeletonBox width="45%" height={18} borderRadius={6} isDark={isDark} style={{ marginBottom: 6 }} />
        {[1, 2, 3, 4].map((n) => (
          <View
            key={n}
            style={[
              styles.chapterSkeleton,
              {
                backgroundColor: isDark ? '#13182E' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <SkeletonBox width={32} height={32} borderRadius={10} isDark={isDark} />
              <View style={{ flex: 1, gap: 6 }}>
                <SkeletonBox width="60%" height={14} borderRadius={6} isDark={isDark} />
                <SkeletonBox width="35%" height={10} borderRadius={5} isDark={isDark} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Lesson material screen skeleton
 */
export function LessonSkeleton({ isDark }) {
  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      {/* Hero skeleton */}
      <SkeletonBox
        width="100%"
        height={130}
        borderRadius={20}
        isDark={isDark}
        style={{ marginBottom: 6 }}
      />

      {/* Content box skeleton */}
      <View
        style={[
          styles.contentCardSkeleton,
          {
            backgroundColor: isDark ? '#13182E' : '#FFFFFF',
            borderColor: isDark ? '#1E293B' : '#E8EDF4',
          },
        ]}
      >
        <SkeletonBox width="70%" height={20} borderRadius={6} isDark={isDark} style={{ marginBottom: 12 }} />
        <SkeletonBox width="100%" height={14} borderRadius={5} isDark={isDark} style={{ marginBottom: 8 }} />
        <SkeletonBox width="92%" height={14} borderRadius={5} isDark={isDark} style={{ marginBottom: 8 }} />
        <SkeletonBox width="85%" height={14} borderRadius={5} isDark={isDark} style={{ marginBottom: 16 }} />

        {/* Code block box */}
        <SkeletonBox width="100%" height={90} borderRadius={12} isDark={isDark} style={{ marginBottom: 16 }} />

        <SkeletonBox width="100%" height={14} borderRadius={5} isDark={isDark} style={{ marginBottom: 8 }} />
        <SkeletonBox width="60%" height={14} borderRadius={5} isDark={isDark} />
      </View>
    </View>
  );
}

/**
 * Canteen horizontal category chips skeleton
 */
export function CanteenCategorySkeleton({ count = 5, isDark }) {
  const items = Array.from({ length: count });
  const chipWidths = [70, 95, 80, 85, 90];

  return (
    <View style={styles.categorySkeletonRow}>
      {items.map((_, idx) => (
        <SkeletonBox
          key={idx}
          width={chipWidths[idx % chipWidths.length]}
          height={32}
          borderRadius={10}
          isDark={isDark}
          style={{ marginRight: 8 }}
        />
      ))}
    </View>
  );
}

/**
 * Canteen vertical food catalog items skeleton
 */
export function CanteenMenuSkeleton({ count = 4, isDark }) {
  const items = Array.from({ length: count });

  return (
    <View style={styles.canteenMenuList}>
      {items.map((_, idx) => (
        <View
          key={idx}
          style={[
            styles.canteenCardSkeleton,
            {
              backgroundColor: isDark ? '#141A2D' : '#FFFFFF',
              borderColor: isDark ? '#1E2744' : '#F1F5F9',
            },
          ]}
        >
          {/* Left info column */}
          <View style={styles.canteenInfoCol}>
            {/* Stall name & rating skeleton */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <SkeletonBox width={100} height={12} borderRadius={4} isDark={isDark} />
              <SkeletonBox width={32} height={12} borderRadius={4} isDark={isDark} />
            </View>

            {/* Food title */}
            <SkeletonBox width="85%" height={15} borderRadius={5} isDark={isDark} style={{ marginBottom: 6 }} />

            {/* Description lines */}
            <SkeletonBox width="95%" height={11} borderRadius={4} isDark={isDark} style={{ marginBottom: 4 }} />
            <SkeletonBox width="65%" height={11} borderRadius={4} isDark={isDark} style={{ marginBottom: 12 }} />

            {/* Price pill */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <SkeletonBox width={75} height={16} borderRadius={5} isDark={isDark} />
              <SkeletonBox width={45} height={12} borderRadius={4} isDark={isDark} />
            </View>
          </View>

          {/* Right image + action button column */}
          <View style={styles.canteenImageCol}>
            <SkeletonBox width={92} height={92} borderRadius={14} isDark={isDark} />
            <SkeletonBox width={74} height={28} borderRadius={9} isDark={isDark} style={{ marginTop: -14 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Teacher daily schedule timeline skeleton (Jadwal Mengajar Hari Ini)
 */
export function TeacherScheduleSkeleton({ count = 3, isDark }) {
  const items = Array.from({ length: count });

  return (
    <View style={styles.scheduleSkeletonContainer}>
      <View
        style={[
          styles.scheduleTrackLineSkeleton,
          { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' },
        ]}
      />

      {items.map((_, idx) => (
        <View key={idx} style={styles.scheduleTimelineRowSkeleton}>
          {/* Node marker skeleton */}
          <SkeletonBox
            width={28}
            height={28}
            borderRadius={14}
            isDark={isDark}
            style={{ marginRight: 10, marginTop: 4 }}
          />

          {/* Card skeleton */}
          <View
            style={[
              styles.scheduleCardSkeleton,
              {
                backgroundColor: isDark ? '#141A2D' : '#F8FAFC',
                borderColor: isDark ? '#1E2744' : '#E2E8F0',
              },
            ]}
          >
            {/* Top row: time + badge */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <SkeletonBox width={120} height={12} borderRadius={4} isDark={isDark} />
              <SkeletonBox width={68} height={16} borderRadius={6} isDark={isDark} />
            </View>

            {/* Subject / Class Title */}
            <SkeletonBox width="80%" height={15} borderRadius={5} isDark={isDark} style={{ marginBottom: 6 }} />

            {/* Room & note */}
            <SkeletonBox width="55%" height={11} borderRadius={4} isDark={isDark} style={{ marginBottom: 12 }} />

            {/* Action button */}
            <SkeletonBox width="100%" height={34} borderRadius={10} isDark={isDark} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cardVerticalList: {
    flexDirection: 'column',
    gap: 14,
    width: '100%',
    paddingTop: 4,
  },
  cardSkeletonVertical: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailHeroSkeleton: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  detailStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chapterSkeleton: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  contentCardSkeleton: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  categorySkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  canteenMenuList: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  canteenCardSkeleton: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  canteenInfoCol: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'center',
  },
  canteenImageCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleSkeletonContainer: {
    position: 'relative',
    paddingTop: 4,
  },
  scheduleTrackLineSkeleton: {
    position: 'absolute',
    left: 14,
    top: 14,
    bottom: 14,
    width: 2,
    borderRadius: 1,
  },
  scheduleTimelineRowSkeleton: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  scheduleCardSkeleton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
});

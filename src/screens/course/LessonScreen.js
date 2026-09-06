import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Animated, Modal, Platform, StatusBar,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { courseApi } from '../../api/courseApi';
import { CONFIG } from '../../config';
import { LessonSkeleton } from '../../components/common/SkeletonLoader';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * Remove emojis and miscellaneous icon font glyphs from any text
 */
function stripEmojis(str) {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .replace(/[\u{10000}-\u{10ffff}\u{1F000}-\u{1F9FF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Utility to parse HTML text from backend database into styled blocks
 */
function parseHtmlToBlocks(html) {
  if (!html) return [];
  const blocks = [];
  const cleanHtml = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const regex = /<(h[1-6]|pre|blockquote|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  let hasMatches = false;

  while ((match = regex.exec(cleanHtml)) !== null) {
    hasMatches = true;
    const tag = match[1].toLowerCase();
    const rawContent = match[2];

    const text = rawContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();

    const cleanText = stripEmojis(text);
    if (!cleanText) continue;

    if (tag.startsWith('h')) {
      blocks.push({ type: 'heading', text: cleanText });
    } else if (tag === 'pre') {
      blocks.push({ type: 'code', text: cleanText, language: 'Kode Program' });
    } else if (tag === 'blockquote') {
      blocks.push({ type: 'highlight', text: cleanText });
    } else if (tag === 'li') {
      blocks.push({ type: 'list_item', text: cleanText });
    } else {
      blocks.push({ type: 'paragraph', text: cleanText });
    }
  }

  if (!hasMatches && cleanHtml.trim()) {
    const plain = stripEmojis(cleanHtml.replace(/<\/?[^>]+(>|$)/g, ''));
    if (plain) {
      blocks.push({ type: 'paragraph', text: plain });
    }
  }

  return blocks;
}

/**
 * Sidebar Drawer for navigating across course chapters and sub-chapters
 */
function SidebarDrawer({ visible, onClose, lesson, theme, isDark, onSelectSubChapter }) {
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -SCREEN_WIDTH,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  }, [visible]);

  const chapters = lesson.chapters || [];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.sidebarOverlay}>
        <TouchableOpacity style={styles.sidebarBg} onPress={onClose} activeOpacity={1} />
        <Animated.View
          style={[styles.sidebarDrawer, { backgroundColor: theme.surface, transform: [{ translateX: slideAnim }] }]}
        >
          {/* Drawer Header */}
          <LinearGradient colors={lesson.courseGradient || ['#1C2E5A', '#2B3B8B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.drawerHeader}>
            <View style={styles.drawerHeaderContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.drawerCourseTitle} numberOfLines={2}>{lesson.courseTitle}</Text>
                <View style={styles.drawerProgressRow}>
                  <View style={styles.drawerProgressTrack}>
                    <View style={[styles.drawerProgressFill, { width: `${lesson.courseProgress || 0}%` }]} />
                  </View>
                  <Text style={styles.drawerProgressText}>{lesson.courseProgress || 0}%</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.drawerCloseBtn} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Chapter List */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.drawerScroll}>
            {chapters.map((ch) => (
              <View key={ch.id} style={[styles.drawerChapter, { borderBottomColor: isDark ? theme.border : '#F1F5F9' }]}>
                <View style={[styles.drawerChapterHeader, { backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFF' }]}>
                  <View style={[styles.drawerChIcon, { backgroundColor: isDark ? theme.surfaceHighlight : '#EEF2FF' }]}>
                    <Ionicons name="book-outline" size={12} color={theme.primary} />
                  </View>
                  <Text style={[styles.drawerChTitle, { color: theme.textPrimary }]} numberOfLines={1}>{ch.title}</Text>
                </View>
                {(ch.subChapters || []).map((sub) => {
                  const isCurrent = sub.isCurrent;
                  let icon = 'ellipse-outline';
                  let iconColor = isDark ? theme.textMuted : '#CBD5E1';
                  if (sub.isLocked) {
                    icon = 'lock-closed';
                    iconColor = isDark ? '#475569' : '#CBD5E1';
                  } else if (sub.isCompleted) {
                    icon = 'checkmark-circle';
                    iconColor = '#10B981';
                  } else if (isCurrent) {
                    icon = 'radio-button-on';
                    iconColor = theme.primary;
                  }

                  return (
                    <TouchableOpacity
                      key={sub.id}
                      style={[
                        styles.drawerSubItem,
                        isCurrent && { backgroundColor: isDark ? theme.surfaceHighlight : '#EEF2FF' },
                        { borderBottomColor: isDark ? theme.border : '#F8FAFC' },
                      ]}
                      onPress={() => {
                        if (!sub.isLocked) {
                          onClose();
                          if (onSelectSubChapter) onSelectSubChapter(sub);
                        } else {
                          Alert.alert(
                            'Materi Terkunci',
                            `Sub-bab "${sub.title}" masih terkunci.\n\nSelesaikan pembelajaran dan kuis pada materi sebelumnya terlebih dahulu untuk membuka kunci materi ini.`
                          );
                        }
                      }}
                      activeOpacity={0.75}
                    >
                      {isCurrent && <View style={[styles.drawerSubBar, { backgroundColor: theme.primary }]} />}
                      <Ionicons name={icon} size={13} color={iconColor} />
                      <Text
                        style={[
                          styles.drawerSubTitle,
                          { color: isCurrent ? theme.primary : (sub.isLocked ? theme.textMuted : theme.textSecondary) },
                          isCurrent && { fontWeight: '700' },
                        ]}
                        numberOfLines={2}
                      >
                        {sub.title}
                      </Text>
                      {sub.isLocked && (
                        <View style={[styles.drawerLockedBadge, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                          <Ionicons name="lock-closed" size={9} color={isDark ? '#94A3B8' : '#64748B'} />
                          <Text style={[styles.drawerLockedText, { color: isDark ? '#94A3B8' : '#64748B' }]}>Kunci</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Animated visual showcase indicating that an interactive coding mission
 * is exclusively playable in the Desktop/Laptop Web App browser.
 */
function CodingActivityWebNotice({ activity, title, theme, isDark }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const cursorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for window
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating bobbing animation for computer monitor
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow opacity pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Blinking code cursor
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const act = activity || {};
  const xp = act.xpReward || 50;
  const rawConcept = act.conceptTag ? act.conceptTag.toUpperCase() : 'AKTIVITAS KODING';
  const concept = stripEmojis(rawConcept);
  const rawStory = typeof act.story === 'string' ? act.story : (act.story?.body || 'Misi pemrograman visual, robot maze, dan penyusunan algoritma interaktif.');
  const storyText = stripEmojis(rawStory);
  const cleanTitle = stripEmojis(title);

  const handleOpenBrowser = () => {
    const webBase = (CONFIG.API_BASE_URL || '').replace('/api', '');
    const webUrl = `${webBase}/siswa/courses`;
    Linking.openURL(webUrl).catch(() => {
      Alert.alert('Buka Web', 'Silakan akses melalui browser laptop/komputer: ' + webUrl);
    });
  };

  return (
    <View style={[styles.webNoticeCard, { borderColor: isDark ? '#3730A3' : '#C7D2FE', backgroundColor: isDark ? '#13182E' : '#F5F7FF' }]}>
      <LinearGradient
        colors={isDark ? ['#1E1B4B', '#0F172A'] : ['#EEF2FF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.webNoticeGrad}
      >
        {/* Animated Browser & IDE Mockup (Pure Native Shapes, No Icon Fonts) */}
        <Animated.View
          style={[
            styles.mockupWrapper,
            {
              transform: [{ translateY: floatAnim }, { scale: pulseAnim }],
            },
          ]}
        >
          {/* Ambient Radial Glow */}
          <Animated.View
            style={[
              styles.mockupGlow,
              {
                opacity: glowAnim,
              },
            ]}
          />

          {/* Browser Window Screen */}
          <View style={[styles.browserWindow, { backgroundColor: isDark ? '#0B0F19' : '#1E293B', borderColor: isDark ? '#4338CA' : '#6366F1' }]}>
            {/* Window Titlebar */}
            <View style={styles.browserHeader}>
              <View style={styles.macDots}>
                <View style={[styles.macDot, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.macDot, { backgroundColor: '#F59E0B' }]} />
                <View style={[styles.macDot, { backgroundColor: '#10B981' }]} />
              </View>
              <View style={[styles.browserUrlBar, { backgroundColor: isDark ? '#1E293B' : '#334155' }]}>
                <View style={styles.browserSecureDot} />
                <Text style={styles.browserUrlText}>pedagogiai.com/ide</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>

            {/* Code Workspace Simulator */}
            <View style={styles.browserEditor}>
              <View style={styles.codeRow}>
                <Text style={styles.codeLineNum}>1</Text>
                <Text style={styles.codeKeyword}>def </Text>
                <Text style={styles.codeFn}>run_simulation</Text>
                <Text style={styles.codePunc}>():</Text>
              </View>
              <View style={[styles.codeRow, { paddingLeft: 14 }]}>
                <Text style={styles.codeLineNum}>2</Text>
                <Text style={styles.codeCall}>robot.move_forward</Text>
                <Text style={styles.codePunc}>()</Text>
                <Animated.View style={[styles.codeCursor, { opacity: cursorOpacity }]} />
              </View>
              <View style={[styles.codeRow, { paddingLeft: 14 }]}>
                <Text style={styles.codeLineNum}>3</Text>
                <Text style={styles.codeReturn}>return </Text>
                <Text style={styles.codeStr}>"GOAL_REACHED"</Text>
              </View>
            </View>
          </View>

          {/* Monitor Stand */}
          <View style={styles.monitorStand} />
          <View style={styles.monitorBase} />
        </Animated.View>

        {/* Badges (Pure Clean Typography, Zero Font Icons) */}
        <View style={styles.webNoticeBadges}>
          <View style={[styles.webNoticePill, { backgroundColor: isDark ? '#312E81' : '#E0E7FF' }]}>
            <View style={[styles.badgeDot, { backgroundColor: '#6366F1' }]} />
            <Text style={[styles.webNoticePillText, { color: isDark ? '#C7D2FE' : '#4338CA' }]}>
              PORTAL WEB DESKTOP
            </Text>
          </View>
          <View style={[styles.webNoticePill, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
            <View style={[styles.badgeDot, { backgroundColor: '#D97706' }]} />
            <Text style={[styles.webNoticePillText, { color: '#D97706' }]}>+{xp} EXP</Text>
          </View>
          <View style={[styles.webNoticePill, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#DCFCE7' }]}>
            <View style={[styles.badgeDot, { backgroundColor: '#059669' }]} />
            <Text style={[styles.webNoticePillText, { color: '#059669' }]}>{concept}</Text>
          </View>
        </View>

        {/* Mission Title */}
        <Text style={[styles.webNoticeTitle, { color: theme.textPrimary }]}>{cleanTitle}</Text>

        {/* Mission Story / Description */}
        {storyText ? (
          <View style={[styles.webNoticeStoryBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
            <Text style={[styles.webNoticeStoryText, { color: theme.textSecondary }]}>{storyText}</Text>
          </View>
        ) : null}

        {/* Informative Guidance Banner */}
        <View style={[styles.webNoticeActionBox, { backgroundColor: isDark ? '#1E233D' : '#F1F5F9', borderColor: isDark ? '#3B426B' : '#E2E8F0' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.badgeDot, { backgroundColor: '#6366F1', width: 7, height: 7, borderRadius: 3.5 }]} />
            <Text style={[styles.webNoticeActionTitleText, { color: theme.textPrimary }]}>
              Hanya Tersedia di Web App Browser
            </Text>
          </View>
          <Text style={[styles.webNoticeActionDesc, { color: theme.textMuted }]}>
            Aktivitas interaktif ini (navigasi maze robot 2D, blok pemrograman visual Scratch, dan runner simulasi kode) dirancang khusus untuk layar laptop/komputer.
          </Text>

          <TouchableOpacity
            style={[styles.webNoticePrimaryBtn, { backgroundColor: '#4F46E5' }]}
            onPress={handleOpenBrowser}
            activeOpacity={0.88}
          >
            <Text style={styles.webNoticeBtnText}>Buka Portal Web di Komputer →</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

/**
 * Render individual content blocks (Text, Code, Media, Interactive Missions)
 */
function ContentBlock({ block, theme, isDark }) {
  switch (block.type) {
    case 'heading':
      return (
        <Text style={[styles.contentHeading, { color: theme.textPrimary }]}>{block.text}</Text>
      );
    case 'paragraph':
      return (
        <Text style={[styles.contentParagraph, { color: theme.textSecondary }]}>{block.text}</Text>
      );
    case 'list_item':
      return (
        <View style={styles.listItem}>
          <View style={[styles.listDot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.listText, { color: theme.textSecondary }]}>{block.text}</Text>
        </View>
      );
    case 'code':
      return (
        <View style={[styles.codeBlock, { backgroundColor: isDark ? '#0F172A' : '#1E293B' }]}>
          <View style={styles.codeHeader}>
            <View style={styles.codeDots}>
              <View style={[styles.codeDot, { backgroundColor: '#EF4444' }]} />
              <View style={[styles.codeDot, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.codeDot, { backgroundColor: '#10B981' }]} />
            </View>
            <Text style={styles.codeLang}>{block.language || 'Code'}</Text>
          </View>
          <Text style={styles.codeText}>{block.text}</Text>
        </View>
      );
    case 'highlight':
      return (
        <View style={[styles.highlightBlock, { backgroundColor: isDark ? '#1C2346' : '#EEF2FF', borderLeftColor: theme.primary }]}>
          <Ionicons name="information-circle" size={16} color={theme.primary} style={styles.highlightIcon} />
          <Text style={[styles.highlightText, { color: isDark ? '#A5B4FC' : '#3730A3' }]}>{block.text}</Text>
        </View>
      );
    case 'video_card':
      return (
        <TouchableOpacity
          style={[styles.videoCard, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF', borderColor: theme.primary }]}
          onPress={() => block.url && Linking.openURL(block.url).catch(() => {})}
          activeOpacity={0.85}
        >
          <View style={[styles.videoIconWrap, { backgroundColor: theme.primary }]}>
            <Ionicons name="play" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.videoBody}>
            <Text style={[styles.videoTitle, { color: theme.textPrimary }]} numberOfLines={2}>{block.title || 'Video Pembelajaran'}</Text>
            <Text style={[styles.videoSub, { color: theme.textMuted }]}>Ketuk untuk memutar video materi</Text>
          </View>
          <Ionicons name="open-outline" size={16} color={theme.primary} />
        </TouchableOpacity>
      );
    case 'document_card':
      return (
        <TouchableOpacity
          style={[styles.videoCard, { backgroundColor: isDark ? '#1F2937' : '#FEF3C7', borderColor: '#F59E0B' }]}
          onPress={() => block.url && Linking.openURL(block.url).catch(() => {})}
          activeOpacity={0.85}
        >
          <View style={[styles.videoIconWrap, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="document-text" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.videoBody}>
            <Text style={[styles.videoTitle, { color: theme.textPrimary }]} numberOfLines={2}>{block.title || 'Dokumen Lampiran'}</Text>
            <Text style={[styles.videoSub, { color: theme.textMuted }]}>Ketuk untuk mengunduh dokumen</Text>
          </View>
          <Ionicons name="download-outline" size={18} color="#F59E0B" />
        </TouchableOpacity>
      );
    case 'audio_card':
      return (
        <TouchableOpacity
          style={[styles.videoCard, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF', borderColor: theme.primary }]}
          onPress={() => block.url && Linking.openURL(block.url).catch(() => {})}
          activeOpacity={0.85}
        >
          <View style={[styles.videoIconWrap, { backgroundColor: theme.primary }]}>
            <Ionicons name="volume-high" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.videoBody}>
            <Text style={[styles.videoTitle, { color: theme.textPrimary }]} numberOfLines={2}>{block.title || 'Audio Pembelajaran'}</Text>
            <Text style={[styles.videoSub, { color: theme.textMuted }]}>Ketuk untuk memutar audio materi</Text>
          </View>
          <Ionicons name="play-circle-outline" size={18} color={theme.primary} />
        </TouchableOpacity>
      );
    case 'mission_card':
      return (
        <CodingActivityWebNotice
          activity={block.data}
          title={block.title}
          theme={theme}
          isDark={isDark}
        />
      );
    default:
      return null;
  }
}

export default function LessonScreen({
  course: propCourse,
  subChapter: propSubChapter,
  onBack,
  onStartQuiz,
  onNavigateToNext,
  onSelectSubChapter,
}) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [lesson, setLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isMarkedComplete, setIsMarkedComplete] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const dynamicHeaderTop = safeTop + 8;
  const dynamicNavBottom = Math.max(insets.bottom, 12) + 8;

  const headerBg = scrollY.interpolate({ inputRange: [0, 60], outputRange: ['transparent', theme.surface], extrapolate: 'clamp' });
  const headerElevation = scrollY.interpolate({ inputRange: [0, 60], outputRange: [0, 4], extrapolate: 'clamp' });

  const activeSubChapterId = propSubChapter?.id || lesson?.currentSubChapter?.id;

  const loadLesson = useCallback(async (subId) => {
    if (!subId) return;
    setIsLoading(true);
    try {
      const res = await courseApi.getLessonContent(subId);
      if (res?.success && res.data) {
        setLesson(res.data);
        setIsMarkedComplete(Boolean(res.data.currentSubChapter?.isCompleted));
      } else if (res?.isLocked) {
        Alert.alert(
          'Materi Terkunci',
          res.message || 'Materi ini masih terkunci. Selesaikan materi dan kuis pada sub-bab sebelumnya terlebih dahulu.',
          [{ text: 'Kembali', onPress: () => onBack && onBack() }]
        );
      }
    } catch (err) {
      console.log('Error loading lesson content:', err?.message || err);
      const isLocked = err?.isLocked;
      const msg = err?.message || 'Materi tidak dapat diakses saat ini.';
      if (isLocked) {
        Alert.alert(
          'Materi Terkunci',
          msg,
          [{ text: 'Kembali', onPress: () => onBack && onBack() }]
        );
      } else {
        Alert.alert('Pemberitahuan', msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onBack]);

  useEffect(() => {
    if (activeSubChapterId) {
      loadLesson(activeSubChapterId);
    }
  }, [activeSubChapterId, loadLesson]);

  const handleCompleteLesson = async () => {
    if (isCompleting || !lesson?.currentSubChapter?.id) return;
    setIsCompleting(true);
    try {
      const res = await courseApi.completeLesson(lesson.currentSubChapter.id);
      if (res?.success) {
        setIsMarkedComplete(true);
        const hasUnpassedQuiz = lesson.currentSubChapter?.hasQuiz && !lesson.currentSubChapter?.quizPassed;

        if (hasUnpassedQuiz) {
          Alert.alert(
            'Materi Selesai!',
            (res.message || 'Materi berhasil diselesaikan (+10 EXP).') +
              '\n\nUntuk membuka materi sub-bab berikutnya, silakan selesaikan Quiz Pemahaman terlebih dahulu.',
            [
              { text: 'Nanti', style: 'cancel' },
              {
                text: 'Kerjakan Kuis',
                onPress: () => onStartQuiz && onStartQuiz(lesson.currentSubChapter.quiz),
              },
            ]
          );
        } else {
          Alert.alert('Selamat!', res.message || 'Materi berhasil diselesaikan (+10 EXP)');
        }

        // Reload current lesson content to refresh nextSubChapter lock status & sidebar drawer
        loadLesson(lesson.currentSubChapter.id);
      } else {
        Alert.alert('Info', res?.message || 'Tidak dapat menyelesaikan materi.');
      }
    } catch (err) {
      Alert.alert('Pemberitahuan', err?.message || 'Gagal menandai materi selesai.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading || !lesson || !lesson.currentSubChapter) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.floatingHeader, { backgroundColor: theme.surface, borderBottomColor: isDark ? theme.border : '#F1F5F9', paddingTop: dynamicHeaderTop }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={onBack} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={[styles.headerChapter, { color: theme.textMuted }]} numberOfLines={1}>
                {propCourse?.title || 'Memuat Materi...'}
              </Text>
              <Text style={[styles.headerSubTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {propSubChapter?.title || 'Memuat Konten...'}
              </Text>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ paddingTop: dynamicHeaderTop + 45, paddingBottom: 40 }}>
          <LessonSkeleton isDark={isDark} />
        </ScrollView>
      </View>
    );
  }

  // Convert contents into clean renderable blocks
  const contents = lesson.currentSubChapter?.contents || [];
  const contentBlocks = [];

  contents.forEach((c) => {
    const cleanTitle = stripEmojis(c.title);

    if (c.codingActivity || c.type === 'mission') {
      contentBlocks.push({
        type: 'mission_card',
        title: cleanTitle || 'Aktivitas Pemrograman Interaktif',
        data: c.codingActivity || {
          activityType: 'maze',
          conceptTag: 'Algoritma & Logika',
          story: 'Misi koding interaktif untuk mengasah kemampuan logika dan algoritma Anda.',
          xpReward: 20,
        },
      });
    }

    if (c.embedUrl) {
      contentBlocks.push({
        type: 'video_card',
        title: cleanTitle || 'Video Pembelajaran',
        url: c.embedUrl,
      });
    }

    if (c.type === 'document' && (c.fileUrl || c.fileName)) {
      contentBlocks.push({
        type: 'document_card',
        title: cleanTitle || stripEmojis(c.fileName) || 'Dokumen Materi',
        url: c.fileUrl,
      });
    }

    if (c.type === 'audio' && c.fileUrl) {
      contentBlocks.push({
        type: 'audio_card',
        title: cleanTitle || 'Audio Pembelajaran',
        url: c.fileUrl,
      });
    }

    if (c.body) {
      const parsed = parseHtmlToBlocks(c.body);
      contentBlocks.push(...parsed);
    }
  });

  if (contentBlocks.length === 0 && lesson.currentSubChapter?.description) {
    contentBlocks.push({
      type: 'paragraph',
      text: stripEmojis(lesson.currentSubChapter.description),
    });
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Floating Header */}
      <View style={[styles.floatingHeader, { backgroundColor: theme.surface, borderBottomColor: isDark ? theme.border : '#F1F5F9', paddingTop: dynamicHeaderTop }]}>
        {/* Progress bar at top */}
        <View style={[styles.topProgress, { backgroundColor: isDark ? theme.border : '#E8EDF4' }]}>
          <View style={[styles.topProgressFill, { width: `${lesson.courseProgress || 0}%`, backgroundColor: lesson.courseAccent || theme.primary }]} />
        </View>

        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={onBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerChapter, { color: theme.textMuted }]} numberOfLines={1}>
              {stripEmojis(lesson.currentChapter?.title) || 'Bab Pembelajaran'}
            </Text>
            <Text style={[styles.headerSubTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {stripEmojis(lesson.currentSubChapter?.title) || 'Materi Belajar'}
            </Text>
          </View>

          <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: isDark ? theme.surfaceMuted : '#EEF2FF' }]} onPress={() => setSidebarVisible(true)} activeOpacity={0.8}>
            <Ionicons name="menu" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Native Scrollable Content Area */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: dynamicNavBottom + 70 }]}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Sub Chapter Hero */}
        <LinearGradient colors={lesson.courseGradient || ['#1C2E5A', '#2B3B8B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.lessonHero}>
          <View style={styles.heroBg1} />
          <View style={styles.heroBg2} />
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Ionicons name="book-outline" size={11} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroBadgeText}>{stripEmojis(lesson.currentChapter?.title) || 'Bab'}</Text>
            </View>
            <View style={styles.heroDuration}>
              <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroBadgeText}>{lesson.currentSubChapter?.duration || 15} mnt</Text>
            </View>
          </View>
          <Text style={styles.lessonTitle}>{stripEmojis(lesson.currentSubChapter?.title)}</Text>
        </LinearGradient>

        {/* Content Body */}
        {isLoading ? (
          <View style={[styles.loadingWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>Memuat konten materi...</Text>
          </View>
        ) : (
          <View style={[styles.contentCard, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E8EDF4' }]}>
            {contentBlocks.map((block, idx) => (
              <ContentBlock key={idx} block={block} theme={theme} isDark={isDark} />
            ))}
          </View>
        )}

        {/* Completion & Quiz Action */}
        <View style={styles.actionSection}>
          {!isMarkedComplete ? (
            <TouchableOpacity
              style={[styles.completeBtn, { borderColor: '#10B981', backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#F0FDF4' }]}
              onPress={handleCompleteLesson}
              disabled={isCompleting}
              activeOpacity={0.85}
            >
              {isCompleting ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                  <Text style={styles.completeBtnText}>Tandai Selesai (+10 EXP)</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={[styles.completedBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#DCFCE7' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.completedBadgeText}>Materi Selesai Dipelajari</Text>
            </View>
          )}

          {lesson.currentSubChapter?.hasQuiz && (
            <TouchableOpacity
              style={styles.quizBtn}
              onPress={() => onStartQuiz && onStartQuiz(lesson.currentSubChapter.quiz)}
              activeOpacity={0.88}
            >
              <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.quizBtnGrad}>
                <Ionicons name="clipboard-outline" size={18} color="#FFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quizBtnTitle}>Kerjakan Quiz Pemahaman</Text>
                  <Text style={styles.quizBtnSub}>
                    {lesson.currentSubChapter.quiz?.questionsCount || 5} soal · Nilai kelulusan {lesson.currentSubChapter.quiz?.passingScore || 70}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </Animated.ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomNav, { backgroundColor: theme.surface, borderTopColor: isDark ? theme.border : '#E8EDF4', paddingBottom: dynamicNavBottom }]}>
        <TouchableOpacity
          style={[styles.navBtn, styles.navBtnPrev, { borderColor: theme.border, backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC', opacity: lesson.prevSubChapter ? 1 : 0.6 }]}
          onPress={() => {
            if (lesson.prevSubChapter) {
              if (onSelectSubChapter) {
                onSelectSubChapter(lesson.prevSubChapter);
              } else {
                loadLesson(lesson.prevSubChapter.id);
              }
            } else {
              onBack && onBack();
            }
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
          <View style={styles.navBtnContent}>
            <Text style={[styles.navBtnLabel, { color: theme.textMuted }]}>Sebelumnya</Text>
            <Text style={[styles.navBtnTitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {lesson.prevSubChapter?.title || 'Daftar Materi'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navBtn,
            styles.navBtnNext,
            lesson.nextSubChapter?.isLocked && {
              backgroundColor: isDark ? '#334155' : '#64748B',
            },
          ]}
          onPress={() => {
            if (lesson.nextSubChapter) {
              if (lesson.nextSubChapter.isLocked) {
                const hasUnpassedQuiz = lesson.currentSubChapter?.hasQuiz && !lesson.currentSubChapter?.quizPassed;

                if (hasUnpassedQuiz) {
                  Alert.alert(
                    'Materi Berikutnya Terkunci',
                    `Untuk membuka "${lesson.nextSubChapter.title}", kamu harus lulus Quiz Pemahaman pada materi ini terlebih dahulu.`,
                    [
                      { text: 'Nanti', style: 'cancel' },
                      {
                        text: 'Kerjakan Kuis',
                        onPress: () => onStartQuiz && onStartQuiz(lesson.currentSubChapter.quiz),
                      },
                    ]
                  );
                } else if (!isMarkedComplete) {
                  Alert.alert(
                    'Materi Berikutnya Terkunci',
                    `Selesaikan materi ini terlebih dahulu dengan menekan tombol "Tandai Selesai" untuk membuka "${lesson.nextSubChapter.title}".`,
                    [
                      { text: 'Batal', style: 'cancel' },
                      {
                        text: 'Tandai Selesai',
                        onPress: handleCompleteLesson,
                      },
                    ]
                  );
                } else {
                  Alert.alert(
                    'Materi Terkunci',
                    `Sub-bab "${lesson.nextSubChapter.title}" masih terkunci. Selesaikan pembelajaran pada materi sebelumnya terlebih dahulu.`
                  );
                }
                return;
              }

              if (onNavigateToNext) {
                onNavigateToNext(lesson.nextSubChapter);
              } else {
                loadLesson(lesson.nextSubChapter.id);
              }
            } else {
              onBack && onBack();
            }
          }}
          activeOpacity={0.88}
        >
          <View style={styles.navBtnContent}>
            <Text style={[styles.navBtnLabel, { color: 'rgba(255,255,255,0.7)' }]}>
              {lesson.nextSubChapter?.isLocked ? 'Terkunci' : 'Berikutnya'}
            </Text>
            <Text style={[styles.navBtnTitle, { color: '#FFF' }]} numberOfLines={1}>
              {lesson.nextSubChapter?.title || 'Selesai Kursus'}
            </Text>
          </View>
          <Ionicons
            name={lesson.nextSubChapter?.isLocked ? 'lock-closed' : 'chevron-forward'}
            size={16}
            color="rgba(255,255,255,0.8)"
          />
        </TouchableOpacity>
      </View>

      {/* Sidebar Drawer */}
      <SidebarDrawer
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        lesson={lesson}
        theme={theme}
        isDark={isDark}
        onSelectSubChapter={(sub) => {
          if (onSelectSubChapter) {
            onSelectSubChapter(sub);
          } else {
            loadLesson(sub.id);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  floatingHeader: { paddingTop: 0, borderBottomWidth: 1, zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
  topProgress: { height: 3 },
  topProgressFill: { height: 3 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  webNoticeCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginVertical: 12,
  },
  webNoticeGrad: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  mockupWrapper: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  mockupGlow: {
    position: 'absolute',
    top: -8,
    width: 220,
    height: 120,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  browserWindow: {
    width: 260,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  browserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  macDots: {
    flexDirection: 'row',
    gap: 5,
  },
  macDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  browserUrlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  browserSecureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  browserUrlText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#94A3B8',
    fontWeight: '600',
  },
  browserEditor: {
    padding: 10,
    gap: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeLineNum: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#475569',
    width: 14,
  },
  codeKeyword: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#EC4899',
    fontWeight: '700',
  },
  codeFn: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#38BDF8',
    fontWeight: '600',
  },
  codeCall: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#FACC15',
    fontWeight: '500',
  },
  codeReturn: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#C084FC',
    fontWeight: '700',
  },
  codeStr: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#4ADE80',
  },
  codePunc: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#94A3B8',
  },
  codeCursor: {
    width: 6,
    height: 12,
    backgroundColor: '#38BDF8',
    marginLeft: 3,
  },
  monitorStand: {
    width: 24,
    height: 10,
    backgroundColor: '#475569',
  },
  monitorBase: {
    width: 68,
    height: 4,
    backgroundColor: '#64748B',
    borderRadius: 2,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  webNoticeBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  webNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  webNoticePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  webNoticeTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  webNoticeStoryBox: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  webNoticeStoryText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  webNoticeActionBox: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  webNoticeActionTitleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  webNoticeActionDesc: {
    fontSize: 11,
    lineHeight: 17,
  },
  webNoticePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 4,
  },
  webNoticeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  headerIconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerChapter: { fontSize: 10, fontWeight: '600', marginBottom: 1 },
  headerSubTitle: { fontSize: 13, fontWeight: '700' },
  scrollContent: { paddingBottom: 90 },
  lessonHero: { paddingTop: 24, paddingBottom: 28, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  heroBg1: { position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.07)' },
  heroBg2: { position: 'absolute', left: -15, bottom: -15, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroBadgeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  heroDuration: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  heroBadgeText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  lessonTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', lineHeight: 28, letterSpacing: -0.3 },
  loadingWrap: { margin: 16, borderRadius: 20, borderWidth: 1, padding: 36, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, fontWeight: '600' },
  contentCard: { margin: 16, borderRadius: 20, borderWidth: 1, padding: 20, gap: 6 },
  contentHeading: { fontSize: 17, fontWeight: '800', marginTop: 14, marginBottom: 8, lineHeight: 24, letterSpacing: -0.2 },
  contentParagraph: { fontSize: 14, lineHeight: 24, fontWeight: '400', marginBottom: 8 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6, paddingLeft: 4 },
  listDot: { width: 6, height: 6, borderRadius: 3, marginTop: 9 },
  listText: { flex: 1, fontSize: 14, lineHeight: 22 },
  codeBlock: { borderRadius: 14, overflow: 'hidden', marginVertical: 10 },
  codeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.2)' },
  codeDots: { flexDirection: 'row', gap: 5 },
  codeDot: { width: 10, height: 10, borderRadius: 5 },
  codeLang: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  codeText: { fontFamily: 'monospace', fontSize: 13, color: '#E2E8F0', padding: 14, lineHeight: 22 },
  highlightBlock: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, borderLeftWidth: 3, marginVertical: 8 },
  highlightIcon: { marginTop: 1 },
  highlightText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' },
  videoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1.5, marginVertical: 8 },
  videoIconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  videoBody: { flex: 1 },
  videoTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  videoSub: { fontSize: 11, fontWeight: '500' },
  missionCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginVertical: 8, gap: 10 },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  missionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  missionBadgeText: { fontSize: 10, fontWeight: '800' },
  missionXpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  missionXpText: { fontSize: 11, fontWeight: '800', color: '#D97706' },
  missionTitle: { fontSize: 15, fontWeight: '800', lineHeight: 22 },
  storyBox: { padding: 12, borderRadius: 12, borderWidth: 1 },
  storyText: { fontSize: 13, lineHeight: 20 },
  blocksSection: { gap: 6 },
  blocksLabel: { fontSize: 11, fontWeight: '600' },
  blocksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  blockPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  blockPillText: { fontSize: 11, fontWeight: '700' },
  feedbackBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  feedbackText: { fontSize: 12, fontWeight: '600', color: '#10B981', flex: 1 },
  actionSection: { paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 16, borderWidth: 1.5 },
  completeBtnText: { fontSize: 14, fontWeight: '700', color: '#10B981' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 16 },
  completedBadgeText: { fontSize: 14, fontWeight: '700', color: '#059669' },
  quizBtn: { borderRadius: 16, overflow: 'hidden' },
  quizBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  quizBtnTitle: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  quizBtnSub: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginTop: 2 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, padding: 12, paddingBottom: 20, borderTopWidth: 1 },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16 },
  navBtnPrev: { borderWidth: 1 },
  navBtnNext: { backgroundColor: '#1C2E5A' },
  navBtnContent: { flex: 1 },
  navBtnLabel: { fontSize: 9, fontWeight: '600', marginBottom: 2 },
  navBtnTitle: { fontSize: 11, fontWeight: '700' },
  sidebarOverlay: { flex: 1, flexDirection: 'row' },
  sidebarBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebarDrawer: { width: SCREEN_WIDTH * 0.78, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  drawerHeader: { padding: 20, paddingTop: 28 },
  drawerHeaderContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  drawerCourseTitle: { fontSize: 14, fontWeight: '800', color: '#FFF', marginBottom: 10, lineHeight: 20 },
  drawerProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drawerProgressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2 },
  drawerProgressFill: { height: 4, borderRadius: 2, backgroundColor: '#34D399' },
  drawerProgressText: { fontSize: 10, fontWeight: '800', color: '#34D399' },
  drawerCloseBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  drawerScroll: { flex: 1 },
  drawerChapter: { borderBottomWidth: 1 },
  drawerChapterHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  drawerChIcon: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  drawerChTitle: { fontSize: 11, fontWeight: '800', flex: 1 },
  drawerSubItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 14, paddingVertical: 11, paddingLeft: 20, borderBottomWidth: 0.5, position: 'relative' },
  drawerSubBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  drawerSubTitle: { flex: 1, fontSize: 11, fontWeight: '500', lineHeight: 16 },
  drawerLockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'center' },
  drawerLockedText: { fontSize: 9, fontWeight: '700' },
});

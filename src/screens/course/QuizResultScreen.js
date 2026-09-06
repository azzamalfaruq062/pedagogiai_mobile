import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Animated, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

const MOCK_RESULT = {
  quizTitle: 'Quiz: Hello World & Sintaks Dasar',
  subChapterTitle: 'Hello World & Sintaks Dasar',
  courseTitle: 'Informatika & Pemrograman Dasar',
  courseGradient: ['#1C2E5A', '#2B3B8B'],
  score: 80,
  passingScore: 75,
  totalQuestions: 5,
  correctAnswers: 4,
  wrongAnswers: 1,
  unanswered: 0,
  timeTaken: '08:32',
  isPassed: true,
  attempts: 1,
  maxAttempts: 3,
  reviewItems: [
    { id: 1, question: 'Fungsi Python manakah yang digunakan untuk menampilkan teks ke layar?', type: 'multiple_choice', userAnswer: 'print()', correctAnswer: 'print()', isCorrect: true },
    { id: 2, question: 'Apa hasil dari kode: print("Halo " + "Dunia")', type: 'multiple_choice', userAnswer: 'Halo Dunia', correctAnswer: 'Halo Dunia', isCorrect: true },
    { id: 3, question: 'Python bersifat case-sensitive, sehingga "print" dan "Print" dianggap berbeda.', type: 'true_false', userAnswer: 'Benar', correctAnswer: 'Benar', isCorrect: true },
    { id: 4, question: 'Simbol komentar satu baris di Python adalah...', type: 'multiple_choice', userAnswer: '//', correctAnswer: '#', isCorrect: false },
    { id: 5, question: 'Jelaskan apa yang dimaksud dengan f-string pada Python!', type: 'essay', userAnswer: 'F-string adalah cara modern untuk menyisipkan variabel ke dalam string di Python.', correctAnswer: null, isCorrect: null },
  ],
};

export default function QuizResultScreen({ result: propResult, onBack, onRetry, onContinue }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const result = propResult || MOCK_RESULT;

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const dynamicHeroTop = safeTop + 14;
  const dynamicBottom = Math.max(insets.bottom, 20) + 32;

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 10 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(scoreAnim, { toValue: result.score, duration: 800, useNativeDriver: false }),
    ]).start();
  }, []);

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (result.score / 100) * circumference;

  const scoreColor = result.isPassed
    ? '#10B981'
    : result.score >= 60
    ? '#F59E0B'
    : '#EF4444';

  const summaryStats = [
    { icon: 'checkmark-circle', label: 'Benar', value: result.correctAnswers, color: '#10B981', bg: isDark ? 'rgba(16,185,129,0.12)' : '#DCFCE7' },
    { icon: 'close-circle', label: 'Salah', value: result.wrongAnswers, color: '#EF4444', bg: isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2' },
    { icon: 'remove-circle', label: 'Kosong', value: result.unanswered, color: isDark ? '#64748B' : '#94A3B8', bg: isDark ? theme.surfaceMuted : '#F1F5F9' },
    { icon: 'time', label: 'Waktu', value: result.timeTaken, color: theme.primary, bg: isDark ? theme.surfaceHighlight : '#EEF2FF' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: dynamicBottom }]}>

        {/* Hero Result Banner */}
        <LinearGradient colors={result.courseGradient || ['#1C2E5A', '#2B3B8B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.heroBanner, { paddingTop: dynamicHeroTop }]}>
          <View style={styles.heroBg1} />
          <View style={styles.heroBg2} />
          <View style={styles.heroBg3} />

          <View style={styles.heroContent}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={18} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.heroSubTitle}>{result.quizTitle}</Text>
            <Text style={styles.heroCourseName} numberOfLines={1}>{result.courseTitle}</Text>

            {/* Score Ring */}
            <Animated.View style={[styles.scoreRingWrap, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
              {/* SVG-like ring using border + gradient overlay */}
              <View style={[styles.scoreRingOuter, { borderColor: `${scoreColor}30` }]}>
                <View style={[styles.scoreRingInner, { backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.95)', borderColor: `${scoreColor}50` }]}>
                  <Text style={[styles.scoreNumber, { color: scoreColor }]}>{result.score}</Text>
                  <Text style={[styles.scoreUnit, { color: scoreColor }]}>/ 100</Text>
                  <View style={[styles.passFailBadge, { backgroundColor: result.isPassed ? '#10B981' : '#EF4444' }]}>
                    <Ionicons name={result.isPassed ? 'checkmark' : 'close'} size={10} color="#FFF" />
                    <Text style={styles.passFailText}>{result.isPassed ? 'LULUS' : 'TIDAK LULUS'}</Text>
                  </View>
                </View>
              </View>

              {/* Decorative arc segments */}
              <View style={[styles.arcSegment1, { backgroundColor: scoreColor, opacity: 0.7 }]} />
              <View style={[styles.arcSegment2, { backgroundColor: scoreColor, opacity: 0.4 }]} />
              <View style={[styles.arcSegment3, { backgroundColor: scoreColor, opacity: 0.2 }]} />
            </Animated.View>

            <Text style={styles.passingInfo}>Nilai minimum lulus: {result.passingScore || 70}</Text>
            <Text style={styles.attemptsInfo}>Percobaan ke-{result.attempts || 1} dari {result.maxAttempts || 3}</Text>

            {result.expAwarded > 0 && (
              <View style={styles.expBadge}>
                <Ionicons name="sparkles" size={13} color="#F59E0B" />
                <Text style={styles.expBadgeText}>+{result.expAwarded} EXP Diperoleh!</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Summary Stats */}
        <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E8EDF4' }]}>
          <View style={styles.statsGrid}>
            {summaryStats.map((item) => (
              <View key={item.label} style={[styles.statBox, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
                <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaSection}>
          {result.isPassed ? (
            <TouchableOpacity style={styles.ctaPrimary} onPress={onContinue} activeOpacity={0.88}>
              <LinearGradient colors={['#059669', '#10B981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
                <Ionicons name="arrow-forward-circle" size={20} color="#FFF" />
                <Text style={styles.ctaText}>Lanjut ke Materi Berikutnya</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            (!result.maxAttempts || (result.attempts || 1) < result.maxAttempts) && (
              <TouchableOpacity style={styles.ctaPrimary} onPress={onRetry} activeOpacity={0.88}>
                <LinearGradient colors={['#1C2E5A', '#2B3B8B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
                  <Ionicons name="refresh-circle" size={20} color="#FFF" />
                  <Text style={styles.ctaText}>Coba Lagi</Text>
                </LinearGradient>
              </TouchableOpacity>
            )
          )}
          <TouchableOpacity
            style={[styles.ctaSecondary, { borderColor: theme.border, backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC' }]}
            onPress={onBack}
            activeOpacity={0.88}
          >
            <Ionicons name="arrow-back-outline" size={18} color={theme.textSecondary} />
            <Text style={[styles.ctaSecondaryText, { color: theme.textSecondary }]}>Kembali ke Materi</Text>
          </TouchableOpacity>
        </View>

        {/* Answer Review */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewHeader}>
            <View style={[styles.reviewDot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.reviewTitle, { color: theme.textPrimary }]}>Review Jawaban</Text>
          </View>

          {(result.reviewItems || []).map((item, idx) => (
            <View
              key={item.id}
              style={[
                styles.reviewCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: item.isCorrect === true
                    ? (isDark ? 'rgba(16,185,129,0.3)' : '#BBF7D0')
                    : item.isCorrect === false
                    ? (isDark ? 'rgba(239,68,68,0.3)' : '#FECACA')
                    : (isDark ? theme.border : '#E8EDF4'),
                },
              ]}
            >
              {/* Status bar */}
              <View style={[
                styles.reviewStatusBar,
                {
                  backgroundColor: item.isCorrect === true ? '#10B981' : item.isCorrect === false ? '#EF4444' : (isDark ? '#475569' : '#94A3B8'),
                },
              ]} />

              <View style={styles.reviewCardContent}>
                {/* Q Number + Status */}
                <View style={styles.reviewQRow}>
                  <View style={[styles.reviewQNum, { backgroundColor: isDark ? theme.surfaceMuted : '#F1F5F9' }]}>
                    <Text style={[styles.reviewQNumText, { color: theme.textMuted }]}>{idx + 1}</Text>
                  </View>
                  {item.isCorrect === true && (
                    <View style={[styles.reviewStatusBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#DCFCE7' }]}>
                      <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                      <Text style={styles.reviewStatusCorrect}>Benar</Text>
                    </View>
                  )}
                  {item.isCorrect === false && (
                    <View style={[styles.reviewStatusBadge, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2' }]}>
                      <Ionicons name="close-circle" size={12} color="#EF4444" />
                      <Text style={styles.reviewStatusWrong}>Salah</Text>
                    </View>
                  )}
                  {item.isCorrect === null && (
                    <View style={[styles.reviewStatusBadge, { backgroundColor: isDark ? theme.surfaceMuted : '#F1F5F9' }]}>
                      <Ionicons name="create-outline" size={12} color={theme.textMuted} />
                      <Text style={[styles.reviewStatusEssay, { color: theme.textMuted }]}>Esai</Text>
                    </View>
                  )}
                  <View style={[styles.reviewTypeBadge, { backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC' }]}>
                    <Text style={[styles.reviewTypeText, { color: theme.textMuted }]}>
                      {item.type === 'multiple_choice' ? 'PG' : item.type === 'true_false' ? 'B/S' : 'Esai'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.reviewQuestion, { color: theme.textPrimary }]} numberOfLines={3}>{item.question}</Text>

                {/* Answer Comparison */}
                <View style={styles.reviewAnswerWrap}>
                  <View style={[styles.reviewAnswerBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : '#F0FDF4', borderColor: isDark ? 'rgba(16,185,129,0.2)' : '#BBF7D0' }]}>
                    <Text style={styles.reviewAnswerLabel}>Jawaban Kamu</Text>
                    <Text style={[styles.reviewAnswerValue, { color: item.isCorrect === false ? '#EF4444' : '#10B981' }]}>{item.userAnswer}</Text>
                  </View>
                  {item.isCorrect === false && item.correctAnswer && (
                    <View style={[styles.reviewAnswerBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#F0FDF4', borderColor: isDark ? 'rgba(16,185,129,0.25)' : '#86EFAC' }]}>
                      <Text style={styles.reviewAnswerLabel}>Jawaban Benar</Text>
                      <Text style={[styles.reviewAnswerValue, { color: '#10B981' }]}>{item.correctAnswer}</Text>
                    </View>
                  )}
                  {item.type === 'essay' && (
                    <Text style={[styles.reviewEssayNote, { color: theme.textMuted }]}>
                      Jawaban esai akan dinilai oleh guru.
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  heroBanner: { paddingTop: 20, paddingBottom: 32, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  heroBg1: { position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)' },
  heroBg2: { position: 'absolute', left: -30, bottom: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroBg3: { position: 'absolute', right: 80, top: 80, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroContent: { position: 'relative', zIndex: 2, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  heroSubTitle: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.75)', marginBottom: 4, textAlign: 'center' },
  heroCourseName: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 28, textAlign: 'center' },
  scoreRingWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 20, position: 'relative' },
  scoreRingOuter: { width: 152, height: 152, borderRadius: 76, borderWidth: 12, alignItems: 'center', justifyContent: 'center' },
  scoreRingInner: { width: 120, height: 120, borderRadius: 60, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  scoreNumber: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  scoreUnit: { fontSize: 11, fontWeight: '700', marginTop: -4 },
  passFailBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  passFailText: { fontSize: 9, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  arcSegment1: { position: 'absolute', width: 8, height: 8, borderRadius: 4, top: 8, right: 24 },
  arcSegment2: { position: 'absolute', width: 6, height: 6, borderRadius: 3, bottom: 12, left: 20 },
  arcSegment3: { position: 'absolute', width: 10, height: 10, borderRadius: 5, bottom: 20, right: 10 },
  passingInfo: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginBottom: 4 },
  attemptsInfo: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  expBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginTop: 10,
  },
  expBadgeText: { fontSize: 12, fontWeight: '800', color: '#F59E0B' },
  statsCard: { margin: 16, marginTop: 0, borderRadius: 20, borderWidth: 1, padding: 16 },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16, gap: 6 },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '600' },
  ctaSection: { paddingHorizontal: 16, gap: 10, marginBottom: 24 },
  ctaPrimary: { borderRadius: 16, overflow: 'hidden' },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  ctaText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  ctaSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 16, borderWidth: 1 },
  ctaSecondaryText: { fontSize: 14, fontWeight: '700' },
  reviewSection: { paddingHorizontal: 16, gap: 10 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  reviewDot: { width: 8, height: 8, borderRadius: 4 },
  reviewTitle: { fontSize: 15, fontWeight: '800' },
  reviewCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  reviewStatusBar: { height: 3 },
  reviewCardContent: { padding: 14, gap: 10 },
  reviewQRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewQNum: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  reviewQNumText: { fontSize: 11, fontWeight: '800' },
  reviewStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  reviewStatusCorrect: { fontSize: 10, fontWeight: '700', color: '#10B981' },
  reviewStatusWrong: { fontSize: 10, fontWeight: '700', color: '#EF4444' },
  reviewStatusEssay: { fontSize: 10, fontWeight: '700' },
  reviewTypeBadge: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  reviewTypeText: { fontSize: 9, fontWeight: '700' },
  reviewQuestion: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
  reviewAnswerWrap: { gap: 8 },
  reviewAnswerBox: { padding: 10, borderRadius: 12, borderWidth: 1 },
  reviewAnswerLabel: { fontSize: 9, fontWeight: '700', color: '#6B7280', marginBottom: 3 },
  reviewAnswerValue: { fontSize: 12, fontWeight: '700' },
  reviewEssayNote: { fontSize: 11, fontWeight: '500', fontStyle: 'italic' },
});

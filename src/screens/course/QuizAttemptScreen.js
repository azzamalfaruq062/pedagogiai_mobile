import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Animated, TextInput, Platform, StatusBar,
  Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { courseApi } from '../../api/courseApi';

const SCREEN_WIDTH = Dimensions.get('window').width;

const MOCK_QUIZ = {
  title: 'Quiz: Hello World & Sintaks Dasar',
  subChapterTitle: 'Hello World & Sintaks Dasar',
  courseTitle: 'Informatika & Pemrograman Dasar',
  courseGradient: ['#1C2E5A', '#2B3B8B'],
  durationMinutes: 15,
  questions: [
    {
      id: 1,
      type: 'multiple_choice',
      question: 'Fungsi Python manakah yang digunakan untuk menampilkan teks ke layar (output)?',
      options: [
        { id: 'a', text: 'display()' },
        { id: 'b', text: 'print()' },
        { id: 'c', text: 'output()' },
        { id: 'd', text: 'show()' },
      ],
      correctId: 'b',
    },
    {
      id: 2,
      type: 'multiple_choice',
      question: 'Apa hasil dari kode Python berikut?\n\nprint("Halo " + "Dunia")',
      options: [
        { id: 'a', text: 'Halo  Dunia' },
        { id: 'b', text: '"Halo " + "Dunia"' },
        { id: 'c', text: 'Halo Dunia' },
        { id: 'd', text: 'Error' },
      ],
      correctId: 'c',
    },
    {
      id: 3,
      type: 'true_false',
      question: 'Python bersifat case-sensitive, sehingga "print" dan "Print" dianggap berbeda.',
      options: [
        { id: 'true', text: 'Benar' },
        { id: 'false', text: 'Salah' },
      ],
      correctId: 'true',
    },
    {
      id: 4,
      type: 'multiple_choice',
      question: 'Simbol komentar satu baris di Python adalah...',
      options: [
        { id: 'a', text: '//' },
        { id: 'b', text: '/* */' },
        { id: 'c', text: '#' },
        { id: 'd', text: '--' },
      ],
      correctId: 'c',
    },
    {
      id: 5,
      type: 'essay',
      question: 'Jelaskan dengan singkat apa yang dimaksud dengan f-string pada Python dan berikan satu contoh penggunaannya!',
    },
  ],
};

function TimerDisplay({ totalSeconds, theme, isDark }) {
  const safeTotal = Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 15 * 60;
  const [remaining, setRemaining] = useState(safeTotal);
  const isUrgent = remaining <= 60;

  useEffect(() => {
    setRemaining(safeTotal);
  }, [safeTotal]);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => setRemaining((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
  const secs = (remaining % 60).toString().padStart(2, '0');

  return (
    <View style={[
      styles.timerBox,
      {
        backgroundColor: isUrgent ? (isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2') : (isDark ? theme.surfaceMuted : '#EEF2FF'),
        borderColor: isUrgent ? '#EF4444' : theme.primary,
      },
    ]}>
      <Ionicons name="timer-outline" size={14} color={isUrgent ? '#EF4444' : theme.primary} />
      <Text style={[styles.timerText, { color: isUrgent ? '#EF4444' : theme.primary }]}>
        {mins}:{secs}
      </Text>
    </View>
  );
}

export default function QuizAttemptScreen({ quiz: propQuiz, course: propCourse, subChapter: propSubChapter, onBack, onSubmit }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [quiz, setQuiz] = useState(propQuiz || MOCK_QUIZ);
  const [isLoading, setIsLoading] = useState(
    Boolean(propQuiz?.id && (!propQuiz?.questions || propQuiz.questions.length === 0))
  );
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [essayTexts, setEssayTexts] = useState({});
  const [markedDoubt, setMarkedDoubt] = useState({});
  const slideAnim = useRef(new Animated.Value(0)).current;
  const startTimeRef = useRef(Date.now());

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const dynamicTopBar = safeTop + 8;
  const dynamicBottomBar = Math.max(insets.bottom, 12) + 8;

  const loadQuiz = useCallback(async (quizId) => {
    if (!quizId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await courseApi.getQuiz(quizId);
      if (res?.success && res.data) {
        setQuiz(res.data);
        startTimeRef.current = Date.now();
      } else {
        setLoadError(res?.message || 'Gagal memuat kuis dari server.');
      }
    } catch (err) {
      console.log('Error loading quiz from API:', err?.message || err);
      setLoadError(err?.message || 'Terjadi kesalahan saat memuat soal kuis.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (propQuiz?.id && (!propQuiz.questions || propQuiz.questions.length === 0)) {
      loadQuiz(propQuiz.id);
    }
  }, [propQuiz?.id, loadQuiz]);

  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  const totalQ = questions.length;
  const currentQ = questions[currentIdx] || { question: '', options: [] };
  const answeredCount =
    Object.keys(answers).length +
    Object.values(essayTexts).filter((t) => (t || '').trim().length > 0).length;

  const goToQuestion = (idx) => {
    if (idx < 0 || idx >= totalQ) return;
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -30, duration: 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start();
    setCurrentIdx(idx);
  };

  const selectOption = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const performSubmit = async () => {
      setIsSubmitting(true);
      const elapsedSeconds = Math.max(15, Math.round((Date.now() - startTimeRef.current) / 1000));
      try {
        if (quiz?.id) {
          const res = await courseApi.submitQuiz(quiz.id, {
            answers,
            essayTexts,
            time_taken_seconds: elapsedSeconds,
          });
          if (res?.success && res.data) {
            onSubmit && onSubmit(res.data);
            return;
          }
        }
        // Fallback for mock quiz
        onSubmit && onSubmit({ answers, essayTexts, quiz });
      } catch (err) {
        Alert.alert('Gagal Mengumpulkan', err?.message || 'Terjadi kesalahan saat mengumpulkan kuis.');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (answeredCount < totalQ) {
      Alert.alert(
        'Belum Semua Terjawab',
        `Anda baru menjawab ${answeredCount} dari ${totalQ} soal. Yakin ingin mengumpulkan sekarang?`,
        [
          { text: 'Periksa Kembali', style: 'cancel' },
          { text: 'Tetap Kumpulkan', style: 'destructive', onPress: performSubmit },
        ]
      );
    } else {
      Alert.alert(
        'Konfirmasi Kuis',
        'Semua soal telah terjawab. Kumpulkan jawaban Anda sekarang?',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Kumpulkan', onPress: performSubmit },
        ]
      );
    }
  };

  // Safe duration calculation
  const totalDurationSeconds = ((quiz?.durationMinutes || quiz?.timeLimit || 15) * 60);

  // Loading state (when quiz questions are being fetched)
  if (isLoading && totalQ === 0) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: isDark ? theme.border : '#E8EDF4', paddingTop: dynamicTopBar }]}>
          <View style={styles.topBarContent}>
            <TouchableOpacity style={styles.topBackBtn} onPress={onBack} activeOpacity={0.8}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <View style={styles.topCenter}>
              <Text style={[styles.topQuizTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {quiz?.title || 'Kuis Pemahaman'}
              </Text>
              <Text style={[styles.topQuizSub, { color: theme.textMuted }]}>Menyiapkan kuis...</Text>
            </View>
          </View>
        </View>
        <View style={styles.centerLoadingWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingTitle, { color: theme.textPrimary }]}>Memuat Soal Kuis...</Text>
          <Text style={[styles.loadingSub, { color: theme.textMuted }]}>Menyiapkan lembar pengerjaan kuis interaktif</Text>
        </View>
      </View>
    );
  }

  // Empty or Error state
  if (!isLoading && totalQ === 0) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: isDark ? theme.border : '#E8EDF4', paddingTop: dynamicTopBar }]}>
          <View style={styles.topBarContent}>
            <TouchableOpacity style={styles.topBackBtn} onPress={onBack} activeOpacity={0.8}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <View style={styles.topCenter}>
              <Text style={[styles.topQuizTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {quiz?.title || 'Kuis Pemahaman'}
              </Text>
              <Text style={[styles.topQuizSub, { color: theme.textMuted }]}>Informasi Kuis</Text>
            </View>
          </View>
        </View>
        <View style={styles.centerEmptyWrap}>
          <View style={[styles.centerEmptyIcon, { backgroundColor: isDark ? theme.surfaceMuted : '#EEF2FF' }]}>
            <Ionicons name="help-circle-outline" size={38} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            {loadError ? 'Gagal Memuat Kuis' : 'Soal Kuis Belum Tersedia'}
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>
            {loadError || 'Pengajar belum menambahkan pertanyaan untuk kuis ini. Silakan kembali lagi nanti.'}
          </Text>
          <View style={styles.emptyActionsRow}>
            {loadError && propQuiz?.id && (
              <TouchableOpacity
                style={[styles.emptyRetryBtn, { backgroundColor: theme.primary }]}
                onPress={() => loadQuiz(propQuiz.id)}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={16} color="#FFF" />
                <Text style={styles.emptyRetryText}>Coba Lagi</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.emptyBackBtn, { borderColor: theme.border, backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC' }]}
              onPress={onBack}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={16} color={theme.textSecondary} />
              <Text style={[styles.emptyBackText, { color: theme.textSecondary }]}>Kembali ke Materi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const progressPct = totalQ > 0 ? ((currentIdx + 1) / totalQ) * 100 : 0;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>

      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: isDark ? theme.border : '#E8EDF4', paddingTop: dynamicTopBar }]}>
        {/* Progress line */}
        <View style={[styles.topProgress, { backgroundColor: isDark ? theme.border : '#E8EDF4' }]}>
          <Animated.View style={[styles.topProgressFill, { width: `${progressPct}%`, backgroundColor: theme.primary }]} />
        </View>

        <View style={styles.topBarContent}>
          <TouchableOpacity style={styles.topBackBtn} onPress={onBack} activeOpacity={0.8}>
            <Ionicons name="close" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Text style={[styles.topQuizTitle, { color: theme.textPrimary }]} numberOfLines={1}>{quiz.title}</Text>
            <Text style={[styles.topQuizSub, { color: theme.textMuted }]}>Soal {currentIdx + 1} dari {totalQ}</Text>
          </View>

          <TimerDisplay totalSeconds={totalDurationSeconds} theme={theme} isDark={isDark} />
        </View>
      </View>

      {/* Question Number Dots */}
      <View style={[styles.qDotBar, { backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC', borderBottomColor: isDark ? theme.border : '#F1F5F9' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qDotScroll}>
          {questions.map((q, idx) => {
            const isActive = idx === currentIdx;
            const isAnswered = answers[q.id] || (essayTexts[q.id]?.trim());
            return (
              <TouchableOpacity
                key={q.id || idx}
                onPress={() => goToQuestion(idx)}
                activeOpacity={0.8}
                style={[
                  styles.qDot,
                  {
                    backgroundColor: isActive
                      ? theme.primary
                      : isAnswered
                      ? (isDark ? 'rgba(16,185,129,0.25)' : '#DCFCE7')
                      : (isDark ? theme.border : '#E8EDF4'),
                    borderColor: isActive ? theme.primary : isAnswered ? '#10B981' : (isDark ? theme.border : '#D1D5DB'),
                  },
                ]}
              >
                {isAnswered && !isActive ? (
                  <Ionicons name="checkmark" size={10} color="#10B981" />
                ) : (
                  <Text style={[styles.qDotText, { color: isActive ? '#FFF' : theme.textMuted }]}>{idx + 1}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={[styles.answerCountBadge, { backgroundColor: isDark ? theme.surfaceHighlight : '#EEF2FF' }]}>
          <Text style={[styles.answerCountText, { color: theme.primary }]}>{answeredCount}/{totalQ}</Text>
        </View>
      </View>

      {/* Question Card */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[{ transform: [{ translateX: slideAnim }] }]}>
          <View style={[styles.questionCard, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E8EDF4' }]}>
            {/* Question Number Badge */}
            <View style={styles.qNumRow}>
              <LinearGradient colors={['#1C2E5A', '#2B3B8B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.qNumBadge}>
                <Text style={styles.qNumText}>Soal {currentIdx + 1}</Text>
              </LinearGradient>
              <View style={[styles.qTypeBadge, { backgroundColor: isDark ? theme.surfaceMuted : '#F1F5F9' }]}>
                <Text style={[styles.qTypeText, { color: theme.textMuted }]}>
                  {currentQ.type === 'multiple_choice' ? 'Pilihan Ganda' : currentQ.type === 'true_false' ? 'Benar/Salah' : 'Esai'}
                </Text>
              </View>
            </View>

            {/* Question Text */}
            <Text style={[styles.questionText, { color: theme.textPrimary }]}>{currentQ.question}</Text>

            {/* Options */}
            {(currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') && (
              <View style={styles.optionsWrap}>
                {(currentQ.options || []).map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => selectOption(currentQ.id, opt.id)}
                      activeOpacity={0.85}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(79,70,229,0.15)' : '#EEF2FF')
                            : (isDark ? theme.surfaceMuted : '#FAFAFA'),
                          borderColor: isSelected ? theme.primary : (isDark ? theme.border : '#E2E8F0'),
                          shadowColor: isSelected ? theme.primary : 'transparent',
                        },
                      ]}
                    >
                      {/* Radio Circle */}
                      <View style={[
                        styles.radioOuter,
                        { borderColor: isSelected ? theme.primary : (isDark ? '#475569' : '#CBD5E1') },
                        isSelected && { backgroundColor: theme.primary },
                      ]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>

                      {/* Option Letter Badge */}
                      <View style={[
                        styles.optLetterBadge,
                        { backgroundColor: isSelected ? theme.primary : (isDark ? theme.border : '#E8EDF4') },
                      ]}>
                        <Text style={[styles.optLetterText, { color: isSelected ? '#FFF' : theme.textMuted }]}>
                          {String(opt.label || opt.id).toUpperCase()}
                        </Text>
                      </View>

                      <Text style={[styles.optionText, { color: isSelected ? theme.textPrimary : theme.textSecondary, fontWeight: isSelected ? '700' : '500' }]}>
                        {opt.text || opt.value || opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Essay */}
            {currentQ.type === 'essay' && (
              <View style={styles.essayWrap}>
                <TextInput
                  style={[styles.essayInput, { backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC', borderColor: isDark ? theme.border : '#E2E8F0', color: theme.textPrimary }]}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  placeholder="Tuliskan jawaban Anda di sini..."
                  placeholderTextColor={theme.textMuted}
                  value={essayTexts[currentQ.id] || ''}
                  onChangeText={(t) => setEssayTexts((prev) => ({ ...prev, [currentQ.id]: t }))}
                />
                <Text style={[styles.essayWordCount, { color: theme.textMuted }]}>
                  {(essayTexts[currentQ.id] || '').split(' ').filter(Boolean).length} kata
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: isDark ? theme.border : '#E8EDF4', paddingBottom: dynamicBottomBar }]}>
        <TouchableOpacity
          style={[styles.navBtn, { borderColor: theme.border, backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC', opacity: currentIdx === 0 ? 0.4 : 1 }]}
          onPress={() => currentIdx > 0 && goToQuestion(currentIdx - 1)}
          activeOpacity={0.8}
          disabled={currentIdx === 0}
        >
          <Ionicons name="chevron-back" size={18} color={theme.textSecondary} />
          <Text style={[styles.navBtnText, { color: theme.textSecondary }]}>Prev</Text>
        </TouchableOpacity>

        {currentIdx < totalQ - 1 ? (
          <TouchableOpacity
            style={styles.navBtnNext}
            onPress={() => goToQuestion(currentIdx + 1)}
            activeOpacity={0.88}
          >
            <Text style={styles.navBtnNextText}>Berikutnya</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.88}
          >
            <LinearGradient colors={['#1C2E5A', '#2B3B8B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnGrad}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#FFF" />
                  <Text style={styles.submitBtnText}>Kumpulkan Jawaban</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { borderBottomWidth: 1, zIndex: 10 },
  topProgress: { height: 3 },
  topProgressFill: { height: 3 },
  topBarContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  topBackBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1 },
  topQuizTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  topQuizSub: { fontSize: 10, fontWeight: '500' },
  timerBox: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  timerText: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  qDotBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  qDotScroll: { gap: 7, paddingRight: 8 },
  qDot: { width: 28, height: 28, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qDotText: { fontSize: 10, fontWeight: '700' },
  answerCountBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  answerCountText: { fontSize: 11, fontWeight: '800' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  questionCard: { borderRadius: 20, borderWidth: 1, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  qNumRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  qNumBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  qNumText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  qTypeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  qTypeText: { fontSize: 10, fontWeight: '600' },
  questionText: { fontSize: 15, fontWeight: '700', lineHeight: 24, marginBottom: 20, letterSpacing: -0.2 },
  optionsWrap: { gap: 10 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
  optLetterBadge: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optLetterText: { fontSize: 12, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 13, lineHeight: 20 },
  essayWrap: { gap: 8 },
  essayInput: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, lineHeight: 22, minHeight: 160 },
  essayWordCount: { fontSize: 11, fontWeight: '500', textAlign: 'right' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, padding: 12, paddingBottom: 22, borderTopWidth: 1 },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1 },
  navBtnText: { fontSize: 13, fontWeight: '700' },
  navBtnNext: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1C2E5A', borderRadius: 14, paddingVertical: 13 },
  navBtnNextText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  submitBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  submitBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  // Loading & Empty States
  centerLoadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingTitle: { fontSize: 16, fontWeight: '800', marginTop: 16, marginBottom: 6 },
  loadingSub: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  centerEmptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerEmptyIcon: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 12, fontWeight: '500', textAlign: 'center', lineHeight: 18, marginBottom: 20, maxWidth: 280 },
  emptyActionsRow: { flexDirection: 'column', gap: 10, width: '100%', maxWidth: 260 },
  emptyRetryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  emptyRetryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  emptyBackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  emptyBackText: { fontSize: 13, fontWeight: '600' },
});

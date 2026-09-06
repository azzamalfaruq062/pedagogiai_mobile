import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { ekskulApi } from '../../api/ekskulApi';

const SCREEN_WIDTH = Dimensions.get('window').width;

const CATEGORY_COLORS = {
  akademik: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE', icon: 'school-outline' },
  seni: { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF', icon: 'color-palette-outline' },
  olahraga: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: 'football-outline' },
  teknologi: { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD', icon: 'hardware-chip-outline' },
  sosial: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', icon: 'people-outline' },
  lainnya: { bg: '#F8FAFC', text: '#334155', border: '#E2E8F0', icon: 'ribbon-outline' },
};

const ATTENDANCE_STATUSES = [
  { key: 'hadir', code: 'H', label: 'Hadir', activeBg: '#10B981', activeText: '#FFFFFF' },
  { key: 'izin', code: 'I', label: 'Izin', activeBg: '#F59E0B', activeText: '#FFFFFF' },
  { key: 'sakit', code: 'S', label: 'Sakit', activeBg: '#0284C7', activeText: '#FFFFFF' },
  { key: 'alpha', code: 'A', label: 'Alpa', activeBg: '#F43F5E', activeText: '#FFFFFF' },
];

export default function EkskulAttendanceScreen({ onBack, schedule }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const ekskulId = schedule?.ekskulId || schedule?.id || 9;

  // Active Tab: 0 = Presensi & Sesi, 1 = Riwayat, 2 = Matriks
  const [activeTab, setActiveTab] = useState(0);

  // Data states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ekskulData, setEkskulData] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [matrixData, setMatrixData] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');

  // Phase 1 form states
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionAchievementNotes, setSessionAchievementNotes] = useState('');
  const [attendances, setAttendances] = useState({}); // { [studentId]: 'hadir' | 'izin' | 'sakit' | 'alpha' }

  // Phase 2 finish form states
  const [finishDescription, setFinishDescription] = useState('');
  const [finishAchievementNotes, setFinishAchievementNotes] = useState('');

  // Live timer for active session
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await ekskulApi.getEkskulDetail(ekskulId);
      if (res?.success && res.data) {
        const d = res.data;
        setEkskulData(d.ekskul);
        setActiveSession(d.activeSession);
        setStudents(d.students || []);
        setActivities(d.activities || []);
        setMatrixData(d.matrix || null);

        // Populate attendances dictionary with default 'hadir' or existing session
        const initialAtt = {};
        if (d.students) {
          d.students.forEach((st) => {
            initialAtt[st.studentId] = st.status || 'hadir';
          });
        }
        setAttendances(initialAtt);

        // Pre-fill finish form if session is active
        if (d.activeSession) {
          setFinishDescription(d.activeSession.description || '');
          setFinishAchievementNotes(d.activeSession.achievementNotes || '');

          // Calculate initial elapsed time
          const startTime = d.activeSession.startTime;
          if (startTime) {
            const [sh, sm] = startTime.split(':').map(Number);
            const now = new Date();
            const startToday = new Date();
            startToday.setHours(sh, sm, 0, 0);
            const diffSec = Math.max(0, Math.floor((now - startToday) / 1000));
            setElapsedSeconds(diffSec);
          }
        }
      }
    } catch (err) {
      console.log('Error fetching ekskul detail:', err);
      Alert.alert('Gagal Memuat Data', 'Tidak dapat memuat detail absensi ekskul.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [ekskulId]);

  // Live timer interval
  useEffect(() => {
    if (activeSession) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  const formattedElapsedTime = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [elapsedSeconds]);

  // Handle setting all students to a specific status
  const handleSetAllStatus = (status) => {
    const updated = { ...attendances };
    students.forEach((st) => {
      updated[st.studentId] = status;
    });
    setAttendances(updated);
  };

  // Handle toggle single student status
  const handleSetStudentStatus = (studentId, status) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Phase 1: Start Meeting & Attendance
  const handleStartSession = async () => {
    if (!sessionTitle.trim()) {
      Alert.alert('Topik Wajib Diisi', 'Silakan masukkan judul agenda atau topik pertemuan.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: sessionTitle.trim(),
        description: sessionDescription.trim() || null,
        achievement_notes: sessionAchievementNotes.trim() || null,
        attendances,
      };

      const res = await ekskulApi.startSession(ekskulId, payload);
      if (res?.success) {
        Alert.alert('Sesi Dimulai', res.message || 'Sesi pertemuan ekskul berhasil dimulai.');
        await fetchDetail();
      } else {
        Alert.alert('Gagal', res?.message || 'Gagal memulai pertemuan ekskul.');
      }
    } catch (err) {
      console.log('Error starting session:', err);
      Alert.alert('Kesalahan', 'Terjadi gangguan saat memulai sesi pertemuan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Phase 2: Finish Session
  const handleFinishSession = async () => {
    if (!activeSession?.id) return;

    Alert.alert(
      'Selesaikan Pertemuan?',
      'Sistem akan otomatis mencatat jam selesai sekarang dan menutup sesi pertemuan ekskul ini.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Selesaikan',
          style: 'default',
          onPress: async () => {
            setSubmitting(true);
            try {
              const payload = {
                description: finishDescription.trim() || null,
                achievement_notes: finishAchievementNotes.trim() || null,
              };

              const res = await ekskulApi.finishSession(activeSession.id, payload);
              if (res?.success) {
                Alert.alert('Sesi Selesai', res.message || 'Sesi mengajar ekskul telah ditutup.');
                await fetchDetail();
              } else {
                Alert.alert('Gagal', res?.message || 'Gagal menutup sesi.');
              }
            } catch (err) {
              console.log('Error finishing session:', err);
              Alert.alert('Kesalahan', 'Terjadi gangguan saat menutup sesi.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // Filter students for search
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q)) ||
        (s.classroom && s.classroom.toLowerCase().includes(q))
    );
  }, [students, studentSearch]);

  const catStyle = CATEGORY_COLORS[ekskulData?.category] || CATEGORY_COLORS.lainnya;

  const todayDateFormatted = useMemo(() => {
    const d = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }, []);

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* TOP HEADER */}
      <View style={[styles.headerContainer, { paddingTop: safeTop, backgroundColor: theme.surface }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitles}>
            <Text style={[styles.headerCategory, { color: catStyle.text }]}>
              {ekskulData?.categoryLabel || 'Ekstrakurikuler'}
            </Text>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {ekskulData?.name || schedule?.subject || 'Detail Absensi Ekskul'}
            </Text>
          </View>

          <View style={[styles.roleBadge, { backgroundColor: catStyle.bg, borderColor: catStyle.border }]}>
            <Text style={[styles.roleBadgeText, { color: catStyle.text }]}>
              {ekskulData?.role || 'Pembina'}
            </Text>
          </View>
        </View>

        {/* TABS NAVIGATION */}
        <View style={[styles.tabBar, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 0 && styles.tabItemActive]}
            onPress={() => setActiveTab(0)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContentWrap}>
              {activeSession && <View style={styles.tabActivePulse} />}
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 0 ? '#4F46E5' : theme.textMuted },
                  activeTab === 0 && styles.tabTextActive,
                ]}
              >
                {activeSession ? 'Sesi Aktif' : 'Presensi & Jurnal'}
              </Text>
            </View>
            {activeTab === 0 && <View style={styles.tabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 1 && styles.tabItemActive]}
            onPress={() => setActiveTab(1)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 1 ? '#4F46E5' : theme.textMuted },
                activeTab === 1 && styles.tabTextActive,
              ]}
            >
              Riwayat ({activities.length})
            </Text>
            {activeTab === 1 && <View style={styles.tabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 2 && styles.tabItemActive]}
            onPress={() => setActiveTab(2)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 2 ? '#4F46E5' : theme.textMuted },
                activeTab === 2 && styles.tabTextActive,
              ]}
            >
              Matriks Presensi
            </Text>
            {activeTab === 2 && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT BODY */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            Memuat data ekskul...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* TAB 0: PRESENSI & JURNAL (2-PHASE WORKFLOW) */}
          {activeTab === 0 && (
            <View style={styles.tabContent}>
              {/* EKSKUL INFO BANNER */}
              <View
                style={[
                  styles.infoBanner,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.infoBannerRow}>
                  <View style={[styles.infoIconWrap, { backgroundColor: catStyle.bg }]}>
                    <Ionicons name={catStyle.icon} size={22} color={catStyle.text} />
                  </View>
                  <View style={styles.infoBannerMeta}>
                    <Text style={[styles.infoBannerSchedule, { color: theme.textPrimary }]}>
                      {ekskulData?.scheduleDay || 'Hari Rutin'} • {ekskulData?.scheduleTime || 'Waktu Rutin'} WIB
                    </Text>
                    <Text style={[styles.infoBannerRoom, { color: theme.textMuted }]}>
                      Ruang: {ekskulData?.meetingRoom || 'Ruang Ekskul'} • {students.length} Anggota Aktif
                    </Text>
                  </View>
                </View>
              </View>

              {activeSession ? (
                /* ========================================================================= */
                /* FASE 2: SESI MENGAJAR SEDANG BERLANGSUNG                                  */
                /* ========================================================================= */
                <View style={styles.phase2Container}>
                  <LinearGradient
                    colors={['#ECFDF5', '#F0FDF4', isDark ? '#064E3B' : '#DCFCE7']}
                    style={styles.activeSessionGradient}
                  >
                    <View style={styles.activeSessionHeader}>
                      <View style={styles.activeSessionBadge}>
                        <View style={styles.pulsingDot} />
                        <Text style={styles.activeSessionBadgeText}>
                          Fase 2: Sesi Mengajar Sedang Berlangsung
                        </Text>
                      </View>
                      <Text style={styles.activeSessionDate}>{todayDateFormatted}</Text>
                    </View>

                    <Text style={styles.activeSessionTitle}>{activeSession.title}</Text>

                    {/* LIVE DURATION COUNTER */}
                    <View style={styles.timerCard}>
                      <View style={styles.timerBlock}>
                        <Text style={styles.timerLabel}>Jam Mulai</Text>
                        <Text style={styles.timerValue}>{activeSession.startTime} WIB</Text>
                      </View>
                      <View style={styles.timerDivider} />
                      <View style={styles.timerBlock}>
                        <Text style={styles.timerLabel}>Durasi Mengajar</Text>
                        <Text style={styles.timerElapsed}>{formattedElapsedTime}</Text>
                      </View>
                      <View style={styles.timerDivider} />
                      <View style={styles.timerBlock}>
                        <Text style={styles.timerLabel}>Kehadiran</Text>
                        <Text style={styles.timerPresent}>{activeSession.attendanceCount} Hadir</Text>
                      </View>
                    </View>

                    {/* DESKRIPSI & CATATAN */}
                    <View style={styles.activeSessionDetailsCard}>
                      <Text style={styles.activeSessionDetailLabel}>Ringkasan Aktivitas</Text>
                      <Text style={styles.activeSessionDetailText}>
                        {activeSession.description || 'Belum ada ringkasan aktivitas.'}
                      </Text>

                      {activeSession.achievementNotes ? (
                        <View style={styles.activeSessionNotesWrap}>
                          <Text style={styles.activeSessionNotesTitle}>Catatan Kemajuan / Prestasi:</Text>
                          <Text style={styles.activeSessionNotesText}>{activeSession.achievementNotes}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* AUTO 1-HOUR NOTICE */}
                    <View style={styles.noticeBox}>
                      <Ionicons name="time-outline" size={18} color="#0369A1" />
                      <Text style={styles.noticeText}>
                        Maksimal Sesi 1 Jam: Tekan tombol Selesai Mengajar saat kelas usai. Sistem akan otomatis menyelesaikan sesi jika melewati 60 menit.
                      </Text>
                    </View>

                    {/* FORM FASE 2: SELESAIKAN MENGAJAR */}
                    <View style={styles.finishFormWrap}>
                      <Text style={styles.finishFormTitle}>Tutup Sesi & Selesaikan Mengajar</Text>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Update Catatan Materi (Opsional)</Text>
                        <TextInput
                          style={styles.multilineInput}
                          value={finishDescription}
                          onChangeText={setFinishDescription}
                          placeholder="Tambahkan catatan materi tambahan jika ada..."
                          placeholderTextColor="#94A3B8"
                          multiline
                          numberOfLines={2}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Update Catatan Kemajuan (Opsional)</Text>
                        <TextInput
                          style={styles.multilineInput}
                          value={finishAchievementNotes}
                          onChangeText={setFinishAchievementNotes}
                          placeholder="Catatan prestasi, perkembangan keterampilan, dll..."
                          placeholderTextColor="#94A3B8"
                          multiline
                          numberOfLines={2}
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.finishButton}
                        onPress={handleFinishSession}
                        disabled={submitting}
                        activeOpacity={0.8}
                      >
                        {submitting ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                            <Text style={styles.finishButtonText}>
                              Selesai Mengajar (Otomatis Catat Jam Selesai)
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              ) : (
                /* ========================================================================= */
                /* FASE 1: FORM INPUT JURNAL & PRESENSI ANGGOTA                             */
                /* ========================================================================= */
                <View style={styles.phase1Container}>
                  {/* PHASE 1 HEADER */}
                  <View
                    style={[
                      styles.sectionCard,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View style={styles.phaseBadgeRow}>
                      <View style={styles.phase1Badge}>
                        <Text style={styles.phase1BadgeText}>Fase 1 dari 2</Text>
                      </View>
                      <Text style={[styles.phaseDateText, { color: theme.textMuted }]}>
                        {todayDateFormatted}
                      </Text>
                    </View>

                    <Text style={[styles.phase1Title, { color: theme.textPrimary }]}>
                      Form Log Pertemuan & Presensi Anggota
                    </Text>
                    <Text style={[styles.phase1Subtitle, { color: theme.textMuted }]}>
                      Isi topik materi & absensi siswa, lalu tekan Mulai Pertemuan & Simpan Presensi untuk mengaktifkan sesi.
                    </Text>

                    {/* MEETING TIME INFO CHIPS */}
                    <View style={styles.timeChipsRow}>
                      <View style={[styles.timeChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}>
                        <Text style={styles.timeChipLabel}>Tanggal</Text>
                        <Text style={[styles.timeChipVal, { color: theme.textPrimary }]}>Hari Ini</Text>
                      </View>
                      <View style={[styles.timeChip, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={[styles.timeChipLabel, { color: '#047857' }]}>Jam Mulai</Text>
                        <Text style={[styles.timeChipVal, { color: '#065F46' }]}>Otomatis Saat Klik</Text>
                      </View>
                      <View style={[styles.timeChip, { backgroundColor: '#FFFBEB' }]}>
                        <Text style={[styles.timeChipLabel, { color: '#B45309' }]}>Jam Selesai</Text>
                        <Text style={[styles.timeChipVal, { color: '#92400E' }]}>Fase 2 (Maks 1 Jam)</Text>
                      </View>
                    </View>

                    {/* INPUT AGENDA TITLE */}
                    <View style={styles.inputField}>
                      <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                        Judul Agenda / Topik Pertemuan <Text style={styles.requiredAsterisk}>*</Text>
                      </Text>
                      <TextInput
                        style={[
                          styles.singleInput,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                            borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#CBD5E1',
                            color: theme.textPrimary,
                          },
                        ]}
                        value={sessionTitle}
                        onChangeText={setSessionTitle}
                        placeholder="Contoh: Latihan Dasar Pertolongan Pertama / PBB"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>

                    {/* INPUT RINGKASAN MATERI */}
                    <View style={styles.inputField}>
                      <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                        Catatan Materi / Ringkasan Aktivitas
                      </Text>
                      <TextInput
                        style={[
                          styles.multilineInput,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                            borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#CBD5E1',
                            color: theme.textPrimary,
                          },
                        ]}
                        value={sessionDescription}
                        onChangeText={setSessionDescription}
                        placeholder="Tuliskan ringkasan materi atau aktivitas yang akan dilaksanakan..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={3}
                      />
                    </View>

                    {/* INPUT CATATAN PROGRESS */}
                    <View style={styles.inputField}>
                      <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                        Catatan Pencapaian & Kemajuan (Opsional)
                      </Text>
                      <TextInput
                        style={[
                          styles.multilineInput,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                            borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#CBD5E1',
                            color: theme.textPrimary,
                          },
                        ]}
                        value={sessionAchievementNotes}
                        onChangeText={setSessionAchievementNotes}
                        placeholder="Catatan kemajuan khusus anggota atau rekomendasi..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                  </View>

                  {/* STUDENT ATTENDANCE SECTION */}
                  <View
                    style={[
                      styles.sectionCard,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View style={styles.studentListHeader}>
                      <View>
                        <Text style={[styles.studentListTitle, { color: theme.textPrimary }]}>
                          DAFTAR KEHADIRAN ANGGOTA ({students.length})
                        </Text>
                        <Text style={[styles.studentListSubtitle, { color: theme.textMuted }]}>
                          Ketuk status (H / I / S / A) untuk setiap anggota
                        </Text>
                      </View>

                      {/* QUICK SET ALL HADIR */}
                      <TouchableOpacity
                        style={styles.setAllHadirBtn}
                        onPress={() => handleSetAllStatus('hadir')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark-done" size={14} color="#047857" />
                        <Text style={styles.setAllHadirBtnText}>Semua Hadir</Text>
                      </TouchableOpacity>
                    </View>

                    {/* SEARCH INPUT IF MANY STUDENTS */}
                    {students.length > 5 && (
                      <View
                        style={[
                          styles.searchBar,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                          },
                        ]}
                      >
                        <Ionicons name="search" size={16} color={theme.textMuted} />
                        <TextInput
                          style={[styles.searchInput, { color: theme.textPrimary }]}
                          value={studentSearch}
                          onChangeText={setStudentSearch}
                          placeholder="Cari anggota berdasarkan nama / NISN..."
                          placeholderTextColor="#94A3B8"
                        />
                        {studentSearch ? (
                          <TouchableOpacity onPress={() => setStudentSearch('')}>
                            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    )}

                    {/* STUDENT ROWS */}
                    {filteredStudents.length === 0 ? (
                      <View style={styles.emptyStudentsBox}>
                        <Text style={[styles.emptyStudentsText, { color: theme.textMuted }]}>
                          Tidak ada anggota siswa yang ditemukan.
                        </Text>
                      </View>
                    ) : (
                      filteredStudents.map((stu, index) => {
                        const currentStatus = attendances[stu.studentId] || 'hadir';

                        return (
                          <View
                            key={stu.studentId}
                            style={[
                              styles.studentRow,
                              {
                                borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                              },
                            ]}
                          >
                            <View style={styles.studentInfoLeft}>
                              <View style={styles.studentAvatarWrap}>
                                <Text style={styles.studentAvatarText}>{stu.initials}</Text>
                              </View>
                              <View style={styles.studentMeta}>
                                <Text style={[styles.studentName, { color: theme.textPrimary }]} numberOfLines={1}>
                                  {stu.name}
                                </Text>
                                <Text style={[styles.studentSub, { color: theme.textMuted }]}>
                                  {stu.classroom || 'Anggota'} • NISN: {stu.nisn || '-'}
                                </Text>
                              </View>
                            </View>

                            {/* ATTENDANCE TOGGLE BUTTONS (H, I, S, A) */}
                            <View style={styles.statusButtonsGroup}>
                              {ATTENDANCE_STATUSES.map((st) => {
                                const isSelected = currentStatus === st.key;
                                return (
                                  <TouchableOpacity
                                    key={st.key}
                                    style={[
                                      styles.statusBadgeBtn,
                                      isSelected
                                        ? { backgroundColor: st.activeBg, borderColor: st.activeBg }
                                        : {
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                                          },
                                    ]}
                                    onPress={() => handleSetStudentStatus(stu.studentId, st.key)}
                                    activeOpacity={0.7}
                                  >
                                    <Text
                                      style={[
                                        styles.statusBadgeText,
                                        {
                                          color: isSelected ? '#FFFFFF' : isDark ? '#94A3B8' : '#475569',
                                          fontWeight: isSelected ? '800' : '600',
                                        },
                                      ]}
                                    >
                                      {st.code}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>

                  {/* SUBMIT BUTTON */}
                  <TouchableOpacity
                    style={styles.startSessionBtn}
                    onPress={handleStartSession}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="play" size={18} color="#FFFFFF" />
                        <Text style={styles.startSessionBtnText}>
                          Mulai Pertemuan & Simpan Presensi
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* TAB 1: RIWAYAT PERTEMUAN */}
          {activeTab === 1 && (
            <View style={styles.tabContent}>
              <View style={styles.tabHeaderRow}>
                <Text style={[styles.tabHeaderTitle, { color: theme.textPrimary }]}>
                  Log Pertemuan Sebelumnya ({activities.length})
                </Text>
                <Text style={[styles.tabHeaderSubtitle, { color: theme.textMuted }]}>
                  Daftar sesi pertemuan ekskul yang telah dilaksanakan
                </Text>
              </View>

              {activities.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="calendar-outline" size={40} color={theme.textMuted} />
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    Belum ada riwayat pertemuan ekskul.
                  </Text>
                </View>
              ) : (
                activities.map((act) => (
                  <View
                    key={act.id}
                    style={[
                      styles.activityCard,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View style={styles.activityCardHeader}>
                      <View>
                        <Text style={[styles.activityDate, { color: theme.textMuted }]}>
                          {act.activityDateFormatted}
                        </Text>
                        <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>
                          {act.title}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.activityDoneBadge,
                          act.isCompleted ? styles.badgeSuccess : styles.badgeOngoing,
                        ]}
                      >
                        <Text
                          style={[
                            styles.activityDoneBadgeText,
                            act.isCompleted ? styles.textSuccess : styles.textOngoing,
                          ]}
                        >
                          {act.isCompleted ? 'Selesai' : 'Aktif'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.activityMetaRow}>
                      <View style={styles.activityMetaItem}>
                        <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                        <Text style={[styles.activityMetaText, { color: theme.textMuted }]}>
                          {act.timeRange}
                        </Text>
                      </View>
                      <View style={styles.activityMetaItem}>
                        <Ionicons name="people-outline" size={13} color="#047857" />
                        <Text style={[styles.activityMetaText, { color: '#047857', fontWeight: '700' }]}>
                          {act.attendanceCount} Siswa Hadir
                        </Text>
                      </View>
                    </View>

                    {act.description ? (
                      <Text style={[styles.activityDesc, { color: theme.textPrimary }]} numberOfLines={3}>
                        {act.description}
                      </Text>
                    ) : null}

                    {act.achievementNotes ? (
                      <View style={styles.activityAchievementBox}>
                        <Text style={styles.activityAchievementTitle}>Catatan Kemajuan:</Text>
                        <Text style={styles.activityAchievementText}>{act.achievementNotes}</Text>
                      </View>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 2: MATRIKS PRESENSI */}
          {activeTab === 2 && (
            <View style={styles.tabContent}>
              <View style={styles.tabHeaderRow}>
                <Text style={[styles.tabHeaderTitle, { color: theme.textPrimary }]}>
                  Rekapitulasi Presensi Matriks
                </Text>
                <Text style={[styles.tabHeaderSubtitle, { color: theme.textMuted }]}>
                  Statistik kehadiran akumulatif seluruh anggota di setiap sesi
                </Text>
              </View>

              {/* STATS OVERVIEW CARDS */}
              <View style={styles.statsOverviewRow}>
                <View
                  style={[
                    styles.statOverviewCard,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.statOverviewValue, { color: '#4F46E5' }]}>
                    {matrixData?.totalMeetings ?? activities.length}
                  </Text>
                  <Text style={[styles.statOverviewLabel, { color: theme.textMuted }]}>Total Pertemuan</Text>
                </View>

                <View
                  style={[
                    styles.statOverviewCard,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.statOverviewValue, { color: '#047857' }]}>
                    {matrixData?.avgAttendance ?? 0}%
                  </Text>
                  <Text style={[styles.statOverviewLabel, { color: theme.textMuted }]}>Rata-rata Hadir</Text>
                </View>

                <View
                  style={[
                    styles.statOverviewCard,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.statOverviewValue, { color: '#D97706' }]}>
                    {matrixData?.perfectAttendanceCount ?? 0}
                  </Text>
                  <Text style={[styles.statOverviewLabel, { color: theme.textMuted }]}>Hadir 100%</Text>
                </View>
              </View>

              {/* MATRIX STUDENT BREAKDOWN */}
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                  },
                ]}
              >
                <Text style={[styles.matrixListTitle, { color: theme.textPrimary }]}>
                  RINCIAN PER SISWA
                </Text>

                {(!matrixData?.students || matrixData.students.length === 0) ? (
                  <View style={styles.emptyStudentsBox}>
                    <Text style={[styles.emptyStudentsText, { color: theme.textMuted }]}>
                      Belum ada data matriks presensi.
                    </Text>
                  </View>
                ) : (
                  matrixData.students.map((st) => (
                    <View
                      key={st.id}
                      style={[
                        styles.matrixStudentRow,
                        { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
                      ]}
                    >
                      <View style={styles.studentInfoLeft}>
                        <View style={styles.studentAvatarWrap}>
                          <Text style={styles.studentAvatarText}>{st.initials}</Text>
                        </View>
                        <View style={styles.studentMeta}>
                          <Text style={[styles.studentName, { color: theme.textPrimary }]} numberOfLines={1}>
                            {st.name}
                          </Text>
                          <Text style={[styles.studentSub, { color: theme.textMuted }]}>
                            {st.classroom || 'Anggota'} • NISN: {st.nisn || '-'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.matrixCountsRow}>
                        <View style={styles.matrixBadgeH}><Text style={styles.matrixBadgeTextH}>{st.h}H</Text></View>
                        <View style={styles.matrixBadgeI}><Text style={styles.matrixBadgeTextI}>{st.i}I</Text></View>
                        <View style={styles.matrixBadgeS}><Text style={styles.matrixBadgeTextS}>{st.s}S</Text></View>
                        <View style={styles.matrixBadgeA}><Text style={styles.matrixBadgeTextA}>{st.a}A</Text></View>
                        <View style={[styles.matrixPctBadge, st.pct >= 80 ? styles.pctHigh : styles.pctLow]}>
                          <Text style={[styles.matrixPctText, st.pct >= 80 ? styles.pctTextHigh : styles.pctTextLow]}>
                            {st.pct}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  headerCategory: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabItemActive: {},
  tabContentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabActivePulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#4F46E5',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  tabContent: {
    gap: 16,
  },
  infoBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  infoBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerMeta: {
    flex: 1,
  },
  infoBannerSchedule: {
    fontSize: 13,
    fontWeight: '800',
  },
  infoBannerRoom: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  /* PHASE 2 ACTIVE SESSION */
  phase2Container: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  activeSessionGradient: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    gap: 14,
  },
  activeSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeSessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  activeSessionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  activeSessionDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  activeSessionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timerBlock: {
    flex: 1,
    alignItems: 'center',
  },
  timerDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  timerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  timerValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4338CA',
    marginTop: 2,
  },
  timerElapsed: {
    fontSize: 13,
    fontWeight: '900',
    color: '#047857',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  timerPresent: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  activeSessionDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  activeSessionDetailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  activeSessionDetailText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
    lineHeight: 18,
  },
  activeSessionNotesWrap: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  activeSessionNotesTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  activeSessionNotesText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#78350F',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: '#0369A1',
    lineHeight: 16,
  },
  finishFormWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  finishFormTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  multilineInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    textAlignVertical: 'top',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#10B981',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  /* PHASE 1 FORM */
  phase1Container: {
    gap: 16,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  phaseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phase1Badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  phase1BadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338CA',
    textTransform: 'uppercase',
  },
  phaseDateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  phase1Title: {
    fontSize: 15,
    fontWeight: '800',
  },
  phase1Subtitle: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  timeChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeChip: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  timeChipLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  timeChipVal: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  inputField: {
    gap: 4,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  requiredAsterisk: {
    color: '#EF4444',
  },
  singleInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  /* STUDENT LIST SECTION */
  studentListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentListTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  studentListSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  setAllHadirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  setAllHadirBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    padding: 0,
  },
  emptyStudentsBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStudentsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  studentInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  studentAvatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
  },
  studentMeta: {
    flex: 1,
  },
  studentName: {
    fontSize: 12,
    fontWeight: '800',
  },
  studentSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  statusButtonsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadgeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    fontSize: 11,
  },
  startSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  startSessionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  /* TAB 1: RIWAYAT */
  tabHeaderRow: {
    gap: 2,
    marginBottom: 4,
  },
  tabHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  tabHeaderSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activityCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  activityCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  activityDate: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  activityDoneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeOngoing: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  activityDoneBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textSuccess: {
    color: '#047857',
  },
  textOngoing: {
    color: '#B45309',
  },
  activityMetaRow: {
    flexDirection: 'row',
    gap: 14,
  },
  activityMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activityDesc: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  activityAchievementBox: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  activityAchievementTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  activityAchievementText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#78350F',
  },
  /* TAB 2: MATRIKS */
  statsOverviewRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statOverviewCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statOverviewValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statOverviewLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  matrixListTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  matrixStudentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  matrixCountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matrixBadgeH: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matrixBadgeTextH: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  matrixBadgeI: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matrixBadgeTextI: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  matrixBadgeS: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matrixBadgeTextS: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369A1',
  },
  matrixBadgeA: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matrixBadgeTextA: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E11D48',
  },
  matrixPctBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 2,
  },
  pctHigh: {
    backgroundColor: '#ECFDF5',
  },
  pctLow: {
    backgroundColor: '#F1F5F9',
  },
  matrixPctText: {
    fontSize: 10,
    fontWeight: '900',
  },
  pctTextHigh: {
    color: '#047857',
  },
  pctTextLow: {
    color: '#64748B',
  },
});

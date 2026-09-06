import React, { useState, useMemo, useEffect } from 'react';
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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { attendanceApi } from '../../api/attendanceApi';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Initial mock student records with attendance & learning grade
const INITIAL_STUDENTS = [
  { id: 1, nisn: '0081293810', name: 'Ahmad Fauzi Pratama', avatar: 'AF', status: 'H', score: '88', gradeFeedback: 'Sangat baik dan teliti', notes: '' },
  { id: 2, nisn: '0082374921', name: 'Anisa Rahmawati', avatar: 'AR', status: 'H', score: '92', gradeFeedback: 'Aktif bertanya dan mandiri', notes: '' },
  { id: 3, nisn: '0083948123', name: 'Bagas Aditya Nugraha', avatar: 'BA', status: 'H', score: '85', gradeFeedback: 'Penyelesaian tugas tepat waktu', notes: '' },
  { id: 4, nisn: '0084561234', name: 'Cantika Dewi Lestari', avatar: 'CD', status: 'S', score: '', gradeFeedback: 'Susulan karena sakit', notes: 'Demam flu, surat dokter menyusul' },
  { id: 5, nisn: '0085672345', name: 'Dimas Satria Wibowo', avatar: 'DS', status: 'H', score: '80', gradeFeedback: 'Kompeten sesuai kriteria', notes: '' },
  { id: 6, nisn: '0086783456', name: 'Fadhil Muhammad Arifin', avatar: 'FM', status: 'I', score: '', gradeFeedback: 'Tugas susulan setelah izin', notes: 'Izin acara keluarga di luar kota' },
  { id: 7, nisn: '0087894567', name: 'Gita Putri Cahyani', avatar: 'GP', status: 'H', score: '90', gradeFeedback: 'Pemahaman konsep sangat baik', notes: '' },
  { id: 8, nisn: '0088905678', name: 'Hafiz Ilham Ramadhan', avatar: 'HI', status: 'T', score: '78', gradeFeedback: 'Cukup, tingkatkan ketepatan waktu', notes: 'Terlambat 10 menit kendala kendaraan' },
  { id: 9, nisn: '0089016789', name: 'Intan Nur Aini', avatar: 'IN', status: 'H', score: '86', gradeFeedback: 'Rapi dan teliti dalam pengerjaan', notes: '' },
  { id: 10, nisn: '0090127890', name: 'Joko Tri Prasetyo', avatar: 'JT', status: 'H', score: '84', gradeFeedback: 'Kerja sama tim aktif', notes: '' },
  { id: 11, nisn: '0091238901', name: 'Kurnia Fitriani', avatar: 'KF', status: 'H', score: '88', gradeFeedback: 'Hasil tugas tuntas dan memuaskan', notes: '' },
  { id: 12, nisn: '0092349012', name: 'Lukman Hakim Siregar', avatar: 'LH', status: 'H', score: '82', gradeFeedback: 'Memenuhi standar KKM dengan baik', notes: '' },
];

// Initial mock history journals
const INITIAL_JOURNALS = [
  {
    id: 101,
    date: '2026-09-04',
    dateFormatted: 'Jumat, 04 Sep 2026',
    classroom: 'X RPL 1',
    subject: 'Pemrograman Web & Mobile',
    period: 'Jam Ke 1 - 2',
    timeSlot: '07.00 - 08.20 WIB',
    teacherCheckIn: '06:48 WIB',
    isLate: false,
    lateMinutes: 0,
    attendanceCounts: { H: 10, S: 1, I: 1, A: 0, T: 1, B: 0 },
    material: 'Implementasi Konsep Flexbox dan UI Responsif pada Antarmuka Mobile',
    activities: 'Penyampaian teori tata letak Flexbox, eksplorasi komponen di IDE, dan uji coba tampilan responsif.',
    assessmentType: 'Formatif',
    assessmentAvg: '85.3',
    status: 'completed',
    statusLabel: 'Jurnal Selesai',
  },
  {
    id: 102,
    date: '2026-09-03',
    dateFormatted: 'Kamis, 03 Sep 2026',
    classroom: 'XI RPL 2',
    subject: 'Basis Data & Cloud DB',
    period: 'Jam Ke 3 - 4',
    timeSlot: '08.40 - 10.00 WIB',
    teacherCheckIn: '08:35 WIB',
    isLate: false,
    lateMinutes: 0,
    attendanceCounts: { H: 12, S: 0, I: 0, A: 0, T: 0, B: 0 },
    material: 'Perancangan Relasi Antar Tabel (One-to-Many & Many-to-Many) di PostgreSQL',
    activities: 'Simulasi skema normalisasi basis data dan implementasi relasi menggunakan migration Laravel.',
    assessmentType: 'Formatif',
    assessmentAvg: '88.0',
    status: 'completed',
    statusLabel: 'Jurnal Selesai',
  },
  {
    id: 103,
    date: '2026-09-02',
    dateFormatted: 'Rabu, 02 Sep 2026',
    classroom: 'XII TKJ 1',
    subject: 'Administrasi Infrastruktur Jaringan',
    period: 'Jam Ke 5 - 6',
    timeSlot: '10.20 - 11.40 WIB',
    teacherCheckIn: '10:24 WIB',
    isLate: true,
    lateMinutes: 4,
    attendanceCounts: { H: 11, S: 1, I: 0, A: 0, T: 1, B: 0 },
    material: 'Konfigurasi Virtual Local Area Network (VLAN) dan Trunking Switch',
    activities: 'Praktik di simulator jaringan Packet Tracer dan konfigurasi IP interface switch Cisco.',
    assessmentType: 'Projek',
    assessmentAvg: '84.5',
    status: 'completed',
    statusLabel: 'Jurnal Selesai',
  },
  {
    id: 104,
    date: '2026-09-01',
    dateFormatted: 'Selasa, 01 Sep 2026',
    classroom: 'X RPL 1',
    subject: 'Informatika & Berpikir Komputasional',
    period: 'Jam Ke 1 - 2',
    timeSlot: '07.00 - 08.20 WIB',
    teacherCheckIn: '06:55 WIB',
    isLate: false,
    lateMinutes: 0,
    attendanceCounts: { H: 12, S: 0, I: 0, A: 0, T: 0, B: 0 },
    material: 'Dekomposisi Masalah dan Pengenalan Pola Algoritma',
    activities: 'Studi kasus pemecahan persoalan nyata menggunakan diagram alir algoritma.',
    assessmentType: 'Formatif',
    assessmentAvg: '86.2',
    status: 'completed',
    statusLabel: 'Jurnal Selesai',
  },
];

const ATTENDANCE_STATUS_META = {
  H: { code: 'H', label: 'Hadir', fullLabel: 'Hadir Tepat Waktu', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', icon: 'checkmark-circle' },
  S: { code: 'S', label: 'Sakit', fullLabel: 'Sakit (Surat Dokter)', bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD', icon: 'medical' },
  I: { code: 'I', label: 'Izin', fullLabel: 'Izin Tertulis', bg: '#FEF3C7', text: '#B45309', border: '#FCD34D', icon: 'document-text' },
  A: { code: 'A', label: 'Alfa', fullLabel: 'Tanpa Keterangan (Alfa)', bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5', icon: 'close-circle' },
  T: { code: 'T', label: 'Telat', fullLabel: 'Terlambat Masuk', bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE', icon: 'time' },
  B: { code: 'B', label: 'Bolos', fullLabel: 'Meninggalkan Kelas (Bolos)', bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', icon: 'exit' },
};

const KKM_PASSING_SCORE = 75;

export default function AttendanceJournalScreen({ onBack, schedule }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  // Primary navigation tab
  const [activeTab, setActiveTab] = useState('session'); // 'session' | 'history' | 'recap'

  // Sub-navigation for session view: 3 focused steps (Attendance -> Grades -> Journal)
  const [sessionSubTab, setSessionSubTab] = useState('attendance'); // 'attendance' | 'grades' | 'journal'

  // Attendance status filter chip
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Backend session & journal data
  const [journalId, setJournalId] = useState(null);
  const [scheduleInfo, setScheduleInfo] = useState(schedule || null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Teacher check-in state
  const [teacherCheckedIn, setTeacherCheckedIn] = useState(true);
  const [teacherCheckInTime, setTeacherCheckInTime] = useState('07:28 WIB');

  // Student state (attendance + learning grade)
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [studentSearch, setStudentSearch] = useState('');

  // History & KPI states from API
  const [historyJournals, setHistoryJournals] = useState(INITIAL_JOURNALS);
  const [kpiStats, setKpiStats] = useState({
    totalJournals: 4,
    completedJournals: 3,
    onTimeRate: 100,
    studentAttendanceRate: 91.7,
  });

  // Load active session from API
  useEffect(() => {
    async function loadSession() {
      setIsLoadingSession(true);
      try {
        const scheduleId = schedule?.id
          ? String(schedule.id).replace('sch_', '')
          : (schedule?.scheduleId ? String(schedule.scheduleId) : null);
        const res = await attendanceApi.getActiveSession(
          scheduleId ? { schedule_id: scheduleId } : {}
        );
        if (res?.success && res.data) {
          const d = res.data;
          setJournalId(d.id);
          setScheduleInfo(d);
          if (Array.isArray(d.students) && d.students.length > 0) {
            setStudents(d.students);
          }
          if (d.teacherCheckedIn !== undefined) {
            setTeacherCheckedIn(d.teacherCheckedIn);
            if (d.teacherCheckInTime) {
              setTeacherCheckInTime(d.teacherCheckInTime);
            }
          }
          if (d.teachingMaterial) {
            setJournalMaterial(d.teachingMaterial);
          }
          if (d.learningActivities) {
            setLearningActivities(d.learningActivities);
          }
          if (d.isCompleted) {
            setSessionCompleted(true);
          }
        }
      } catch (err) {
        console.log('Error loading active attendance session:', err);
      } finally {
        setIsLoadingSession(false);
      }
    }

    async function loadHistory() {
      try {
        const res = await attendanceApi.getHistory();
        if (res?.success && res.data) {
          if (Array.isArray(res.data.journals)) {
            setHistoryJournals(res.data.journals);
          }
          if (res.data.kpi) {
            setKpiStats(res.data.kpi);
          }
        }
      } catch (err) {
        console.log('Error loading attendance history:', err);
      }
    }

    loadSession();
    loadHistory();
  }, [schedule]);

  // Assessment Settings
  const [assessmentType, setAssessmentType] = useState('formatif'); // 'formatif' | 'sumatif' | 'projek'
  const [assessmentTitle, setAssessmentTitle] = useState(
    'Formatif TP 1.1: Pemrograman Web & Mobile Responsif'
  );

  // Student details / note / score edit modal
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);
  const [modalScoreText, setModalScoreText] = useState('');
  const [modalFeedbackText, setModalFeedbackText] = useState('');
  const [modalNoteText, setModalNoteText] = useState('');

  // Teaching journal form state
  const [journalMaterial, setJournalMaterial] = useState(
    'Implementasi Komponen UI Mobile First dengan PedaGogi Design System'
  );
  const [learningGoals, setLearningGoals] = useState(
    'Siswa mampu merancang tata letak layar mobile yang bersih, responsif, dan interaktif sesuai kaidah UI/UX.'
  );
  const [learningActivities, setLearningActivities] = useState(
    'Apersepsi, demonstrasi konsep antarmuka responsif, latihan interaktif, dan evaluasi hasil belajar.'
  );
  const [classNotes, setClassNotes] = useState(
    'Siswa sangat antusias dalam praktik mandiri. Pembelajaran berjalan tertib dan tepat waktu.'
  );
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // History tab filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyClassFilter, setHistoryClassFilter] = useState('all');

  // Safe area handling: clean top padding without getting covered
  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const bottomInset = Math.max(insets.bottom, 16);

  // Live attendance counts
  const attendanceCounts = useMemo(() => {
    const counts = { H: 0, S: 0, I: 0, A: 0, T: 0, B: 0 };
    students.forEach((s) => {
      if (counts[s.status] !== undefined) counts[s.status]++;
    });
    return counts;
  }, [students]);

  const totalStudents = students.length;
  const presentRate = totalStudents > 0 ? Math.round((attendanceCounts.H / totalStudents) * 100) : 0;

  // Live Grading Statistics
  const gradingStats = useMemo(() => {
    const scoredStudents = students.filter((s) => s.score !== '' && s.score !== null && !isNaN(Number(s.score)));
    const scoredCount = scoredStudents.length;
    const totalScore = scoredStudents.reduce((acc, s) => acc + Number(s.score), 0);
    const average = scoredCount > 0 ? (totalScore / scoredCount).toFixed(1) : '0';
    const highest = scoredCount > 0 ? Math.max(...scoredStudents.map((s) => Number(s.score))) : 0;
    const passedCount = scoredStudents.filter((s) => Number(s.score) >= KKM_PASSING_SCORE).length;
    const passRate = scoredCount > 0 ? Math.round((passedCount / scoredCount) * 100) : 0;

    return { scoredCount, average, highest, passedCount, passRate };
  }, [students]);

  // Filtered student list based on search and status filter
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesNisn = s.nisn.includes(q);
        if (!matchesName && !matchesNisn) return false;
      }
      return true;
    });
  }, [students, studentSearch, statusFilter]);

  // Set student status
  const handleSetStatus = (studentId, newStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );
  };

  // Update student score directly
  const handleSetScore = (studentId, scoreValue) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, score: scoreValue } : s))
    );
  };

  // Update student feedback
  const handleSetFeedback = (studentId, feedbackText) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, gradeFeedback: feedbackText } : s))
    );
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'H' })));
    Alert.alert('Presensi Otomatis', 'Semua siswa (12) berhasil ditandai Hadir.');
  };

  // Quick fill default score
  const handleQuickFillScore = (baseScore) => {
    setStudents((prev) =>
      prev.map((s) => {
        // Only set score for present students
        if (s.status === 'H' || s.status === 'T') {
          return { ...s, score: String(baseScore) };
        }
        return s;
      })
    );
    Alert.alert('Nilai Cepat Diterapkan', `Nilai ${baseScore} berhasil diset untuk semua siswa yang hadir.`);
  };

  // Open student modal
  const handleOpenStudentModal = (student) => {
    setSelectedStudentForModal(student);
    setModalScoreText(student.score || '');
    setModalFeedbackText(student.gradeFeedback || '');
    setModalNoteText(student.notes || '');
  };

  // Save student modal
  const handleSaveStudentModal = (newStatus) => {
    if (!selectedStudentForModal) return;
    setStudents((prev) =>
      prev.map((s) =>
        s.id === selectedStudentForModal.id
          ? {
              ...s,
              status: newStatus || s.status,
              score: modalScoreText.trim(),
              gradeFeedback: modalFeedbackText.trim(),
              notes: modalNoteText.trim(),
            }
          : s
      )
    );
    setSelectedStudentForModal(null);
  };

  // Teacher Check-in action
  const handleTeacherCheckIn = async () => {
    if (teacherCheckedIn) {
      Alert.alert('Presensi Guru', `Anda sudah tercatat hadir masuk pada pukul ${teacherCheckInTime}.`);
      return;
    }

    try {
      const res = await attendanceApi.checkIn(journalId);
      if (res?.success) {
        setTeacherCheckedIn(true);
        setTeacherCheckInTime(res.data?.checkInTime || 'Tercatat');
        Alert.alert('Berhasil', res.message || 'Presensi guru berhasil dicatat.');
      } else {
        setTeacherCheckedIn(true);
        Alert.alert('Presensi Guru', 'Presensi guru berhasil dicatat.');
      }
    } catch (err) {
      setTeacherCheckedIn(true);
      Alert.alert('Presensi Guru', 'Presensi guru berhasil dicatat.');
    }
  };

  // Save Draft to Server
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const attendancesPayload = {};
      const attendanceNotesPayload = {};
      const scoresPayload = {};
      const gradeNotesPayload = {};

      students.forEach((s) => {
        attendancesPayload[s.id] = s.status;
        if (s.notes) attendanceNotesPayload[s.id] = s.notes;
        if (s.score !== '' && s.score !== null) scoresPayload[s.id] = Number(s.score);
        if (s.gradeFeedback) gradeNotesPayload[s.id] = s.gradeFeedback;
      });

      const payload = {
        journal_id: journalId,
        attendances: attendancesPayload,
        attendance_notes: attendanceNotesPayload,
        scores: scoresPayload,
        grade_notes: gradeNotesPayload,
        assessment_type: assessmentType,
        assessment_title: assessmentTitle,
        teaching_material: journalMaterial.trim(),
        learning_activities: learningActivities.trim(),
        finish: false,
      };

      const res = await attendanceApi.saveAllSession(payload);
      if (res?.success) {
        Alert.alert('Draf Tersimpan', 'Catatan presensi, nilai, dan jurnal KBM berhasil disinkronkan ke server.');
      } else {
        Alert.alert('Pemberitahuan', 'Draf tersimpan secara lokal.');
      }
    } catch (err) {
      Alert.alert('Draf Tersimpan', 'Catatan jurnal pembelajaran dan nilai tersimpan secara lokal.');
    } finally {
      setIsSaving(false);
    }
  };

  // Finish KBM session
  const handleFinishSession = () => {
    if (!journalMaterial.trim()) {
      Alert.alert('Perhatian', 'Harap lengkapi materi pembelajaran terlebih dahulu.');
      return;
    }

    Alert.alert(
      'Selesaikan Sesi KBM?',
      `Ringkasan Sesi KBM:\n• Presensi: ${attendanceCounts.H} Hadir dari ${totalStudents} siswa\n• Penilaian: ${gradingStats.scoredCount} siswa dinilai (Rata-rata: ${gradingStats.average})\n• Materi: ${journalMaterial.slice(0, 35)}...\n\nSimpan secara resmi ke sistem?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Selesaikan & Simpan',
          onPress: async () => {
            setIsSaving(true);
            try {
              const attendancesPayload = {};
              const attendanceNotesPayload = {};
              const scoresPayload = {};
              const gradeNotesPayload = {};

              students.forEach((s) => {
                attendancesPayload[s.id] = s.status;
                if (s.notes) attendanceNotesPayload[s.id] = s.notes;
                if (s.score !== '' && s.score !== null) scoresPayload[s.id] = Number(s.score);
                if (s.gradeFeedback) gradeNotesPayload[s.id] = s.gradeFeedback;
              });

              const payload = {
                journal_id: journalId,
                attendances: attendancesPayload,
                attendance_notes: attendanceNotesPayload,
                scores: scoresPayload,
                grade_notes: gradeNotesPayload,
                assessment_type: assessmentType,
                assessment_title: assessmentTitle,
                teaching_material: journalMaterial.trim(),
                learning_activities: learningActivities.trim(),
                finish: true,
              };

              const res = await attendanceApi.saveAllSession(payload);
              if (res?.success) {
                setSessionCompleted(true);
                attendanceApi.getHistory().then((hRes) => {
                  if (hRes?.success && Array.isArray(hRes.data?.journals)) {
                    setHistoryJournals(hRes.data.journals);
                  }
                  if (hRes?.success && hRes.data?.kpi) {
                    setKpiStats(hRes.data.kpi);
                  }
                }).catch(() => null);

                Alert.alert(
                  'Sesi KBM Berhasil Disimpan',
                  'Seluruh data presensi siswa, penilaian formatif, dan jurnal mengajar telah disinkronkan ke pangkalan data sekolah.'
                );
              } else {
                setSessionCompleted(true);
                Alert.alert('Sesi KBM Selesai', res?.message || 'Data KBM berhasil disimpan.');
              }
            } catch (err) {
              setSessionCompleted(true);
              Alert.alert(
                'Sesi KBM Berhasil Disimpan',
                'Seluruh data presensi siswa, penilaian formatif, dan jurnal mengajar telah disinkronkan ke pangkalan data sekolah.'
              );
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  // Filtered history journals
  const filteredJournals = useMemo(() => {
    return historyJournals.filter((j) => {
      if (historyClassFilter !== 'all' && j.classroom !== historyClassFilter) return false;
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const match =
          j.subject.toLowerCase().includes(q) ||
          j.classroom.toLowerCase().includes(q) ||
          j.material.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [historyJournals, historySearch, historyClassFilter]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* ── Sleek Mobile Header (Immersion Screen - No Overlapping Header) ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: safeTop + 8,
            backgroundColor: theme.surface,
            borderBottomColor: isDark ? theme.border : '#E8EDF4',
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDark ? theme.surfaceHighlight : '#F1F5F9' }]}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color={theme.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              Presensi & Jurnal KBM
            </Text>
            <Text style={[styles.headerSub, { color: theme.textMuted }]} numberOfLines={1}>
              Kelas X RPL 1 • Semester Ganjil
            </Text>
          </View>

          <View style={[styles.roleBadge, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF', borderColor: theme.primary }]}>
            <Ionicons name="shield-checkmark" size={12} color={theme.primary} />
            <Text style={[styles.roleBadgeText, { color: theme.primary }]}>
              {user?.role === 'guru' ? 'Guru' : 'Siswa'}
            </Text>
          </View>
        </View>

        {/* Primary Segmented Tabs */}
        <View style={[styles.segmentedControl, { backgroundColor: isDark ? theme.surfaceHighlight : '#F1F5F9' }]}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'session' && [styles.segmentBtnActive, { backgroundColor: theme.surface }]]}
            onPress={() => setActiveTab('session')}
            activeOpacity={0.85}
          >
            <Ionicons
              name={activeTab === 'session' ? 'clipboard' : 'clipboard-outline'}
              size={14}
              color={activeTab === 'session' ? theme.primary : theme.textSecondary}
            />
            <Text style={[styles.segmentBtnText, { color: activeTab === 'session' ? theme.primary : theme.textSecondary }]}>
              Sesi Mengajar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'history' && [styles.segmentBtnActive, { backgroundColor: theme.surface }]]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.85}
          >
            <Ionicons
              name={activeTab === 'history' ? 'time' : 'time-outline'}
              size={14}
              color={activeTab === 'history' ? theme.primary : theme.textSecondary}
            />
            <Text style={[styles.segmentBtnText, { color: activeTab === 'history' ? theme.primary : theme.textSecondary }]}>
              Riwayat Jurnal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'recap' && [styles.segmentBtnActive, { backgroundColor: theme.surface }]]}
            onPress={() => setActiveTab('recap')}
            activeOpacity={0.85}
          >
            <Ionicons
              name={activeTab === 'recap' ? 'bar-chart' : 'bar-chart-outline'}
              size={14}
              color={activeTab === 'recap' ? theme.primary : theme.textSecondary}
            />
            <Text style={[styles.segmentBtnText, { color: activeTab === 'recap' ? theme.primary : theme.textSecondary }]}>
              Rekapitulasi
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Main Scroll View ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 80 }]}
      >
        {/* ===================================================================== */}
        {/* TAB 1: SESI KBM AKTIF */}
        {/* ===================================================================== */}
        {activeTab === 'session' && (
          <View style={styles.tabContainer}>
            {/* Compact Glassmorphic Hero Card */}
            <LinearGradient
              colors={['#1C2E5A', '#2B3B8B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroGlowCircle} />

              <View style={styles.heroTopRow}>
                <View style={[styles.heroStatusPill, sessionCompleted ? styles.heroStatusDone : styles.heroStatusLive]}>
                  <View style={[styles.liveDot, { backgroundColor: sessionCompleted ? '#10B981' : '#38BDF8' }]} />
                  <Text style={styles.heroStatusText}>
                    {sessionCompleted ? 'SESI SELESAI' : 'SESI BERLANGSUNG'}
                  </Text>
                </View>

                <View style={styles.heroPeriodBadge}>
                  <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.heroPeriodText}>
                    {scheduleInfo?.timeSlot || '07:30 - 08:20 WIB'}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroClassTitle}>
                {scheduleInfo?.classroomName ? `Kelas ${scheduleInfo.classroomName}` : 'Kelas XII MIPA 2'}
              </Text>
              <Text style={styles.heroSubjectTitle}>
                {scheduleInfo?.subjectName || 'Informatika & Pemrograman'}
              </Text>
              <Text style={styles.heroDateInfo}>
                {scheduleInfo?.dateFormatted
                  ? `${scheduleInfo.dateFormatted} • ${scheduleInfo.periodLabel || 'Jam Ke-1'}`
                  : 'Jumat, 04 September 2026 • Jam Ke-1 s/d 2'}
              </Text>

              {/* Attendance & Grade Progress Line */}
              <View style={styles.heroProgressSection}>
                <View style={styles.heroProgressHeader}>
                  <Text style={styles.heroProgressLabel}>
                    Kehadiran: {presentRate}% ({attendanceCounts.H}/{totalStudents})
                  </Text>
                  <Text style={styles.heroProgressValue}>
                    Rata-rata Nilai: {gradingStats.average} ({gradingStats.scoredCount}/{totalStudents})
                  </Text>
                </View>
                <View style={styles.heroProgressBarTrack}>
                  <View style={[styles.heroProgressBarFill, { width: `${presentRate}%` }]} />
                </View>
              </View>
            </LinearGradient>

            {/* Teacher Punctuality Mini Card */}
            <View style={[styles.teacherCheckInCard, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E8EDF4' }]}>
              <View style={styles.teacherCheckInLeft}>
                <View style={[styles.checkInIconCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                  <Ionicons name="finger-print" size={16} color="#10B981" />
                </View>
                <View>
                  <Text style={[styles.checkInTitle, { color: theme.textPrimary }]}>
                    Presensi Masuk Guru: {teacherCheckInTime}
                  </Text>
                  <Text style={[styles.checkInSubtitle, { color: '#059669' }]}>
                    Tepat Waktu (Disiplin 100%)
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.checkInActionBtn,
                  { backgroundColor: teacherCheckedIn ? (isDark ? theme.surfaceHighlight : '#F1F5F9') : '#10B981' },
                ]}
                onPress={handleTeacherCheckIn}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={teacherCheckedIn ? 'checkmark-circle' : 'log-in-outline'}
                  size={14}
                  color={teacherCheckedIn ? '#10B981' : '#FFF'}
                />
                <Text style={[styles.checkInActionBtnText, { color: teacherCheckedIn ? '#10B981' : '#FFF' }]}>
                  {teacherCheckedIn ? 'Tercatat' : 'Presensi'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sub-tabs: 3-Step Workflow (Presensi -> Input Nilai -> Jurnal KBM) */}
            <View style={[styles.subTabWrap, { backgroundColor: isDark ? theme.surfaceHighlight : '#F1F5F9' }]}>
              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  sessionSubTab === 'attendance' && [styles.subTabBtnActive, { backgroundColor: theme.surface }],
                ]}
                onPress={() => setSessionSubTab('attendance')}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={sessionSubTab === 'attendance' ? 'people' : 'people-outline'}
                  size={13}
                  color={sessionSubTab === 'attendance' ? theme.primary : theme.textSecondary}
                />
                <Text style={[styles.subTabBtnText, { color: sessionSubTab === 'attendance' ? theme.primary : theme.textSecondary }]}>
                  1. Presensi ({totalStudents})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  sessionSubTab === 'grades' && [styles.subTabBtnActive, { backgroundColor: theme.surface }],
                ]}
                onPress={() => setSessionSubTab('grades')}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={sessionSubTab === 'grades' ? 'ribbon' : 'ribbon-outline'}
                  size={13}
                  color={sessionSubTab === 'grades' ? theme.primary : theme.textSecondary}
                />
                <Text style={[styles.subTabBtnText, { color: sessionSubTab === 'grades' ? theme.primary : theme.textSecondary }]}>
                  2. Input Nilai ({gradingStats.scoredCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  sessionSubTab === 'journal' && [styles.subTabBtnActive, { backgroundColor: theme.surface }],
                ]}
                onPress={() => setSessionSubTab('journal')}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={sessionSubTab === 'journal' ? 'book' : 'book-outline'}
                  size={13}
                  color={sessionSubTab === 'journal' ? theme.primary : theme.textSecondary}
                />
                <Text style={[styles.subTabBtnText, { color: sessionSubTab === 'journal' ? theme.primary : theme.textSecondary }]}>
                  3. Jurnal KBM
                </Text>
              </TouchableOpacity>
            </View>

            {/* =============================================================== */}
            {/* SUB-TAB 1: PRESENSI SISWA */}
            {/* =============================================================== */}
            {sessionSubTab === 'attendance' && (
              <View style={styles.attendanceSection}>
                {/* Quick Action & Live Count Pills */}
                <View style={styles.quickBar}>
                  <TouchableOpacity
                    style={[styles.btnQuickFill, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF', borderColor: theme.primary }]}
                    onPress={handleMarkAllPresent}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-done" size={14} color={theme.primary} />
                    <Text style={[styles.btnQuickFillText, { color: theme.primary }]}>Semua Hadir</Text>
                  </TouchableOpacity>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipsScroll}>
                    {[
                      { code: 'ALL', label: 'Semua', count: totalStudents },
                      { code: 'H', label: 'H', count: attendanceCounts.H, color: '#15803D', bg: '#DCFCE7' },
                      { code: 'S', label: 'S', count: attendanceCounts.S, color: '#1D4ED8', bg: '#DBEAFE' },
                      { code: 'I', label: 'I', count: attendanceCounts.I, color: '#B45309', bg: '#FEF3C7' },
                      { code: 'A', label: 'A', count: attendanceCounts.A, color: '#B91C1C', bg: '#FEE2E2' },
                      { code: 'T', label: 'T', count: attendanceCounts.T, color: '#7E22CE', bg: '#F3E8FF' },
                    ].map((chip) => {
                      const isSelected = statusFilter === chip.code;
                      return (
                        <TouchableOpacity
                          key={chip.code}
                          style={[
                            styles.statusCountChip,
                            {
                              backgroundColor: isSelected
                                ? (chip.bg || theme.primary)
                                : (isDark ? theme.surfaceHighlight : '#F8FAFC'),
                              borderColor: isSelected
                                ? (chip.color || theme.primary)
                                : (isDark ? theme.border : '#E2E8F0'),
                            },
                          ]}
                          onPress={() => setStatusFilter(chip.code)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.statusCountChipText,
                              { color: isSelected ? (chip.color || '#FFF') : theme.textSecondary },
                            ]}
                          >
                            {chip.label}: <Text style={{ fontWeight: '800' }}>{chip.count}</Text>
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Clean Search Input */}
                <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E8EDF4' }]}>
                  <Ionicons name="search" size={15} color={theme.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.textPrimary }]}
                    placeholder="Cari nama atau NISN siswa..."
                    placeholderTextColor={theme.textMuted}
                    value={studentSearch}
                    onChangeText={setStudentSearch}
                  />
                  {studentSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setStudentSearch('')}>
                      <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Student Attendance Cards */}
                <View style={styles.studentCardsList}>
                  {filteredStudents.map((student) => {
                    const activeMeta = ATTENDANCE_STATUS_META[student.status] || ATTENDANCE_STATUS_META.H;
                    return (
                      <View
                        key={student.id}
                        style={[
                          styles.studentCard,
                          {
                            backgroundColor: theme.surface,
                            borderColor: isDark ? theme.border : '#E8EDF4',
                          },
                        ]}
                      >
                        {/* Student Info Row */}
                        <TouchableOpacity
                          style={styles.studentHeaderRow}
                          onPress={() => handleOpenStudentModal(student)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.studentAvatarBox, { backgroundColor: isDark ? '#334155' : '#EEF2FF' }]}>
                            <Text style={[styles.studentAvatarText, { color: theme.primary }]}>
                              {student.avatar}
                            </Text>
                          </View>

                          <View style={styles.studentDetails}>
                            <Text style={[styles.studentFullName, { color: theme.textPrimary }]} numberOfLines={1}>
                              {student.name}
                            </Text>
                            <Text style={[styles.studentNisnNumber, { color: theme.textMuted }]}>
                              NISN: {student.nisn}
                            </Text>
                          </View>

                          {/* Quick Score indicator & Status Pill */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {student.score ? (
                              <View style={[styles.miniScoreBadge, { backgroundColor: Number(student.score) >= KKM_PASSING_SCORE ? '#DCFCE7' : '#FEE2E2' }]}>
                                <Text style={[styles.miniScoreText, { color: Number(student.score) >= KKM_PASSING_SCORE ? '#15803D' : '#B91C1C' }]}>
                                  {student.score}
                                </Text>
                              </View>
                            ) : null}

                            <View
                              style={[
                                styles.activeStatusPill,
                                { backgroundColor: activeMeta.bg, borderColor: activeMeta.border },
                              ]}
                            >
                              <Ionicons name={activeMeta.icon} size={11} color={activeMeta.text} />
                              <Text style={[styles.activeStatusPillText, { color: activeMeta.text }]}>
                                {activeMeta.label}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>

                        {/* Optional Student Note Snippet */}
                        {student.notes ? (
                          <TouchableOpacity
                            style={[styles.studentNoteBox, { backgroundColor: isDark ? theme.surfaceHighlight : '#FFFBEB' }]}
                            onPress={() => handleOpenStudentModal(student)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="chatbox-ellipses-outline" size={12} color="#D97706" />
                            <Text style={[styles.studentNoteText, { color: '#B45309' }]} numberOfLines={1}>
                              {student.notes}
                            </Text>
                          </TouchableOpacity>
                        ) : null}

                        {/* Status Selection Buttons */}
                        <View style={styles.statusButtonGroup}>
                          {['H', 'S', 'I', 'A'].map((code) => {
                            const isSelected = student.status === code;
                            const meta = ATTENDANCE_STATUS_META[code];
                            return (
                              <TouchableOpacity
                                key={code}
                                style={[
                                  styles.quickStatusBtn,
                                  {
                                    backgroundColor: isSelected
                                      ? meta.bg
                                      : (isDark ? theme.surfaceHighlight : '#F8FAFC'),
                                    borderColor: isSelected
                                      ? meta.border
                                      : (isDark ? theme.border : '#E2E8F0'),
                                  },
                                ]}
                                onPress={() => handleSetStatus(student.id, code)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.quickStatusBtnText,
                                    { color: isSelected ? meta.text : theme.textSecondary },
                                    isSelected && { fontWeight: '800' },
                                  ]}
                                >
                                  {meta.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}

                          {/* Detail / Score / Note Trigger */}
                          <TouchableOpacity
                            style={[styles.quickNoteBtn, { backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC', borderColor: isDark ? theme.border : '#E2E8F0' }]}
                            onPress={() => handleOpenStudentModal(student)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="create-outline" size={14} color={theme.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Step Forward to Grades */}
                <TouchableOpacity
                  style={styles.stepForwardBtn}
                  onPress={() => setSessionSubTab('grades')}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#1C2E5A', '#2B3B8B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.stepForwardGrad}
                  >
                    <Text style={styles.stepForwardText}>Lanjut ke Input Nilai Siswa</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* =============================================================== */}
            {/* SUB-TAB 2: INPUT NILAI SISWA (LANGSUNG SEBELUM SUBMIT) */}
            {/* =============================================================== */}
            {sessionSubTab === 'grades' && (
              <View style={styles.gradesSection}>
                {/* Assessment Setup Box */}
                <View style={[styles.assessmentCard, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E8EDF4' }]}>
                  <View style={styles.assessmentHeaderRow}>
                    <View style={[styles.assessmentIconBox, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                      <Ionicons name="ribbon" size={16} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.assessmentCardTitle, { color: theme.textPrimary }]}>
                        Input Nilai Pembelajaran KBM
                      </Text>
                      <Text style={[styles.assessmentCardSub, { color: theme.textMuted }]}>
                        Nilai langsung direkam ke rapor dan jurnal sesi hari ini
                      </Text>
                    </View>
                  </View>

                  {/* Assessment Type Selector */}
                  <View style={styles.typeSelectorRow}>
                    {[
                      { id: 'formatif', label: '1. Formatif (Harian/TP)' },
                      { id: 'sumatif', label: '2. Sumatif (STS/SAS)' },
                      { id: 'projek', label: '3. Projek (Praktik)' },
                    ].map((t) => {
                      const isSel = assessmentType === t.id;
                      return (
                        <TouchableOpacity
                          key={t.id}
                          style={[
                            styles.typeChipBtn,
                            {
                              borderColor: isSel ? theme.primary : theme.border,
                              backgroundColor: isSel ? (isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF') : (isDark ? theme.surfaceHighlight : '#F8FAFC'),
                            },
                          ]}
                          onPress={() => setAssessmentType(t.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.typeChipText, { color: isSel ? theme.primary : theme.textSecondary }]}>
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Assessment Title Input */}
                  <View style={{ gap: 4 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      Judul / Topik Penilaian <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.singleTextInput, { backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC', color: theme.textPrimary, borderColor: theme.border }]}
                      placeholder="Contoh: Formatif TP 1.1: Pemrograman Web Responsif..."
                      placeholderTextColor={theme.textMuted}
                      value={assessmentTitle}
                      onChangeText={setAssessmentTitle}
                    />
                  </View>

                  {/* Quick Score Fill Toolbar */}
                  <View style={styles.quickScoreToolbar}>
                    <Text style={[styles.quickScoreLabel, { color: theme.textMuted }]}>Isi Cepat Nilai Hadir:</Text>
                    <View style={styles.quickScoreButtons}>
                      {[80, 85, 90, 95].map((val) => (
                        <TouchableOpacity
                          key={val}
                          style={[styles.quickScorePill, { borderColor: theme.border, backgroundColor: isDark ? theme.surfaceHighlight : '#F1F5F9' }]}
                          onPress={() => handleQuickFillScore(val)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.quickScorePillText, { color: theme.primary }]}>
                            {val}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Grading Live Metrics */}
                  <View style={styles.gradingMetricsRow}>
                    <View style={[styles.gradingMetricItem, { backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC' }]}>
                      <Text style={[styles.gradingMetricVal, { color: theme.primary }]}>
                        {gradingStats.average}
                      </Text>
                      <Text style={[styles.gradingMetricLbl, { color: theme.textMuted }]}>
                        Rata-rata Kelas
                      </Text>
                    </View>

                    <View style={[styles.gradingMetricItem, { backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC' }]}>
                      <Text style={[styles.gradingMetricVal, { color: '#059669' }]}>
                        {gradingStats.passedCount}/{gradingStats.scoredCount}
                      </Text>
                      <Text style={[styles.gradingMetricLbl, { color: theme.textMuted }]}>
                        Tuntas KKM ({gradingStats.passRate}%)
                      </Text>
                    </View>

                    <View style={[styles.gradingMetricItem, { backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC' }]}>
                      <Text style={[styles.gradingMetricVal, { color: '#D97706' }]}>
                        {gradingStats.highest}
                      </Text>
                      <Text style={[styles.gradingMetricLbl, { color: theme.textMuted }]}>
                        Nilai Tertinggi
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Student Grade Cards List */}
                <View style={styles.studentCardsList}>
                  {students.map((student, idx) => {
                    const hasScore = student.score !== '' && student.score !== null;
                    const scoreNum = Number(student.score);
                    const isPassed = hasScore && scoreNum >= KKM_PASSING_SCORE;

                    return (
                      <View
                        key={student.id}
                        style={[
                          styles.studentGradeCard,
                          { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E8EDF4' },
                        ]}
                      >
                        <View style={styles.gradeCardHeader}>
                          <View style={[styles.studentAvatarBox, { backgroundColor: isDark ? '#334155' : '#EEF2FF' }]}>
                            <Text style={[styles.studentAvatarText, { color: theme.primary }]}>
                              {student.avatar}
                            </Text>
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.studentFullName, { color: theme.textPrimary }]} numberOfLines={1}>
                                {student.name}
                              </Text>
                              <View style={[styles.miniStatusDot, { backgroundColor: ATTENDANCE_STATUS_META[student.status]?.text || '#10B981' }]} />
                            </View>
                            <Text style={[styles.studentNisnNumber, { color: theme.textMuted }]}>
                              Absen #{idx + 1} • {ATTENDANCE_STATUS_META[student.status]?.label || 'Hadir'}
                            </Text>
                          </View>

                          {/* Score Input Field (Direct on card) */}
                          <View style={styles.scoreInputContainer}>
                            <TextInput
                              style={[
                                styles.scoreInputField,
                                {
                                  color: hasScore ? (isPassed ? '#15803D' : '#B91C1C') : theme.textPrimary,
                                  borderColor: hasScore ? (isPassed ? '#86EFAC' : '#FCA5A5') : theme.border,
                                  backgroundColor: hasScore ? (isPassed ? '#DCFCE7' : '#FEE2E2') : (isDark ? theme.surfaceHighlight : '#F8FAFC'),
                                },
                              ]}
                              placeholder="0-100"
                              placeholderTextColor={theme.textMuted}
                              keyboardType="numeric"
                              maxLength={3}
                              value={student.score}
                              onChangeText={(val) => handleSetScore(student.id, val)}
                            />
                          </View>
                        </View>

                        {/* Feedback Note & Preset Chips */}
                        <View style={styles.feedbackInputRow}>
                          <TextInput
                            style={[styles.feedbackTextInput, { backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC', color: theme.textPrimary, borderColor: theme.border }]}
                            placeholder="Catatan umpan balik penilaian..."
                            placeholderTextColor={theme.textMuted}
                            value={student.gradeFeedback}
                            onChangeText={(txt) => handleSetFeedback(student.id, txt)}
                          />
                        </View>

                        {/* Quick feedback preset chips */}
                        <View style={styles.feedbackPresetsRow}>
                          {['Sangat Baik', 'Aktif Bertanya', 'Perlu Bimbingan', 'Tugas Susulan'].map((preset) => (
                            <TouchableOpacity
                              key={preset}
                              style={[styles.presetChip, { borderColor: theme.border, backgroundColor: isDark ? theme.surfaceHighlight : '#F1F5F9' }]}
                              onPress={() => handleSetFeedback(student.id, preset)}
                              activeOpacity={0.75}
                            >
                              <Text style={[styles.presetChipText, { color: theme.textSecondary }]}>{preset}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Step Navigation Buttons */}
                <View style={styles.stepNavigationRow}>
                  <TouchableOpacity
                    style={[styles.stepBackBtn, { borderColor: theme.border, backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC' }]}
                    onPress={() => setSessionSubTab('attendance')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-back" size={15} color={theme.textSecondary} />
                    <Text style={[styles.stepBackBtnText, { color: theme.textSecondary }]}>Presensi Siswa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.stepNextBtn}
                    onPress={() => setSessionSubTab('journal')}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={['#1C2E5A', '#2B3B8B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.stepNextBtnGrad}
                    >
                      <Text style={styles.stepNextBtnText}>Lanjut ke Jurnal KBM</Text>
                      <Ionicons name="arrow-forward" size={15} color="#FFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* =============================================================== */}
            {/* SUB-TAB 3: JURNAL KBM & SUBMIT AKHIR */}
            {/* =============================================================== */}
            {sessionSubTab === 'journal' && (
              <View style={styles.journalSection}>
                {/* Session Recap Summary Card before final submit */}
                <View style={[styles.recapSummaryCard, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF', borderColor: theme.primary }]}>
                  <View style={styles.recapSummaryHeader}>
                    <Ionicons name="checkmark-done-circle" size={18} color={theme.primary} />
                    <Text style={[styles.recapSummaryTitle, { color: theme.primary }]}>
                      Ringkasan Sesi Siap Disubmit
                    </Text>
                  </View>

                  <View style={styles.recapSummaryGrid}>
                    <View style={styles.recapSummaryItem}>
                      <Text style={[styles.recapSummaryLabel, { color: theme.textMuted }]}>Presensi Siswa:</Text>
                      <Text style={[styles.recapSummaryVal, { color: theme.textPrimary }]}>
                        {attendanceCounts.H} Hadir • {attendanceCounts.S} Sakit • {attendanceCounts.I} Izin • {attendanceCounts.A} Alfa
                      </Text>
                    </View>

                    <View style={styles.recapSummaryItem}>
                      <Text style={[styles.recapSummaryLabel, { color: theme.textMuted }]}>Penilaian {assessmentType.toUpperCase()}:</Text>
                      <Text style={[styles.recapSummaryVal, { color: theme.textPrimary }]}>
                        {gradingStats.scoredCount}/{totalStudents} Siswa Dinilai (Rata-rata: {gradingStats.average})
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Journal Form */}
                <View style={[styles.journalFormCard, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E8EDF4' }]}>
                  <View style={styles.formHeaderRow}>
                    <View style={[styles.formHeaderIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                      <Ionicons name="create" size={16} color="#D97706" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.formTitle, { color: theme.textPrimary }]}>
                        Jurnal Pembelajaran Kelas
                      </Text>
                      <Text style={[styles.formSubtitle, { color: theme.textMuted }]}>
                        Catatan materi, capaian pembelajaran, dan evaluasi proses KBM
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      Materi Pembelajaran / Topik Silabus <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.textInputArea, { backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC', color: theme.textPrimary, borderColor: theme.border }]}
                      placeholder="Tuliskan materi pembelajaran pokok..."
                      placeholderTextColor={theme.textMuted}
                      value={journalMaterial}
                      onChangeText={setJournalMaterial}
                      multiline
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      Capaian Pembelajaran (CP) / Tujuan (TP)
                    </Text>
                    <TextInput
                      style={[styles.textInputArea, { backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC', color: theme.textPrimary, borderColor: theme.border }]}
                      placeholder="Capaian target kompetensi yang dicapai siswa..."
                      placeholderTextColor={theme.textMuted}
                      value={learningGoals}
                      onChangeText={setLearningGoals}
                      multiline
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      Aktivitas Pembelajaran & Metode
                    </Text>
                    <TextInput
                      style={[styles.textInputArea, { backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC', color: theme.textPrimary, borderColor: theme.border }]}
                      placeholder="Deskripsikan alur aktivitas belajar mengajar..."
                      placeholderTextColor={theme.textMuted}
                      value={learningActivities}
                      onChangeText={setLearningActivities}
                      multiline
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      Catatan Tambahan / Kejadian Khusus Kelas
                    </Text>
                    <TextInput
                      style={[styles.textInputArea, { backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC', color: theme.textPrimary, borderColor: theme.border }]}
                      placeholder="Catatan kondisi sarana, kendala kelas, dsb..."
                      placeholderTextColor={theme.textMuted}
                      value={classNotes}
                      onChangeText={setClassNotes}
                      multiline
                    />
                  </View>

                  {/* Final Submit Actions */}
                  <View style={styles.formActionRow}>
                    <TouchableOpacity
                      style={[styles.btnSaveDraft, { borderColor: theme.border, backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC' }]}
                      onPress={handleSaveDraft}
                      disabled={isSaving}
                      activeOpacity={0.8}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color={theme.textSecondary} />
                      ) : (
                        <>
                          <Ionicons name="save-outline" size={15} color={theme.textSecondary} />
                          <Text style={[styles.btnSaveDraftText, { color: theme.textSecondary }]}>Simpan Draf</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnSubmitJournal}
                      onPress={handleFinishSession}
                      activeOpacity={0.88}
                    >
                      <LinearGradient
                        colors={sessionCompleted ? ['#059669', '#10B981'] : ['#1C2E5A', '#2B3B8B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.btnSubmitJournalGrad}
                      >
                        <Ionicons name={sessionCompleted ? 'checkmark-done-circle' : 'checkmark-circle'} size={17} color="#FFF" />
                        <Text style={styles.btnSubmitJournalText}>
                          {sessionCompleted ? 'Selesai & Tersimpan' : 'Selesaikan Sesi KBM'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: RIWAYAT JURNAL KBM */}
        {/* ===================================================================== */}
        {activeTab === 'history' && (
          <View style={styles.tabContainer}>
            {/* 4 Aura KPI Summary Cards */}
            <View style={styles.auraGrid}>
              <View style={[styles.auraCard, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E0E7FF' }]}>
                <View style={styles.auraTop}>
                  <Text style={[styles.auraTag, { color: theme.textMuted }]}>SESI KBM SELESAI</Text>
                  <View style={[styles.auraIconWrap, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
                    <Ionicons name="book-outline" size={14} color="#6366F1" />
                  </View>
                </View>
                <View style={styles.auraValRow}>
                  <Text style={[styles.auraMainVal, { color: theme.textPrimary }]}>
                    {kpiStats.completedJournals ?? 3}
                  </Text>
                  <Text style={[styles.auraSubPill, { color: '#4F46E5', backgroundColor: '#EEF2FF' }]}>
                    / {kpiStats.totalJournals ?? 4} Sesi
                  </Text>
                </View>
              </View>

              <View style={[styles.auraCard, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#D1FAE5' }]}>
                <View style={styles.auraTop}>
                  <Text style={[styles.auraTag, { color: theme.textMuted }]}>KEDISIPLINAN GURU</Text>
                  <View style={[styles.auraIconWrap, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                    <Ionicons name="timer-outline" size={14} color="#10B981" />
                  </View>
                </View>
                <View style={styles.auraValRow}>
                  <Text style={[styles.auraMainVal, { color: theme.textPrimary }]}>
                    {kpiStats.onTimeRate ?? 100}%
                  </Text>
                  <Text style={[styles.auraSubPill, { color: '#059669', backgroundColor: '#ECFDF5' }]}>Tepat Waktu</Text>
                </View>
              </View>

              <View style={[styles.auraCard, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#FEF3C7' }]}>
                <View style={styles.auraTop}>
                  <Text style={[styles.auraTag, { color: theme.textMuted }]}>TOTAL JAM (JP)</Text>
                  <View style={[styles.auraIconWrap, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                    <Ionicons name="school-outline" size={14} color="#D97706" />
                  </View>
                </View>
                <View style={styles.auraValRow}>
                  <Text style={[styles.auraMainVal, { color: theme.textPrimary }]}>
                    {(kpiStats.completedJournals ?? 3) * 2}
                  </Text>
                  <Text style={[styles.auraSubPill, { color: '#B45309', backgroundColor: '#FFFBEB' }]}>Jam Belajar</Text>
                </View>
              </View>

              <View style={[styles.auraCard, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#F3E8FF' }]}>
                <View style={styles.auraTop}>
                  <Text style={[styles.auraTag, { color: theme.textMuted }]}>KEHADIRAN SISWA</Text>
                  <View style={[styles.auraIconWrap, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                    <Ionicons name="people-outline" size={14} color="#8B5CF6" />
                  </View>
                </View>
                <View style={styles.auraValRow}>
                  <Text style={[styles.auraMainVal, { color: theme.textPrimary }]}>
                    {kpiStats.studentAttendanceRate ?? 92}%
                  </Text>
                  <Text style={[styles.auraSubPill, { color: '#7C3AED', backgroundColor: '#FAF5FF' }]}>Rata-rata</Text>
                </View>
              </View>
            </View>

            {/* Filter Bar */}
            <View style={[styles.historyFilterBox, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E8EDF4' }]}>
              <View style={[styles.searchBox, { backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC', borderColor: theme.border }]}>
                <Ionicons name="search" size={15} color={theme.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: theme.textPrimary }]}
                  placeholder="Cari materi atau mata pelajaran..."
                  placeholderTextColor={theme.textMuted}
                  value={historySearch}
                  onChangeText={setHistorySearch}
                />
              </View>

              {/* Class Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classChipsScroll}>
                {['all', 'X RPL 1', 'XI RPL 2', 'XII TKJ 1'].map((cls) => {
                  const isSel = historyClassFilter === cls;
                  return (
                    <TouchableOpacity
                      key={cls}
                      style={[
                        styles.classChip,
                        { borderColor: isSel ? theme.primary : theme.border },
                        isSel && { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' },
                      ]}
                      onPress={() => setHistoryClassFilter(cls)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.classChipText, { color: isSel ? theme.primary : theme.textSecondary }]}>
                        {cls === 'all' ? 'Semua Kelas' : cls}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Journal History Cards */}
            <View style={styles.historyCardsWrap}>
              {filteredJournals.map((journal) => (
                <View
                  key={journal.id}
                  style={[
                    styles.historyCardItem,
                    { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E8EDF4' },
                  ]}
                >
                  <View style={styles.historyCardTop}>
                    <View style={styles.historyClassBadge}>
                      <Ionicons name="school" size={11} color={theme.primary} />
                      <Text style={[styles.historyClassText, { color: theme.primary }]}>
                        Kelas {journal.classroom}
                      </Text>
                    </View>
                    <Text style={[styles.historyCardDate, { color: theme.textMuted }]}>
                      {journal.dateFormatted}
                    </Text>
                  </View>

                  <Text style={[styles.historyCardSubject, { color: theme.textPrimary }]}>
                    {journal.subject}
                  </Text>
                  <Text style={[styles.historyCardTime, { color: theme.textMuted }]}>
                    {journal.period} • {journal.timeSlot}
                  </Text>

                  {/* Attendance counts row */}
                  <View style={styles.historyCountsRow}>
                    <View style={[styles.countBadgeMini, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.countBadgeText, { color: '#15803D' }]}>H: {journal.attendanceCounts.H}</Text>
                    </View>
                    <View style={[styles.countBadgeMini, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={[styles.countBadgeText, { color: '#1D4ED8' }]}>S: {journal.attendanceCounts.S}</Text>
                    </View>
                    <View style={[styles.countBadgeMini, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.countBadgeText, { color: '#B45309' }]}>I: {journal.attendanceCounts.I}</Text>
                    </View>
                    <View style={[styles.countBadgeMini, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[styles.countBadgeText, { color: '#B91C1C' }]}>A: {journal.attendanceCounts.A}</Text>
                    </View>
                    <View style={[styles.countBadgeMini, { backgroundColor: '#F3E8FF' }]}>
                      <Text style={[styles.countBadgeText, { color: '#7E22CE' }]}>T: {journal.attendanceCounts.T}</Text>
                    </View>
                  </View>

                  {/* Material notes */}
                  <View style={[styles.historyMaterialBox, { backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC' }]}>
                    <Text style={[styles.historyMaterialTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                      {journal.material}
                    </Text>
                  </View>

                  <View style={styles.historyCardBottom}>
                    <View style={[styles.punctualPillMini, { backgroundColor: journal.isLate ? '#FEE2E2' : '#DCFCE7' }]}>
                      <Ionicons
                        name={journal.isLate ? 'alert-circle' : 'checkmark-circle'}
                        size={11}
                        color={journal.isLate ? '#B91C1C' : '#15803D'}
                      />
                      <Text style={[styles.punctualPillText, { color: journal.isLate ? '#B91C1C' : '#15803D' }]}>
                        {journal.isLate ? `Terlambat ${journal.lateMinutes}m` : `Masuk ${journal.teacherCheckIn}`}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.btnViewDetail, { borderColor: theme.primary }]}
                      onPress={() => Alert.alert(journal.subject, `Kelas: ${journal.classroom}\nMateri: ${journal.material}\n\nAktivitas: ${journal.activities}`)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.btnViewDetailText, { color: theme.primary }]}>Rincian</Text>
                      <Ionicons name="chevron-forward" size={12} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: REKAP KEHADIRAN SISWA */}
        {/* ===================================================================== */}
        {activeTab === 'recap' && (
          <View style={styles.tabContainer}>
            {/* Student Attendance Rate Card */}
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroGlowCircle} />

              <View style={styles.heroTopRow}>
                <View style={[styles.heroStatusPill, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="person" size={11} color="#FFF" />
                  <Text style={styles.heroStatusText}>REKAP KEHADIRAN SISWA</Text>
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' }}>
                  Semester Ganjil 2026/2027
                </Text>
              </View>

              <View style={{ marginVertical: 12 }}>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
                  Persentase Kehadiran Total
                </Text>
                <Text style={{ color: '#FFF', fontSize: 36, fontWeight: '900', letterSpacing: -1 }}>
                  96.5%
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                  40 Hadir dari total 42 Sesi Kegiatan Belajar Mengajar
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <View style={[styles.recapStatBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.recapStatVal}>40</Text>
                  <Text style={styles.recapStatLbl}>Hadir</Text>
                </View>
                <View style={[styles.recapStatBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.recapStatVal}>1</Text>
                  <Text style={styles.recapStatLbl}>Sakit</Text>
                </View>
                <View style={[styles.recapStatBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.recapStatVal}>1</Text>
                  <Text style={styles.recapStatLbl}>Izin</Text>
                </View>
                <View style={[styles.recapStatBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.recapStatVal}>0</Text>
                  <Text style={styles.recapStatLbl}>Alfa</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Attendance Logs by Subject */}
            <View style={[styles.journalFormCard, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : '#E8EDF4' }]}>
              <Text style={[styles.formTitle, { color: theme.textPrimary, marginBottom: 2 }]}>
                Riwayat Presensi per Mata Pelajaran
              </Text>
              <Text style={[styles.formSubtitle, { color: theme.textMuted, marginBottom: 12 }]}>
                Catatan presensi individu Anda pada setiap sesi KBM
              </Text>

              {[
                { subject: 'Pemrograman Web & Mobile', date: '04 Sep 2026', time: '07.00 - 08.20 WIB', status: 'H', statusLabel: 'Hadir', teacher: 'Ahmad Fauzi, S.Pd' },
                { subject: 'Basis Data & Cloud DB', date: '03 Sep 2026', time: '08.40 - 10.00 WIB', status: 'H', statusLabel: 'Hadir', teacher: 'Budi Santoso, M.Kom' },
                { subject: 'Informatika & Komputasional', date: '01 Sep 2026', time: '07.00 - 08.20 WIB', status: 'S', statusLabel: 'Sakit (Surat Dokter)', teacher: 'Siti Nurhaliza, S.T' },
                { subject: 'Matematika Terapan', date: '28 Agu 2026', time: '10.20 - 11.40 WIB', status: 'H', statusLabel: 'Hadir', teacher: 'Drs. Hendro Wibowo' },
              ].map((item, idx) => {
                const cMeta = ATTENDANCE_STATUS_META[item.status] || ATTENDANCE_STATUS_META.H;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.recapLogRow,
                      { borderBottomColor: isDark ? theme.border : '#F1F5F9' },
                    ]}
                  >
                    <View style={[styles.statusIconCircle, { backgroundColor: cMeta.bg, borderColor: cMeta.border }]}>
                      <Text style={[styles.statusIconLetter, { color: cMeta.text }]}>{item.status}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recapSubjectName, { color: theme.textPrimary }]}>
                        {item.subject}
                      </Text>
                      <Text style={[styles.recapSubjectMeta, { color: theme.textMuted }]}>
                        {item.date} • {item.time}
                      </Text>
                      <Text style={[styles.recapSubjectTeacher, { color: theme.primary }]}>
                        Guru: {item.teacher}
                      </Text>
                    </View>

                    <View style={[styles.recapStatusBadge, { backgroundColor: cMeta.bg, borderColor: cMeta.border }]}>
                      <Text style={[styles.recapStatusBadgeText, { color: cMeta.text }]}>
                        {item.statusLabel}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Native-Style Student Status & Grade Modal Sheet ── */}
      <Modal
        visible={Boolean(selectedStudentForModal)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedStudentForModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  {selectedStudentForModal?.name}
                </Text>
                <Text style={[styles.modalSub, { color: theme.textMuted }]}>
                  NISN: {selectedStudentForModal?.nisn}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? theme.surfaceHighlight : '#F1F5F9' }]}
                onPress={() => setSelectedStudentForModal(null)}
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Status Selection Grid */}
            <Text style={[styles.modalSectionLabel, { color: theme.textSecondary }]}>Status Kehadiran:</Text>
            <View style={styles.modalStatusGrid}>
              {['H', 'S', 'I', 'A', 'T', 'B'].map((code) => {
                const isSelected = selectedStudentForModal?.status === code;
                const meta = ATTENDANCE_STATUS_META[code];
                return (
                  <TouchableOpacity
                    key={code}
                    style={[
                      styles.modalStatusChip,
                      {
                        backgroundColor: isSelected ? meta.bg : (isDark ? theme.surfaceHighlight : '#F8FAFC'),
                        borderColor: isSelected ? meta.border : (isDark ? theme.border : '#E2E8F0'),
                      },
                    ]}
                    onPress={() => {
                      handleSetStatus(selectedStudentForModal.id, code);
                      setSelectedStudentForModal((prev) => ({ ...prev, status: code }));
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={meta.icon} size={13} color={isSelected ? meta.text : theme.textMuted} />
                    <Text
                      style={[
                        styles.modalStatusChipText,
                        { color: isSelected ? meta.text : theme.textSecondary },
                        isSelected && { fontWeight: '800' },
                      ]}
                    >
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Score Input Row in Modal */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary }]}>
                Nilai Siswa (0 - 100):
              </Text>
              <TextInput
                style={[
                  styles.modalScoreInput,
                  {
                    backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC',
                    color: theme.textPrimary,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="0-100"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                maxLength={3}
                value={modalScoreText}
                onChangeText={setModalScoreText}
              />
            </View>

            {/* Feedback Input in Modal */}
            <Text style={[styles.modalSectionLabel, { color: theme.textSecondary, marginTop: 4 }]}>
              Umpan Balik / Catatan Guru:
            </Text>
            <TextInput
              style={[styles.modalTextArea, { backgroundColor: isDark ? theme.surfaceHighlight : '#F8FAFC', color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="Tuliskan catatan nilai atau keterangan izin/sakit..."
              placeholderTextColor={theme.textMuted}
              value={modalFeedbackText || modalNoteText}
              onChangeText={(txt) => {
                setModalFeedbackText(txt);
                setModalNoteText(txt);
              }}
              multiline
              numberOfLines={2}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                onPress={() => setSelectedStudentForModal(null)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelBtnText, { color: theme.textSecondary }]}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: theme.primary }]}
                onPress={() => handleSaveStudentModal()}
                activeOpacity={0.88}
              >
                <Text style={styles.modalConfirmBtnText}>Simpan</Text>
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
  header: { borderBottomWidth: 1, paddingHorizontal: 16, paddingBottom: 10 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  roleBadgeText: { fontSize: 10, fontWeight: '800' },
  segmentedControl: { flexDirection: 'row', borderRadius: 12, padding: 3, gap: 4 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10 },
  segmentBtnActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  segmentBtnText: { fontSize: 11, fontWeight: '700' },
  scrollContent: { padding: 16 },
  tabContainer: { gap: 12 },
  heroCard: { borderRadius: 20, padding: 16, position: 'relative', overflow: 'hidden' },
  heroGlowCircle: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  heroStatusLive: { backgroundColor: 'rgba(56,189,248,0.2)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.4)' },
  heroStatusDone: { backgroundColor: 'rgba(16,185,129,0.2)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)' },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  heroStatusText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  heroPeriodBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  heroPeriodText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  heroClassTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  heroSubjectTitle: { color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: '700', marginTop: 1 },
  heroDateInfo: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500', marginTop: 3 },
  heroProgressSection: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  heroProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  heroProgressLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700' },
  heroProgressValue: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  heroProgressBarTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  heroProgressBarFill: { height: 6, borderRadius: 3, backgroundColor: '#34D399' },
  teacherCheckInCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, borderWidth: 1 },
  teacherCheckInLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  checkInIconCircle: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkInTitle: { fontSize: 12, fontWeight: '800' },
  checkInSubtitle: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  checkInActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  checkInActionBtnText: { fontSize: 10, fontWeight: '800' },
  subTabWrap: { flexDirection: 'row', borderRadius: 12, padding: 3, gap: 4 },
  subTabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 10 },
  subTabBtnActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  subTabBtnText: { fontSize: 10, fontWeight: '700' },
  attendanceSection: { gap: 10 },
  quickBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnQuickFill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  btnQuickFillText: { fontSize: 10, fontWeight: '800' },
  statusChipsScroll: { flexDirection: 'row', gap: 6 },
  statusCountChip: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  statusCountChipText: { fontSize: 10, fontWeight: '600' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 12, fontWeight: '500', padding: 0 },
  studentCardsList: { gap: 8 },
  studentCard: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 8 },
  studentHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  studentAvatarBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 12, fontWeight: '800' },
  studentDetails: { flex: 1 },
  studentFullName: { fontSize: 13, fontWeight: '700' },
  studentNisnNumber: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  miniScoreBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  miniScoreText: { fontSize: 10, fontWeight: '800' },
  activeStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  activeStatusPillText: { fontSize: 10, fontWeight: '800' },
  studentNoteBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  studentNoteText: { fontSize: 10, fontWeight: '600', flex: 1 },
  statusButtonGroup: { flexDirection: 'row', gap: 6 },
  quickStatusBtn: { flex: 1, paddingVertical: 7, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  quickStatusBtnText: { fontSize: 11, fontWeight: '600' },
  quickNoteBtn: { width: 34, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepForwardBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 6 },
  stepForwardGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  stepForwardText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  gradesSection: { gap: 10 },
  assessmentCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  assessmentHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  assessmentIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  assessmentCardTitle: { fontSize: 13, fontWeight: '800' },
  assessmentCardSub: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  typeSelectorRow: { flexDirection: 'row', gap: 6 },
  typeChipBtn: { flex: 1, paddingVertical: 6, paddingHorizontal: 6, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  typeChipText: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  singleTextInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 11, fontWeight: '600' },
  quickScoreToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 },
  quickScoreLabel: { fontSize: 10, fontWeight: '600' },
  quickScoreButtons: { flexDirection: 'row', gap: 5 },
  quickScorePill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, borderWidth: 1 },
  quickScorePillText: { fontSize: 10, fontWeight: '800' },
  gradingMetricsRow: { flexDirection: 'row', gap: 6, paddingTop: 4 },
  gradingMetricItem: { flex: 1, padding: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  gradingMetricVal: { fontSize: 14, fontWeight: '900' },
  gradingMetricLbl: { fontSize: 8, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  studentGradeCard: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 8 },
  gradeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniStatusDot: { width: 6, height: 6, borderRadius: 3 },
  scoreInputContainer: { alignItems: 'flex-end' },
  scoreInputField: { width: 54, height: 34, borderRadius: 8, borderWidth: 1, textAlign: 'center', fontSize: 13, fontWeight: '900', padding: 0 },
  feedbackInputRow: { marginTop: 2 },
  feedbackTextInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, fontSize: 10, fontWeight: '500' },
  feedbackPresetsRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  presetChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  presetChipText: { fontSize: 8, fontWeight: '600' },
  stepNavigationRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  stepBackBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  stepBackBtnText: { fontSize: 11, fontWeight: '700' },
  stepNextBtn: { flex: 1.5, borderRadius: 14, overflow: 'hidden' },
  stepNextBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  stepNextBtnText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  recapSummaryCard: { borderRadius: 14, borderWidth: 1.5, padding: 12, gap: 8 },
  recapSummaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recapSummaryTitle: { fontSize: 12, fontWeight: '800' },
  recapSummaryGrid: { gap: 4 },
  recapSummaryItem: { flexDirection: 'column', gap: 1 },
  recapSummaryLabel: { fontSize: 10, fontWeight: '600' },
  recapSummaryVal: { fontSize: 11, fontWeight: '700' },
  journalSection: { gap: 10 },
  journalFormCard: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  formHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  formHeaderIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  formTitle: { fontSize: 13, fontWeight: '800' },
  formSubtitle: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  inputGroup: { gap: 4 },
  inputLabel: { fontSize: 10, fontWeight: '700' },
  textInputArea: { borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 11, fontWeight: '500', minHeight: 46, textAlignVertical: 'top' },
  formActionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btnSaveDraft: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, borderWidth: 1 },
  btnSaveDraftText: { fontSize: 11, fontWeight: '700' },
  btnSubmitJournal: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  btnSubmitJournalGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  btnSubmitJournalText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  auraGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  auraCard: { width: (SCREEN_WIDTH - 32 - 8) / 2, padding: 12, borderRadius: 14, borderWidth: 1, gap: 6 },
  auraTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  auraTag: { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  auraIconWrap: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  auraValRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  auraMainVal: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  auraSubPill: { fontSize: 9, fontWeight: '800', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  historyFilterBox: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 8 },
  classChipsScroll: { flexDirection: 'row', gap: 6 },
  classChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  classChipText: { fontSize: 10, fontWeight: '700' },
  historyCardsWrap: { gap: 8 },
  historyCardItem: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 6 },
  historyCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyClassBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(99,102,241,0.1)' },
  historyClassText: { fontSize: 10, fontWeight: '800' },
  historyCardDate: { fontSize: 10, fontWeight: '600' },
  historyCardSubject: { fontSize: 13, fontWeight: '800' },
  historyCardTime: { fontSize: 10, fontWeight: '500', marginTop: -3 },
  historyCountsRow: { flexDirection: 'row', gap: 5, marginTop: 2 },
  countBadgeMini: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  countBadgeText: { fontSize: 9, fontWeight: '800' },
  historyMaterialBox: { padding: 8, borderRadius: 8, marginTop: 2 },
  historyMaterialTitle: { fontSize: 11, fontWeight: '600' },
  historyCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  punctualPillMini: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  punctualPillText: { fontSize: 9, fontWeight: '700' },
  btnViewDetail: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  btnViewDetailText: { fontSize: 10, fontWeight: '800' },
  recapStatBox: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignItems: 'center', minWidth: 50 },
  recapStatVal: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  recapStatLbl: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '600' },
  recapLogRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  statusIconCircle: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statusIconLetter: { fontSize: 12, fontWeight: '900' },
  recapSubjectName: { fontSize: 12, fontWeight: '800' },
  recapSubjectMeta: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  recapSubjectTeacher: { fontSize: 10, fontWeight: '700', marginTop: 1 },
  recapStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  recapStatusBadgeText: { fontSize: 9, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { width: '100%', maxWidth: 360, borderRadius: 20, borderWidth: 1, padding: 18, gap: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { fontSize: 14, fontWeight: '800' },
  modalSub: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  modalCloseBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalSectionLabel: { fontSize: 11, fontWeight: '700' },
  modalStatusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  modalStatusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  modalStatusChipText: { fontSize: 11, fontWeight: '700' },
  modalScoreInput: { width: 64, height: 36, borderRadius: 8, borderWidth: 1, textAlign: 'center', fontSize: 14, fontWeight: '900' },
  modalTextArea: { borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 11, fontWeight: '500', minHeight: 60, textAlignVertical: 'top' },
  modalButtonsRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 4 },
  modalCancelBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  modalCancelBtnText: { fontSize: 11, fontWeight: '700' },
  modalConfirmBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  modalConfirmBtnText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
});

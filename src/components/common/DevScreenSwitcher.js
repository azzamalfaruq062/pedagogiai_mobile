import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROUTES } from '../../constants/routes';

export default function DevScreenSwitcher({ currentRoute, onSelectRoute }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const groups = [
    {
      title: 'Kursus & Pembelajaran (Siswa)',
      icon: 'school-outline',
      items: [
        { id: ROUTES.MAIN.COURSE_LIST, label: 'Daftar Course', icon: 'library-outline' },
        { id: ROUTES.MAIN.COURSE_DETAIL, label: 'Detail Course', icon: 'book-outline' },
        { id: ROUTES.MAIN.LESSON, label: 'Materi / Lesson', icon: 'reader-outline' },
        { id: ROUTES.MAIN.QUIZ_ATTEMPT, label: 'Quiz (Pengerjaan)', icon: 'clipboard-outline' },
        { id: ROUTES.MAIN.QUIZ_RESULT, label: 'Hasil Quiz', icon: 'trophy-outline' },
      ],
    },
    {
      title: 'Presensi & Kegiatan Guru',
      icon: 'calendar-outline',
      items: [
        { id: ROUTES.MAIN.LOCATION_ATTENDANCE, label: 'Presensi Lokasi GPS (Geofence)', icon: 'location-outline' },
        { id: ROUTES.MAIN.ATTENDANCE, label: 'Presensi & Jurnal KBM', icon: 'checkbox-outline' },
        { id: ROUTES.MAIN.EKSKUL_ATTENDANCE, label: 'Presensi & Log Ekskul', icon: 'ribbon-outline' },
      ],
    },
    {
      title: 'E-Kantin Terpadu',
      icon: 'restaurant-outline',
      items: [
        { id: ROUTES.MAIN.CANTEEN_MENU, label: 'Menu Kantin', icon: 'restaurant-outline' },
        { id: ROUTES.MAIN.CANTEEN_WALLET, label: 'Dompet & QR', icon: 'wallet-outline' },
        { id: ROUTES.MAIN.CANTEEN_HISTORY, label: 'Riwayat Pesanan', icon: 'receipt-outline' },
      ],
    },
    {
      title: 'Umum & Autentikasi',
      icon: 'person-outline',
      items: [
        { id: ROUTES.AUTH.ONBOARDING, label: 'Onboarding (Lottie)', icon: 'sparkles-outline' },
        { id: ROUTES.MAIN.DASHBOARD, label: 'Beranda (Dashboard)', icon: 'home-outline' },
        { id: ROUTES.MAIN.PROFILE, label: 'Akun & Profil', icon: 'person-outline' },
        { id: ROUTES.AUTH.LOGIN, label: 'Login', icon: 'key-outline' },
        { id: ROUTES.AUTH.REGISTER, label: 'Register', icon: 'create-outline' },
      ],
    },
  ];

  const handleSelect = (routeId) => {
    onSelectRoute(routeId);
    setIsOpen(false);
  };

  const bottomInset = Math.max(insets.bottom, 14);

  return (
    <>
      {/* Floating Trigger Pill */}
      <TouchableOpacity
        style={[
          styles.floatingBtn,
          {
            bottom: bottomInset + 76,
            backgroundColor: isDark ? '#1E293B' : '#1C2E5A',
            borderColor: isDark ? '#38BDF8' : '#6366F1',
          },
        ]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="flask" size={14} color="#38BDF8" />
        <Text style={styles.floatingBtnText}>Uji UI</Text>
      </TouchableOpacity>

      {/* Modal Screen Selector */}
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />

          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
                paddingBottom: bottomInset + 12,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <View style={styles.sheetTitleRow}>
                <View style={[styles.sheetIconBox, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
                  <Ionicons name="flask" size={18} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                    Mode Uji Coba UI
                  </Text>
                  <Text style={[styles.sheetSubtitle, { color: theme.textMuted }]}>
                    Pilih halaman untuk berpindah secara instan
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                onPress={() => setIsOpen(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* List of Screens */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetScroll}
            >
              {groups.map((group) => (
                <View key={group.title} style={styles.groupWrap}>
                  <View style={styles.groupHeaderRow}>
                    <Ionicons name={group.icon} size={14} color={theme.primary} />
                    <Text style={[styles.groupTitle, { color: theme.textMuted }]}>
                      {group.title.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.groupGrid}>
                    {group.items.map((item) => {
                      const isActive = currentRoute === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.itemChip,
                            {
                              backgroundColor: isActive
                                ? theme.primary
                                : isDark
                                ? '#1E293B'
                                : '#F8FAFC',
                              borderColor: isActive
                                ? theme.primary
                                : isDark
                                ? '#334155'
                                : '#E2E8F0',
                            },
                          ]}
                          onPress={() => handleSelect(item.id)}
                          activeOpacity={0.75}
                        >
                          <Ionicons
                            name={item.icon}
                            size={14}
                            color={isActive ? '#FFFFFF' : theme.textSecondary}
                          />
                          <Text
                            style={[
                              styles.itemText,
                              {
                                color: isActive ? '#FFFFFF' : theme.textPrimary,
                                fontWeight: isActive ? '800' : '600',
                              },
                            ]}
                          >
                            {item.label}
                          </Text>
                          {isActive && (
                            <View style={styles.activePill}>
                              <Text style={styles.activePillText}>Aktif</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingBtn: {
    position: 'absolute',
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  floatingBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sheetIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sheetSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20,
  },
  groupWrap: {
    gap: 10,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemText: {
    fontSize: 12,
  },
  activePill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 2,
  },
  activePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
});


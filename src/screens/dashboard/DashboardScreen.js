import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

import SiswaDashboardView from './roles/SiswaDashboardView';
import GuruDashboardView from './roles/GuruDashboardView';
import AdminDashboardView from './roles/AdminDashboardView';
import KaryawanDashboardView from './roles/KaryawanDashboardView';
import KantinDashboardView from './roles/KantinDashboardView';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen({
  onNavigateToCanteen,
  onNavigateToWallet,
  onNavigateToProfile,
  onNavigateToCourseList,
  onNavigateToCourseDetail,
  onNavigateToAttendance,
  onNavigateToLocationAttendance,
}) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const dynamicPaddingTop = safeTop + 62;
  const dynamicPaddingBottom = Math.max(insets.bottom || 0, 14) + 86;

  const getNormalizedRole = (r) => {
    if (!r) return 'siswa';
    const lower = String(r).toLowerCase().trim();
    if (['guru', 'pengajar', 'teacher'].includes(lower)) return 'guru';
    if (['admin', 'superadmin', 'super_admin'].includes(lower)) return 'admin';
    if (['karyawan', 'tendik', 'staf', 'staff', 'it_staff', 'staf_it'].includes(lower)) return 'karyawan';
    if (['kantin', 'canteen', 'stan_kantin', 'vendor'].includes(lower)) return 'kantin';
    return 'siswa';
  };

  const userRole = getNormalizedRole(user?.role);

  const renderRoleDashboard = () => {
    switch (userRole) {
      case 'guru':
        return (
          <GuruDashboardView
            onNavigateToCourseList={onNavigateToCourseList}
            onNavigateToCourseDetail={onNavigateToCourseDetail}
            onNavigateToProfile={onNavigateToProfile}
            onNavigateToCanteen={onNavigateToCanteen}
            onNavigateToAttendance={onNavigateToAttendance}
            onNavigateToLocationAttendance={onNavigateToLocationAttendance}
          />
        );
      case 'admin':
        return (
          <AdminDashboardView
            onNavigateToCourseList={onNavigateToCourseList}
            onNavigateToCourseDetail={onNavigateToCourseDetail}
            onNavigateToCanteen={onNavigateToCanteen}
            onNavigateToWallet={onNavigateToWallet}
            onNavigateToProfile={onNavigateToProfile}
          />
        );
      case 'karyawan':
        return (
          <KaryawanDashboardView
            onNavigateToProfile={onNavigateToProfile}
            onNavigateToCanteen={onNavigateToCanteen}
            onNavigateToWallet={onNavigateToWallet}
            onNavigateToCourseList={onNavigateToCourseList}
            onNavigateToLocationAttendance={onNavigateToLocationAttendance}
          />
        );
      case 'kantin':
        return (
          <KantinDashboardView
            onNavigateToProfile={onNavigateToProfile}
            onNavigateToCanteen={onNavigateToCanteen}
            onNavigateToWallet={onNavigateToWallet}
          />
        );
      case 'siswa':
      default:
        return (
          <SiswaDashboardView
            onNavigateToCanteen={onNavigateToCanteen}
            onNavigateToWallet={onNavigateToWallet}
            onNavigateToProfile={onNavigateToProfile}
            onNavigateToCourseList={onNavigateToCourseList}
            onNavigateToCourseDetail={onNavigateToCourseDetail}
            onNavigateToAttendance={onNavigateToAttendance}
            onNavigateToLocationAttendance={onNavigateToLocationAttendance}
          />
        );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: dynamicPaddingTop,
          paddingBottom: dynamicPaddingBottom,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {renderRoleDashboard()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
});

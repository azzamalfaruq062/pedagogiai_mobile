import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export default function AuthSegmentedControl({ activeTab, onTabChange }) {
  const { theme, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#101626' : '#F1F5F9',
          borderColor: isDark ? '#1E293B' : '#E2E8F0',
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'login' && [
            styles.activeTab,
            {
              backgroundColor: isDark ? '#1E2742' : '#FFFFFF',
              shadowColor: theme.primary,
              shadowOpacity: isDark ? 0.35 : 0.1,
            },
          ],
        ]}
        onPress={() => onTabChange('login')}
        activeOpacity={0.75}
      >
        <Ionicons
          name={activeTab === 'login' ? 'log-in' : 'log-in-outline'}
          size={16}
          color={activeTab === 'login' ? theme.primary : theme.textMuted}
          style={styles.tabIcon}
        />
        <Text
          style={[
            styles.tabText,
            {
              color: activeTab === 'login' ? theme.primary : theme.textSecondary,
              fontWeight: activeTab === 'login' ? '800' : '600',
            },
          ]}
        >
          Masuk
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'register' && [
            styles.activeTab,
            {
              backgroundColor: isDark ? '#1E2742' : '#FFFFFF',
              shadowColor: theme.primary,
              shadowOpacity: isDark ? 0.35 : 0.1,
            },
          ],
        ]}
        onPress={() => onTabChange('register')}
        activeOpacity={0.75}
      >
        <Ionicons
          name={activeTab === 'register' ? 'sparkles' : 'sparkles-outline'}
          size={15}
          color={activeTab === 'register' ? theme.primary : theme.textMuted}
          style={styles.tabIcon}
        />
        <Text
          style={[
            styles.tabText,
            {
              color: activeTab === 'register' ? theme.primary : theme.textSecondary,
              fontWeight: activeTab === 'register' ? '800' : '600',
            },
          ]}
        >
          Daftar Siswa
        </Text>
        <View
          style={[
            styles.newBadge,
            {
              backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : '#DCFCE7',
            },
          ]}
        >
          <Text style={styles.newBadgeText}>Baru</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    gap: 6,
  },
  tabIcon: {
    marginRight: 2,
  },
  activeTab: {
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginLeft: 4,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: -0.2,
  },
});

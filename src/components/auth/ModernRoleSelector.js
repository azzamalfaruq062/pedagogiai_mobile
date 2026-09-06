import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { ROLE_DEFINITIONS, USER_ROLES } from '../../constants/roles';

export default function ModernRoleSelector({ selectedRole, onSelectRole }) {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Daftar Sebagai
      </Text>

      <View style={styles.cardsRow}>
        {ROLE_DEFINITIONS.map((roleItem) => {
          const isSelected = selectedRole === roleItem.id;
          const isEnabled = roleItem.enabled;

          return (
            <TouchableOpacity
              key={roleItem.id}
              disabled={!isEnabled}
              onPress={() => onSelectRole(roleItem.id)}
              activeOpacity={0.8}
              style={[
                styles.card,
                {
                  backgroundColor: !isEnabled
                    ? isDark
                      ? '#101423'
                      : '#F1F5F9'
                    : isSelected
                    ? isDark
                      ? 'rgba(99, 102, 241, 0.16)'
                      : 'rgba(99, 102, 241, 0.08)'
                    : isDark
                    ? '#141A2D'
                    : '#FFFFFF',
                  borderColor: isSelected
                    ? theme.primary
                    : isDark
                    ? '#202A44'
                    : '#E2E8F0',
                  borderWidth: isSelected ? 2 : 1,
                  opacity: !isEnabled ? 0.65 : 1,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isSelected
                        ? theme.primaryLight
                        : isDark
                        ? '#1A233C'
                        : '#EDF2F7',
                    },
                  ]}
                >
                  <Ionicons
                    name={roleItem.icon}
                    size={18}
                    color={
                      !isEnabled
                        ? theme.textMuted
                        : isSelected
                        ? theme.primary
                        : theme.textSecondary
                    }
                  />
                </View>

                <View
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(99, 102, 241, 0.35)'
                          : '#E0E7FF'
                        : isDark
                        ? '#1E253E'
                        : '#E2E8F0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: isSelected
                          ? theme.primary
                          : theme.textMuted,
                      },
                    ]}
                  >
                    {roleItem.badge}
                  </Text>
                </View>
              </View>

              <Text style={[styles.roleName, { color: theme.textPrimary }]}>
                {roleItem.label}
              </Text>
              <Text
                style={[styles.roleDesc, { color: theme.textMuted }]}
                numberOfLines={2}
              >
                {roleItem.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  roleName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
});

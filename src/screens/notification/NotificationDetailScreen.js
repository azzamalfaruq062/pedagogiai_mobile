import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { notificationApi } from '../../api/notificationApi';

const ICON_MAP = {
  'ticket': 'ticket-outline',
  'notifications': 'notifications-outline',
  'person-add': 'person-add-outline',
  'chatbubble': 'chatbubble-outline',
  'checkmark-circle': 'checkmark-circle-outline',
  'warning': 'warning-outline',
  'school': 'school-outline',
  'megaphone': 'megaphone-outline',
};

const SOURCE_LABELS = {
  'ticket': { label: 'Tiket IT & Bantuan', icon: 'ticket-outline' },
  'quiz': { label: 'Permohonan Kuis', icon: 'school-outline' },
  'broadcast': { label: 'Pengumuman Sekolah', icon: 'megaphone-outline' },
};

function InfoRow({ icon, label, value, color, theme, isDark }) {
  return (
    <View
      style={[
        styles.infoRow,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        },
      ]}
    >
      <View
        style={[
          styles.infoIconBox,
          { backgroundColor: (color || '#6366F1') + '15' },
        ]}
      >
        <Ionicons name={icon} size={16} color={color || '#6366F1'} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function NotificationDetailScreen({ notification: passedNotif, onBack }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [detail, setDetail] = useState(passedNotif || null);
  const [isLoading, setIsLoading] = useState(!passedNotif);
  const [error, setError] = useState(null);

  // Fetch full detail from server if we need richer data
  useEffect(() => {
    if (!passedNotif?.id) return;

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        const data = await notificationApi.getDetail(passedNotif.id);
        if (data.success && data.notification) {
          setDetail({ ...passedNotif, ...data.notification });
        }
      } catch {
        // Use passed data as fallback — detail fetch is optional enrichment
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();

    // Auto-mark as read
    if (!passedNotif.is_read && typeof passedNotif.id === 'number') {
      notificationApi.markAsRead(passedNotif.id).catch(() => {});
    }
  }, [passedNotif?.id]);

  const iconName = ICON_MAP[detail?.icon] || 'notifications-outline';
  const sourceInfo = SOURCE_LABELS[detail?.source] || SOURCE_LABELS.ticket;

  if (isLoading && !detail) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            Memuat detail notifikasi...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark
              ? 'rgba(15, 23, 42, 0.95)'
              : 'rgba(255, 255, 255, 0.97)',
            borderBottomColor: isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.04)',
            },
          ]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Detail Notifikasi
          </Text>
        </View>

        <View style={styles.placeholderBtn} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark
                ? 'rgba(30, 41, 59, 0.6)'
                : '#FFFFFF',
              borderColor: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          {/* Icon + Source Badge */}
          <View style={styles.heroTop}>
            <View
              style={[
                styles.heroIcon,
                { backgroundColor: (detail?.color || '#6366F1') + '15' },
              ]}
            >
              <Ionicons
                name={iconName}
                size={32}
                color={detail?.color || '#6366F1'}
              />
            </View>

            <View
              style={[
                styles.sourcePill,
                {
                  backgroundColor: (detail?.color || '#6366F1') + '12',
                  borderColor: (detail?.color || '#6366F1') + '25',
                },
              ]}
            >
              <Ionicons
                name={sourceInfo.icon}
                size={12}
                color={detail?.color || '#6366F1'}
              />
              <Text
                style={[styles.sourcePillText, { color: detail?.color || '#6366F1' }]}
              >
                {sourceInfo.label}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
            {detail?.title || 'Notifikasi'}
          </Text>

          {/* Time */}
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={13} color={theme.textMuted} />
            <Text style={[styles.timeText, { color: theme.textMuted }]}>
              {detail?.created_at_formatted || detail?.time_ago || 'Baru saja'}
            </Text>
          </View>

          {/* Read status */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: detail?.is_read
                    ? (isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)')
                    : (isDark ? 'rgba(244, 63, 94, 0.12)' : 'rgba(244, 63, 94, 0.08)'),
                },
              ]}
            >
              <Ionicons
                name={detail?.is_read ? 'checkmark-circle' : 'ellipse'}
                size={12}
                color={detail?.is_read ? '#10B981' : '#F43F5E'}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: detail?.is_read ? '#10B981' : '#F43F5E' },
                ]}
              >
                {detail?.is_read ? 'Sudah Dibaca' : 'Belum Dibaca'}
              </Text>
            </View>
          </View>
        </View>

        {/* Message Card */}
        <View
          style={[
            styles.messageCard,
            {
              backgroundColor: isDark
                ? 'rgba(30, 41, 59, 0.6)'
                : '#FFFFFF',
              borderColor: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
            Isi Pesan
          </Text>
          <Text style={[styles.messageText, { color: theme.textPrimary }]}>
            {detail?.message || 'Tidak ada pesan.'}
          </Text>
        </View>

        {/* Ticket Details (if available) */}
        {detail?.ticket && (
          <View
            style={[
              styles.detailsCard,
              {
                backgroundColor: isDark
                  ? 'rgba(30, 41, 59, 0.6)'
                  : '#FFFFFF',
                borderColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.06)',
              },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
              Detail Tiket
            </Text>
            <View style={styles.detailsList}>
              <InfoRow
                icon="pricetag-outline"
                label="ID Tiket"
                value={`#${detail.ticket.id}`}
                color="#3B82F6"
                theme={theme}
                isDark={isDark}
              />
              <InfoRow
                icon="document-text-outline"
                label="Subjek"
                value={detail.ticket.subject || '-'}
                color="#6366F1"
                theme={theme}
                isDark={isDark}
              />
              <InfoRow
                icon="flag-outline"
                label="Status"
                value={detail.ticket.status || '-'}
                color="#10B981"
                theme={theme}
                isDark={isDark}
              />
              <InfoRow
                icon="alert-circle-outline"
                label="Prioritas"
                value={detail.ticket.priority || '-'}
                color="#F59E0B"
                theme={theme}
                isDark={isDark}
              />
            </View>
          </View>
        )}

        {/* Quiz Request Details (if available) */}
        {detail?.detail && detail.source === 'quiz' && (
          <View
            style={[
              styles.detailsCard,
              {
                backgroundColor: isDark
                  ? 'rgba(30, 41, 59, 0.6)'
                  : '#FFFFFF',
                borderColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.06)',
              },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
              Detail Permohonan
            </Text>
            <View style={styles.detailsList}>
              <InfoRow
                icon="person-outline"
                label="Nama Siswa"
                value={detail.detail.student_name}
                color="#3B82F6"
                theme={theme}
                isDark={isDark}
              />
              <InfoRow
                icon="book-outline"
                label="Kuis"
                value={detail.detail.quiz_title}
                color="#6366F1"
                theme={theme}
                isDark={isDark}
              />
              <InfoRow
                icon="chatbox-outline"
                label="Alasan"
                value={detail.detail.reason}
                color="#F59E0B"
                theme={theme}
                isDark={isDark}
              />
              <InfoRow
                icon="hourglass-outline"
                label="Status"
                value={detail.detail.status}
                color="#10B981"
                theme={theme}
                isDark={isDark}
              />
            </View>
          </View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  placeholderBtn: {
    width: 38,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  sourcePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  messageCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  detailsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  detailsList: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});

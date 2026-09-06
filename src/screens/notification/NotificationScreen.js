import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useNotifications } from '../../hooks/useNotifications';

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

function NotificationItem({ item, onPress, theme, isDark }) {
  const iconName = ICON_MAP[item.icon] || 'notifications-outline';
  const isUnread = !item.is_read;

  return (
    <TouchableOpacity
      style={[
        styles.notifItem,
        {
          backgroundColor: isUnread
            ? (isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)')
            : (isDark ? 'rgba(30, 41, 59, 0.5)' : '#FFFFFF'),
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: item.color + '18' },
        ]}
      >
        <Ionicons name={iconName} size={20} color={item.color} />
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          {isUnread && <View style={styles.unreadDot} />}
          <Text
            style={[
              styles.notifTitle,
              {
                color: theme.textPrimary,
                fontWeight: isUnread ? '700' : '600',
              },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </View>
        <Text
          style={[styles.notifMessage, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {item.message}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={11} color={theme.textMuted} />
          <Text style={[styles.timeText, { color: theme.textMuted }]}>
            {item.time_ago}
          </Text>
          {item.source && (
            <View
              style={[
                styles.sourceBadge,
                { backgroundColor: item.color + '15', borderColor: item.color + '30' },
              ]}
            >
              <Text style={[styles.sourceBadgeText, { color: item.color }]}>
                {item.source === 'ticket' ? 'Tiket' : item.source === 'quiz' ? 'Kuis' : 'Info'}
              </Text>
            </View>
          )}
          {/* Chevron indicator for detail navigation */}
          <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ theme, isDark }) {
  return (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconCircle,
          {
            backgroundColor: isDark
              ? 'rgba(99, 102, 241, 0.1)'
              : 'rgba(99, 102, 241, 0.06)',
          },
        ]}
      >
        <Ionicons
          name="notifications-off-outline"
          size={48}
          color={isDark ? '#6366F1' : '#818CF8'}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        Semua Beres! 🎉
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Tidak ada notifikasi baru untuk Anda saat ini.{'\n'}Kami akan beri tahu saat ada yang penting.
      </Text>
    </View>
  );
}

export default function NotificationScreen({ onBack, onOpenDetail }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications(true); // active=true → full list polling

  const handleNotifPress = useCallback(
    (item) => {
      // Mark as read optimistically
      if (!item.is_read && typeof item.id === 'number') {
        markAsRead(item.id);
      }
      // Navigate to detail screen
      if (onOpenDetail) {
        onOpenDetail(item);
      }
    },
    [markAsRead, onOpenDetail]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <NotificationItem
        item={item}
        onPress={handleNotifPress}
        theme={theme}
        isDark={isDark}
      />
    ),
    [handleNotifPress, theme, isDark]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

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
            Notifikasi
          </Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity
            style={[
              styles.markAllBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(99, 102, 241, 0.15)'
                  : 'rgba(99, 102, 241, 0.08)',
              },
            ]}
            onPress={markAllAsRead}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-done" size={16} color="#6366F1" />
            <Text style={styles.markAllText}>Tandai Semua</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderBtn} />
        )}
      </View>

      {/* Live indicator */}
      <View
        style={[
          styles.liveBar,
          {
            backgroundColor: isDark
              ? 'rgba(16, 185, 129, 0.08)'
              : 'rgba(16, 185, 129, 0.06)',
            borderBottomColor: isDark
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(0,0,0,0.04)',
          },
        ]}
      >
        <View style={styles.liveDot} />
        <Text style={[styles.liveText, { color: theme.textMuted }]}>
          Realtime • Auto-update
        </Text>
        {isLoading && (
          <ActivityIndicator
            size="small"
            color="#6366F1"
            style={{ marginLeft: 8 }}
          />
        )}
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="cloud-offline-outline" size={14} color="#F43F5E" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notification List */}
      {isLoading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            Memuat notifikasi...
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={<EmptyState theme={theme} isDark={isDark} />}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor="#6366F1"
              colors={['#6366F1']}
            />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },
  placeholderBtn: {
    width: 38,
  },
  liveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  errorText: {
    flex: 1,
    fontSize: 11,
    color: '#F43F5E',
    fontWeight: '500',
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
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
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  notifItem: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F43F5E',
  },
  notifTitle: {
    fontSize: 13,
    flex: 1,
  },
  notifMessage: {
    fontSize: 12,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 10.5,
    fontWeight: '500',
    flex: 1,
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  sourceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
});

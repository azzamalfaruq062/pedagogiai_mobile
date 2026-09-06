import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { notificationApi } from '../api/notificationApi';

// Adaptive intervals: 60s for idle badge polling, faster when screen is open
const IDLE_POLL_INTERVAL = 60000;   // 60 seconds — badge-only, very lightweight
const ACTIVE_POLL_INTERVAL = 20000; // 20 seconds — when notification screen is open

/**
 * Adaptive real-time notification hook.
 *
 * Strategy to minimize server load:
 * - Badge mode (default): Polls count-only endpoint every 60s — returns just a number
 * - Active mode: When notification screen is open, polls full list every 20s
 * - Pauses entirely when app is in background
 * - Server caches responses for 15-20s, so even concurrent requests are cheap
 */
export function useNotifications(active = false) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const isMountedRef = useRef(true);
  const isActiveRef = useRef(active);

  // Keep active ref in sync
  useEffect(() => {
    isActiveRef.current = active;
  }, [active]);

  // Lightweight count-only fetch (for badge polling)
  const fetchCountOnly = useCallback(async () => {
    try {
      const data = await notificationApi.getCount();
      if (isMountedRef.current) {
        setUnreadCount(data.count || 0);
      }
    } catch {
      // Silent failure for badge polling — don't show errors
    }
  }, []);

  // Full notifications fetch (when screen is open)
  const fetchNotifications = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      const data = await notificationApi.getNotifications();

      if (isMountedRef.current) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err?.message || 'Gagal memuat notifikasi');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await notificationApi.markAsRead(id);
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      await notificationApi.markAllAsRead();
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const refresh = useCallback(() => {
    return fetchNotifications(true);
  }, [fetchNotifications]);

  // Adaptive polling: count-only when idle, full list when active
  useEffect(() => {
    const getInterval = () =>
      isActiveRef.current ? ACTIVE_POLL_INTERVAL : IDLE_POLL_INTERVAL;

    const poll = () => {
      if (isActiveRef.current) {
        fetchNotifications(false);
      } else {
        fetchCountOnly();
      }
    };

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(poll, getInterval());
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App returned to foreground
        poll();
        startPolling();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background — stop ALL polling
        stopPolling();
      }
      appStateRef.current = nextAppState;
    });

    // Initial fetch
    if (active) {
      fetchNotifications(true);
    } else {
      fetchCountOnly();
    }
    startPolling();

    return () => {
      stopPolling();
      subscription?.remove();
    };
  }, [active, fetchNotifications, fetchCountOnly]);

  // Track mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}

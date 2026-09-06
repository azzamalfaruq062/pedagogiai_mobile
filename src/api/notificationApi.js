import { apiClient } from './client';

export const notificationApi = {
  /**
   * Lightweight count-only endpoint — used for badge polling.
   * Returns { success, count } only, no notification data.
   */
  getCount: async () => {
    return apiClient('/notifications/count');
  },

  /**
   * Full notifications list — only called when user opens notification screen.
   */
  getNotifications: async () => {
    return apiClient('/notifications');
  },

  /**
   * Get single notification detail by ID
   */
  getDetail: async (id) => {
    return apiClient(`/notifications/${id}`);
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id) => {
    return apiClient(`/notifications/${id}/read`, { method: 'POST', body: {} });
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    return apiClient('/notifications/mark-all-read', { method: 'POST', body: {} });
  },
};

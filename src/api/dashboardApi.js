import { apiClient } from './client';

export const dashboardApi = {
  /**
   * Fetch tailored dashboard summary based on authenticated user's role
   */
  getSummary: async () => {
    return apiClient('/dashboard/summary');
  },

  /**
   * Send school-wide announcement broadcast (Admin/Staff)
   */
  sendBroadcast: async (payload) => {
    return apiClient('/dashboard/broadcast', { body: payload });
  },
};

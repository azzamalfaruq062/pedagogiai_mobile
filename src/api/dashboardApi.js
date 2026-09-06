import { apiClient } from './client';

export const dashboardApi = {
  /**
   * Fetch tailored dashboard summary based on authenticated user's role
   */
  getSummary: async () => {
    return apiClient('/dashboard/summary');
  },
};

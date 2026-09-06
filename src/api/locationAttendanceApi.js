import { apiClient } from './client';

export const locationAttendanceApi = {
  /**
   * Fetch all registered and active office geofences
   */
  getOffices: async () => {
    return apiClient('/location-attendance/offices');
  },

  /**
   * Fetch authenticated user's location attendance status for today
   */
  getTodayStatus: async () => {
    return apiClient('/location-attendance/today');
  },

  /**
   * Submit Check-In Location Attendance
   * @param {Object} payload { office_id, latitude, longitude, accuracy, is_mock_location, device_id, idempotency_key, client_timestamp, notes }
   */
  checkIn: async (payload) => {
    return apiClient('/location-attendance/check-in', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Submit Check-Out Location Attendance
   * @param {Object} payload { office_id, latitude, longitude, accuracy, is_mock_location, device_id, idempotency_key, client_timestamp, notes }
   */
  checkOut: async (payload) => {
    return apiClient('/location-attendance/check-out', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Retrieve location attendance history
   * @param {number} limit
   */
  getHistory: async (limit = 30) => {
    return apiClient(`/location-attendance/history?limit=${limit}`);
  },

  /**
   * Fetch dynamic map provider configuration from backend
   */
  getMapConfig: async () => {
    return apiClient('/location-attendance/map-config');
  },
};

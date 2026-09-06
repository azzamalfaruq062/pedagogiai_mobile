import { apiClient } from './client';

export const ekskulApi = {
  /**
   * Fetch list of all extracurriculars coached by the authenticated teacher
   */
  getMyEkskuls: async () => {
    return apiClient('/ekskul/my-ekskuls');
  },

  /**
   * Fetch detail of an extracurricular, its active session (if any), active students, matrix, and meeting logs
   */
  getEkskulDetail: async (id) => {
    return apiClient(`/ekskul/${id}`);
  },

  /**
   * Fase 1: Mulai Pertemuan & Presensi Awal Anggota Ekskul
   * data: { title, description, achievement_notes, attendances: { [studentId]: 'hadir' | 'izin' | 'sakit' | 'alpha' } }
   */
  startSession: async (id, data) => {
    return apiClient(`/ekskul/${id}/start-session`, {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Fase 2: Selesaikan Pertemuan Ekskul (Otomatis Isi Jam Selesai)
   * data: { description, achievement_notes }
   */
  finishSession: async (activityId, data = {}) => {
    return apiClient(`/ekskul/activities/${activityId}/finish`, {
      method: 'POST',
      body: data,
    });
  },
};

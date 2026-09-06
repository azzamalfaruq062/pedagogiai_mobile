import { apiClient } from './client';

export const attendanceApi = {
  /**
   * Fetch active KBM session details, schedule info, and student list
   */
  getActiveSession: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/attendance/active-session${query ? `?${query}` : ''}`);
  },

  /**
   * Record teacher check-in for active journal session
   */
  checkIn: async (journalId) => {
    return apiClient('/attendance/check-in', {
      method: 'POST',
      body: { journal_id: journalId },
    });
  },

  /**
   * Batch update student attendance records
   */
  updateStudents: async (journalId, attendances, notes = {}) => {
    return apiClient('/attendance/update-students', {
      method: 'POST',
      body: {
        journal_id: journalId,
        attendances,
        notes,
      },
    });
  },

  /**
   * Save student learning grades (Formatif / Sumatif / Projek)
   */
  saveGrades: async ({ journalId, assessmentType, title, scores, gradeNotes = {} }) => {
    return apiClient('/attendance/save-grades', {
      method: 'POST',
      body: {
        journal_id: journalId,
        assessment_type: assessmentType,
        title,
        scores,
        grade_notes: gradeNotes,
      },
    });
  },

  /**
   * Finish session and save journal notes
   */
  finishSession: async (journalId, { teachingMaterial, learningActivitiesNotes }) => {
    return apiClient('/attendance/finish-session', {
      method: 'POST',
      body: {
        journal_id: journalId,
        teaching_material: teachingMaterial,
        learning_activities_notes: learningActivitiesNotes,
      },
    });
  },

  /**
   * One-shot submission: attendance, grades, journal notes, and optional finish flag
   */
  saveAllSession: async (payload) => {
    return apiClient('/attendance/save-all', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Fetch history of teaching journals with filters and KPI metrics
   */
  getHistory: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/attendance/history${query ? `?${query}` : ''}`);
  },

  /**
   * Fetch overall attendance statistics
   */
  getStats: async () => {
    return apiClient('/attendance/stats');
  },
};

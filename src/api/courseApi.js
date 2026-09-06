import { apiClient } from './client';

export const courseApi = {
  /**
   * Fetch list of available courses with enrollment & progress status
   */
  getCourses: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/courses${query ? `?${query}` : ''}`);
  },

  /**
   * Fetch courses created strictly by the authenticated teacher
   */
  getMyCourses: async () => {
    return apiClient('/courses?my_courses=1');
  },

  /**
   * Update course details (teacher owner or admin)
   */
  updateCourse: async (id, data) => {
    return apiClient(`/courses/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * Fetch full course detail with structured chapters & sub-chapters syllabus
   */
  getCourseDetail: async (id) => {
    return apiClient(`/courses/${id}`);
  },

  /**
   * Enroll current authenticated user in a course
   */
  enrollCourse: async (id) => {
    return apiClient(`/courses/${id}/enroll`, {
      method: 'POST',
    });
  },

  /**
   * Fetch lesson content, interactive activities, and progress for a sub-chapter
   */
  getLessonContent: async (subChapterId) => {
    return apiClient(`/sub-chapters/${subChapterId}/content`);
  },

  /**
   * Mark a lesson/sub-chapter as completed and record progress
   */
  completeLesson: async (subChapterId, timeSpent = 60) => {
    return apiClient(`/sub-chapters/${subChapterId}/complete`, {
      method: 'POST',
      body: { time_spent: timeSpent },
    });
  },

  /**
   * Fetch quiz questions and settings for examination attempt
   */
  getQuiz: async (quizId) => {
    return apiClient(`/quizzes/${quizId}`);
  },

  /**
   * Submit student answers for evaluation and grading
   */
  submitQuiz: async (quizId, payload) => {
    return apiClient(`/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: payload,
    });
  },
};

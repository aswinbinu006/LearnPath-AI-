import { api } from './api.js';
import { Course } from '../types/index.js';

export const courseService = {
  async listCourses(params?: { category?: string; search?: string }): Promise<Course[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);

    const queryString = query.toString();
    const endpoint = queryString ? `/courses?${queryString}` : '/courses';
    const response = await api.get<{ success: boolean; data: Course[] }>(endpoint);
    if (!response.success) {
      throw new Error('Failed to load courses');
    }
    return response.data;
  },

  async getCourseBySlug(slug: string): Promise<Course> {
    const response = await api.get<{ success: boolean; data: Course }>(`/courses/${slug}`);
    if (!response.success) {
      throw new Error('Course not found');
    }
    return response.data;
  },

  async getCourses(params?: { category?: string; search?: string }): Promise<Course[]> {
    return this.listCourses(params);
  },

  async completeCourse(slug: string): Promise<{ success: boolean; message?: string }> {
    return api.post(`/courses/${slug}/complete`);
  },

  async getCourseQuiz(slug: string): Promise<{ courseTitle: string; category: string; questions: any[] }> {
    const response = await api.get<{ success: boolean; data: { courseTitle: string; category: string; questions: any[] } }>(
      `/courses/${slug}/quiz`
    );
    return response.data;
  },

  async submitCourseQuiz(slug: string, payload: {
    answers: { questionId: string; selectedOptionIndex: number }[];
    timeTakenSeconds?: number;
    hintsUsed?: number;
  }): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>(
      `/courses/${slug}/quiz-attempt`,
      payload
    );
    return response.data;
  },
};

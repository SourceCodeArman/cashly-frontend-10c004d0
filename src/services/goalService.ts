import { axiosInstance } from '@/lib/axios';
import { Goal, GoalContribution, GoalForecast } from '@/types';

export const goalService = {
  getGoals: async (): Promise<Goal[]> => {
    const response = await axiosInstance.get('/goals/');
    return response.data.data;
  },

  getGoal: async (id: string): Promise<Goal> => {
    const response = await axiosInstance.get(`/goals/${id}/`);
    return response.data.data;
  },

  createGoal: async (data: {
    name: string;
    target_amount: number;
    target_date: string;
    category?: string;
  }): Promise<Goal> => {
    const response = await axiosInstance.post('/goals/', data);
    return response.data.data;
  },

  updateGoal: async (id: string, data: Partial<Goal>): Promise<Goal> => {
    const response = await axiosInstance.patch(`/goals/${id}/`, data);
    return response.data.data;
  },

  deleteGoal: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/goals/${id}/`);
  },

  contribute: async (id: string, data: GoalContribution): Promise<Goal> => {
    const response = await axiosInstance.post(`/goals/${id}/contributions/`, data);
    return response.data.data;
  },

  transfer: async (id: string, accountId: string): Promise<void> => {
    await axiosInstance.post(`/goals/${id}/authorize-transfers/`, { account: accountId });
  },

  getForecast: async (id: string): Promise<GoalForecast> => {
    const response = await axiosInstance.get(`/goals/${id}/forecast/`);
    return response.data.data;
  },
};

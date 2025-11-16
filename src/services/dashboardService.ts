import { axiosInstance } from '@/lib/axios';
import { DashboardData } from '@/types';

export const dashboardService = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await axiosInstance.get('/dashboard/');
    return response.data;
  },
};

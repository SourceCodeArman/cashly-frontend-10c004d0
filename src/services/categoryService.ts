import { axiosInstance } from '@/lib/axios';
import { Category } from '@/types';

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await axiosInstance.get('/transactions/categories/');
    return response.data.data;
  },

  createCategory: async (data: {
    name: string;
    color: string;
    icon?: string;
  }): Promise<Category> => {
    const response = await axiosInstance.post('/transactions/categories/', data);
    return response.data.data;
  },
};

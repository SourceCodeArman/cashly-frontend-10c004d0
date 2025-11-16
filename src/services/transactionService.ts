import { axiosInstance } from '@/lib/axios';
import { Transaction, TransactionStats } from '@/types';

export const transactionService = {
  getTransactions: async (params?: {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    category?: string;
    account?: string;
  }): Promise<{ results: Transaction[]; count: number; next: string | null; previous: string | null }> => {
    const response = await axiosInstance.get('/transactions/transactions/', { params });
    return response.data;
  },

  getTransaction: async (id: string): Promise<Transaction> => {
    const response = await axiosInstance.get(`/transactions/transactions/${id}`);
    return response.data;
  },

  categorizeTransaction: async (id: string, categoryId: string): Promise<Transaction> => {
    const response = await axiosInstance.post(`/transactions/transactions/${id}/categorize`, {
      category: categoryId,
    });
    return response.data;
  },

  getStats: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<TransactionStats> => {
    const response = await axiosInstance.get('/transactions/transactions/stats', { params });
    return response.data;
  },
};

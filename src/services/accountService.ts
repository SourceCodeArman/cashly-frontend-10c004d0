import { axiosInstance } from '@/lib/axios';
import { Account, LinkTokenResponse, PlaidConnectRequest } from '@/types';

export const accountService = {
  createLinkToken: async (): Promise<LinkTokenResponse> => {
    const response = await axiosInstance.post('/accounts/create-link-token');
    return response.data;
  },

  connectAccount: async (data: PlaidConnectRequest): Promise<Account[]> => {
    const response = await axiosInstance.post('/accounts/connect', data);
    return response.data;
  },

  getAccounts: async (): Promise<Account[]> => {
    const response = await axiosInstance.get('/accounts/');
    return response.data;
  },

  getAccount: async (id: string): Promise<Account> => {
    const response = await axiosInstance.get(`/accounts/${id}`);
    return response.data;
  },

  updateAccount: async (id: string, data: Partial<Account>): Promise<Account> => {
    const response = await axiosInstance.patch(`/accounts/${id}`, data);
    return response.data;
  },

  syncAccount: async (id: string): Promise<void> => {
    await axiosInstance.post(`/accounts/${id}/sync`);
  },

  disconnectAccount: async (id: string): Promise<void> => {
    await axiosInstance.post(`/accounts/${id}/disconnect`);
  },

  transfer: async (data: {
    from_account: string;
    to_account: string;
    amount: number;
  }): Promise<void> => {
    await axiosInstance.post('/accounts/transfer', data);
  },
};

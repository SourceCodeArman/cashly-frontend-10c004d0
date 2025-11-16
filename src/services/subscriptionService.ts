import { axiosInstance } from '@/lib/axios';
import { SubscriptionConfig, Subscription, CreateSubscriptionRequest } from '@/types';

export const subscriptionService = {
  getConfig: async (): Promise<SubscriptionConfig> => {
    const response = await axiosInstance.get('/subscriptions/config');
    return response.data;
  },

  getSubscriptions: async (): Promise<Subscription[]> => {
    const response = await axiosInstance.get('/subscriptions/');
    return response.data;
  },

  getSubscription: async (id: string): Promise<Subscription> => {
    const response = await axiosInstance.get(`/subscriptions/${id}`);
    return response.data;
  },

  createSubscription: async (data: CreateSubscriptionRequest): Promise<{ sessionId: string }> => {
    const response = await axiosInstance.post('/subscriptions/', data);
    return response.data;
  },

  updateSubscription: async (id: string, data: { price_id: string }): Promise<Subscription> => {
    const response = await axiosInstance.patch(`/subscriptions/${id}`, data);
    return response.data;
  },

  cancelSubscription: async (id: string): Promise<Subscription> => {
    const response = await axiosInstance.post(`/subscriptions/${id}/cancel`);
    return response.data;
  },
};

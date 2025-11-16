import { axiosInstance } from '@/lib/axios';
import { SubscriptionConfig, Subscription, CreateSubscriptionRequest } from '@/types';

export const subscriptionService = {
  getConfig: async (): Promise<SubscriptionConfig> => {
    const response = await axiosInstance.get('/subscriptions/stripe-config/');
    return response.data.data;
  },

  getSubscriptions: async (): Promise<Subscription[]> => {
    const response = await axiosInstance.get('/subscriptions/');
    return response.data.data;
  },

  getSubscription: async (id: string): Promise<Subscription> => {
    const response = await axiosInstance.get(`/subscriptions/${id}/`);
    return response.data.data;
  },

  createSubscription: async (data: CreateSubscriptionRequest): Promise<{ sessionId: string }> => {
    const response = await axiosInstance.post('/subscriptions/create/', data);
    return response.data.data;
  },

  updateSubscription: async (id: string, data: { price_id: string }): Promise<Subscription> => {
    const response = await axiosInstance.patch(`/subscriptions/${id}/`, data);
    return response.data.data;
  },

  cancelSubscription: async (id: string): Promise<Subscription> => {
    const response = await axiosInstance.patch(`/subscriptions/${id}/cancel/`);
    return response.data.data;
  },
};

import { axiosInstance } from '@/lib/axios';
import { Notification, UnreadCountResponse } from '@/types';

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await axiosInstance.get('/notifications/');
    return response.data;
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await axiosInstance.get('/notifications/unread_count/');
    return response.data;
  },

  getNotification: async (id: string): Promise<Notification> => {
    const response = await axiosInstance.get(`/notifications/${id}`);
    return response.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await axiosInstance.patch(`/notifications/${id}/mark_read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await axiosInstance.post('/notifications/mark_all_read');
  },

  deleteNotification: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/notifications/${id}`);
  },
};

import { axiosInstance } from '@/lib/axios';
import { User, LoginRequest, RegisterRequest, AuthTokens } from '@/types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await axiosInstance.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await axiosInstance.patch('/auth/profile', data);
    return response.data;
  },
};

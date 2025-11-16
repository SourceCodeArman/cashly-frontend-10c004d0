import { axiosInstance } from '@/lib/axios';
import { User, LoginRequest, RegisterRequest, AuthTokens } from '@/types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return {
      user: response.data.data.user,
      tokens: {
        access: response.data.data.access,
        refresh: response.data.data.refresh,
      },
    };
  },

  register: async (data: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> => {
    const registerData = {
      ...data,
      username: data.email.split('@')[0], // Generate username from email
      password_confirm: data.password,
    };
    const response = await axiosInstance.post('/auth/register', registerData);
    return {
      user: response.data.data,
      tokens: {
        access: response.data.data.access || '',
        refresh: response.data.data.refresh || '',
      },
    };
  },

  getProfile: async (): Promise<User> => {
    const response = await axiosInstance.get('/auth/profile');
    return response.data.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await axiosInstance.patch('/auth/profile', data);
    return response.data.data;
  },
};

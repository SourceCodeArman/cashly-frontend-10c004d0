import { axiosInstance } from '@/lib/axios';
import { User, LoginRequest, RegisterRequest, AuthTokens } from '@/types';

const MOCK_MODE = import.meta.env.VITE_MOCK_AUTH === 'true';

const mockUser: User = {
  id: '1',
  email: 'demo@cashly.com',
  first_name: 'Demo',
  last_name: 'User',
  created_at: new Date().toISOString(),
};

const mockTokens: AuthTokens = {
  access: 'mock_access_token',
  refresh: 'mock_refresh_token',
};

export const authService = {
  login: async (credentials: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> => {
    if (MOCK_MODE) {
      // Mock delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { user: mockUser, tokens: mockTokens };
    }
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { user: { ...mockUser, ...data, id: '1' }, tokens: mockTokens };
    }
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockUser;
    }
    const response = await axiosInstance.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { ...mockUser, ...data };
    }
    const response = await axiosInstance.patch('/auth/profile', data);
    return response.data;
  },
};

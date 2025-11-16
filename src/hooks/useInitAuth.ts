import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

export const useInitAuth = () => {
  const { setUser } = useAuthStore();

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
    enabled: !!localStorage.getItem('access_token'),
    retry: false,
  });

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  return { isLoading };
};

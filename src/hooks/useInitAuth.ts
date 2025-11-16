import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const useInitAuth = () => {
  const { initAuth, isLoading } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return { isLoading };
};

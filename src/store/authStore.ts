import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setLoading: (isLoading) => set({ isLoading }),

  initAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profile) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email!,
              username: profile.username,
              first_name: profile.first_name,
              last_name: profile.last_name,
              subscription_tier: profile.subscription_tier,
              subscription_status: profile.subscription_status,
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // Fallback when profile row doesn't exist yet
          set({
            user: {
              id: session.user.id,
              email: session.user.email!,
              subscription_tier: 'free',
              subscription_status: 'active',
            },
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },
}));

// Listen to auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (profile) {
      useAuthStore.setState({
        user: {
          id: session.user.id,
          email: session.user.email!,
          username: profile.username,
          first_name: profile.first_name,
          last_name: profile.last_name,
          subscription_tier: profile.subscription_tier,
          subscription_status: profile.subscription_status,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      useAuthStore.setState({
        user: {
          id: session.user.id,
          email: session.user.email!,
          subscription_tier: 'free',
          subscription_status: 'active',
        },
        isAuthenticated: true,
        isLoading: false,
      });
    }
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  }
});

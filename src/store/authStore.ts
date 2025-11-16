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
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setLoading: (isLoading) => set({ isLoading }),

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

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
          });
        }
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

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
          });
        }
      }
    } catch (error) {
      console.error('User refresh error:', error);
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },
}));

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    // Set basic user immediately to avoid UI blocking
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

    // Defer profile fetch to avoid deadlocks inside the callback
    setTimeout(async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

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
      }
    }, 0);
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  }
});

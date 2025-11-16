import { supabase } from '@/integrations/supabase/client';
import { User, LoginRequest, RegisterRequest } from '@/types';

export const authService = {
  login: async (credentials: LoginRequest) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw error;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user!.id)
      .single();

    return {
      user: {
        id: data.user!.id,
        email: data.user!.email!,
        username: profile?.username,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        subscription_tier: profile?.subscription_tier,
        subscription_status: profile?.subscription_status,
      },
    };
  },

  register: async (registerData: RegisterRequest) => {
    const { data, error } = await supabase.auth.signUp({
      email: registerData.email,
      password: registerData.password,
      options: {
        data: {
          username: registerData.email.split('@')[0],
          first_name: registerData.first_name,
          last_name: registerData.last_name,
        },
      },
    });

    if (error) throw error;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user!.id)
      .single();

    return {
      user: {
        id: data.user!.id,
        email: data.user!.email!,
        username: profile?.username,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        subscription_tier: profile?.subscription_tier,
        subscription_status: profile?.subscription_status,
      },
    };
  },

  getProfile: async (): Promise<User> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    return {
      id: user.id,
      email: user.email!,
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      subscription_tier: data.subscription_tier,
      subscription_status: data.subscription_status,
    };
  },

  updateProfile: async (updates: Partial<User>): Promise<User> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: updates.first_name,
        last_name: updates.last_name,
        username: updates.username,
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: user.id,
      email: user.email!,
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      subscription_tier: data.subscription_tier,
      subscription_status: data.subscription_status,
    };
  },
};

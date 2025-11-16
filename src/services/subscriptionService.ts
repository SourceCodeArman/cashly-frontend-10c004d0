import { supabase } from '@/integrations/supabase/client';
import { SubscriptionConfig, Subscription, CreateSubscriptionRequest } from '@/types';

export const subscriptionService = {
  getConfig: async (): Promise<SubscriptionConfig> => {
    return {
      publishable_key: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    };
  },

  getSubscriptions: async (): Promise<Subscription[]> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getSubscription: async (id: string): Promise<Subscription> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscription_id', id)
      .single();

    if (error) throw error;
    return data;
  },

  createSubscription: async (subscriptionData: CreateSubscriptionRequest): Promise<{ sessionId: string }> => {
    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: subscriptionData,
    });
    if (error) throw error;
    return data;
  },

  updateSubscription: async (id: string, updates: { price_id: string }): Promise<Subscription> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('subscription_id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  cancelSubscription: async (id: string): Promise<Subscription> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('subscription_id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

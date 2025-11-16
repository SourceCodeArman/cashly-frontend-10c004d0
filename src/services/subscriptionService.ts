import { supabase } from '@/integrations/supabase/client';
import { SubscriptionConfig, Subscription, CreateSubscriptionRequest } from '@/types';

export const subscriptionService = {
  getConfig: async (): Promise<SubscriptionConfig> => {
    return {
      publishable_key: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
      tiers: [
        {
          id: 'free',
          name: 'Free',
          price_id: 'free',
          price: 0,
          features: [
            'Up to 3 connected accounts',
            'Basic transaction tracking',
            'Monthly spending reports',
            'Mobile app access',
          ],
        },
        {
          id: 'pro',
          name: 'Pro',
          price_id: 'price_1SU4sS9FH3KQIIeTUG3QLP7T',
          price: 9.99,
          features: [
            'Unlimited connected accounts',
            'Advanced analytics & insights',
            'Custom categories & budgets',
            'Goal tracking & forecasting',
            'Priority support',
            'Export to CSV/PDF',
          ],
        },
        {
          id: 'premium',
          name: 'Premium',
          price_id: 'price_1SU4th9FH3KQIIeT32lJfeW2',
          price: 19.99,
          features: [
            'Everything in Pro',
            'AI-powered financial insights',
            'Investment portfolio tracking',
            'Tax optimization suggestions',
            'Dedicated account manager',
            'Custom integrations',
            'Advanced security features',
          ],
        },
      ],
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

  updateSubscription: async (id: string, updates: Partial<Subscription>): Promise<Subscription> => {
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

  createCheckoutSession: async (priceId: string): Promise<{ url: string }> => {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId },
    });

    if (error) throw error;
    return data;
  },

  checkSubscription: async (): Promise<{
    subscribed: boolean;
    tier: string;
    product_id: string | null;
    subscription_end: string | null;
  }> => {
    const { data, error } = await supabase.functions.invoke('check-subscription');

    if (error) throw error;
    return data;
  },

  openCustomerPortal: async (): Promise<{ url: string }> => {
    const { data, error } = await supabase.functions.invoke('customer-portal');

    if (error) throw error;
    return data;
  },

  updateSubscriptionPlan: async (priceId: string): Promise<{
    success: boolean;
    subscriptionId: string;
    proratedAmount: number;
    nextBillingDate: string;
  }> => {
    const { data, error } = await supabase.functions.invoke('update-subscription', {
      body: { priceId },
    });

    if (error) throw error;
    return data;
  },
};

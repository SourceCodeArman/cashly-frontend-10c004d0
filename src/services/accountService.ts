import { supabase } from '@/integrations/supabase/client';
import { Account, LinkTokenResponse, PlaidConnectRequest } from '@/types';

export const accountService = {
  createLinkToken: async (): Promise<LinkTokenResponse> => {
    const { data, error } = await supabase.functions.invoke('plaid-link-token');
    if (error) throw error;
    return data;
  },

  connectAccount: async (connectData: PlaidConnectRequest): Promise<Account[]> => {
    const { data, error } = await supabase.functions.invoke('plaid-connect', {
      body: connectData,
    });
    if (error) throw error;
    return data.accounts;
  },

  getAccounts: async (): Promise<Account[]> => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getAccount: async (id: string): Promise<Account> => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('account_id', id)
      .single();

    if (error) throw error;
    return data;
  },

  updateAccount: async (id: string, updates: Partial<Account>): Promise<Account> => {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('account_id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  syncAccount: async (id: string): Promise<void> => {
    const { error } = await supabase.functions.invoke('plaid-sync', {
      body: { account_id: id },
    });
    if (error) throw error;
  },

  disconnectAccount: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('account_id', id);

    if (error) throw error;
  },

  transfer: async (transferData: {
    from_account: string;
    to_account: string;
    amount: number;
  }): Promise<void> => {
    const { error } = await supabase.functions.invoke('plaid-transfer', {
      body: transferData,
    });
    if (error) throw error;
  },
};

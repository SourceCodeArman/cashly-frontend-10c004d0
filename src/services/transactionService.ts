import { supabase } from '@/integrations/supabase/client';
import { Transaction, TransactionStats } from '@/types';

export const transactionService = {
  getTransactions: async (params?: {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    category?: string;
    account?: string;
  }) => {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        category:categories(category_id, name, icon, color),
        account:accounts(account_id, institution_name, custom_name)
      `, { count: 'exact' })
      .order('date', { ascending: false });

    if (params?.start_date) {
      query = query.gte('date', params.start_date);
    }
    if (params?.end_date) {
      query = query.lte('date', params.end_date);
    }
    if (params?.category) {
      query = query.eq('category_id', params.category);
    }
    if (params?.account) {
      query = query.eq('account_id', params.account);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return {
      results: data || [],
      count: count || 0,
      next: null,
      previous: null,
    };
  },

  getTransaction: async (id: string): Promise<Transaction> => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(category_id, name, icon, color),
        account:accounts(account_id, institution_name, custom_name)
      `)
      .eq('transaction_id', id)
      .single();

    if (error) throw error;
    return data;
  },

  categorizeTransaction: async (id: string, categoryId: string): Promise<Transaction> => {
    const { data, error } = await supabase
      .from('transactions')
      .update({ category_id: categoryId })
      .eq('transaction_id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getStats: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<TransactionStats> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id);

    if (params?.start_date) {
      query = query.gte('date', params.start_date);
    }
    if (params?.end_date) {
      query = query.lte('date', params.end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    const transactions = data || [];
    const expenses = transactions.filter(t => parseFloat(t.amount.toString()) < 0);
    const income = transactions.filter(t => parseFloat(t.amount.toString()) >= 0);

    return {
      total_count: transactions.length,
      expense_count: expenses.length,
      income_count: income.length,
      expense_total: expenses.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0),
      income_total: income.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      net: income.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) - 
           expenses.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0),
    };
  },
};

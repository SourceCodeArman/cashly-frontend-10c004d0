import { supabase } from '@/integrations/supabase/client';
import { DashboardData } from '@/types';
import { accountService } from './accountService';
import { transactionService } from './transactionService';
import { goalService } from './goalService';

export const dashboardService = {
  getDashboard: async (): Promise<DashboardData> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const [accounts, transactions, goals] = await Promise.all([
      accountService.getAccounts(),
      transactionService.getTransactions({}),
      goalService.getGoals(),
    ]);

    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance.toString()), 0);

    const categorySpending = transactions.results.reduce((acc: any, transaction: any) => {
      const amount = parseFloat(transaction.amount.toString());
      if (amount < 0) {
        const categoryName = transaction.category?.name || 'Uncategorized';
        acc[categoryName] = (acc[categoryName] || 0) + Math.abs(amount);
      }
      return acc;
    }, {});

    return {
      account_balance: {
        total: totalBalance,
        by_account: accounts.map(acc => ({
          name: acc.custom_name || acc.institution_name,
          balance: parseFloat(acc.balance.toString()),
        })),
      },
      recent_transactions: transactions.results.slice(0, 10),
      monthly_spending: {
        total: Object.values(categorySpending).reduce((sum: number, val: any) => sum + (val as number), 0) as number,
        by_category: Object.entries(categorySpending).map(([name, amount]) => ({
          name,
          amount: amount as number,
        })),
      },
      goals,
      category_chart_data: {
        labels: Object.keys(categorySpending),
        data: Object.values(categorySpending) as number[],
      },
    };
  },
};

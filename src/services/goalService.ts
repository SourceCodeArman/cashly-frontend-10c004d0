import { supabase } from '@/integrations/supabase/client';
import { Goal, GoalContribution, GoalForecast } from '@/types';

export const goalService = {
  getGoals: async (): Promise<Goal[]> => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getGoal: async (id: string): Promise<Goal> => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('goal_id', id)
      .single();

    if (error) throw error;
    return data;
  },

  createGoal: async (goalData: {
    name: string;
    target_amount: number;
    target_date: string;
    category?: string;
  }): Promise<Goal> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('goals')
      .insert([{ 
        ...goalData, 
        user_id: user.id,
        deadline: goalData.target_date,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateGoal: async (id: string, updates: Partial<Goal>): Promise<Goal> => {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('goal_id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteGoal: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('goal_id', id);

    if (error) throw error;
  },

  contribute: async (id: string, contributionData: GoalContribution): Promise<Goal> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error: contribError } = await supabase
      .from('goal_contributions')
      .insert([{ 
        ...contributionData, 
        goal_id: id, 
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
      }]);

    if (contribError) throw contribError;

    // Update goal current_amount
    const goal = await this.getGoal(id);
    if (!goal) throw new Error('Goal not found');
    
    const newAmount = parseFloat(goal.current_amount.toString()) + parseFloat(contributionData.amount.toString());
    
    const { data, error } = await supabase
      .from('goals')
      .update({ current_amount: newAmount })
      .eq('goal_id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  transfer: async (id: string, accountId: string): Promise<void> => {
    const { error } = await supabase.functions.invoke('goal-transfer', {
      body: { goal_id: id, account_id: accountId },
    });
    if (error) throw error;
  },

  getForecast: async (id: string): Promise<GoalForecast> => {
    const { data, error } = await supabase.functions.invoke('goal-forecast', {
      body: { goal_id: id },
    });
    if (error) throw error;
    return data;
  },
};

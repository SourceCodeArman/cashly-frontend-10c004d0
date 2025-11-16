import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types';

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  createCategory: async (categoryData: {
    name: string;
    color: string;
    icon?: string;
  }): Promise<Category> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('categories')
      .insert([{ 
        ...categoryData, 
        user_id: user.id, 
        type: 'expense',
        is_system_category: false 
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

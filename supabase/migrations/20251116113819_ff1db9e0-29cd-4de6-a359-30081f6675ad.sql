-- Create enum types
CREATE TYPE public.account_type AS ENUM ('checking', 'savings', 'credit', 'investment', 'loan', 'other');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.goal_type AS ENUM ('savings', 'debt_payoff', 'investment');
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'premium');
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE public.notification_type AS ENUM ('goal_reminder', 'transaction_alert', 'subscription_update', 'system');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Accounts table (bank accounts)
CREATE TABLE public.accounts (
  account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_account_id TEXT,
  plaid_item_id TEXT,
  institution_name TEXT NOT NULL,
  institution_id TEXT,
  custom_name TEXT,
  account_type account_type NOT NULL,
  account_number_masked TEXT,
  balance DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  plaid_access_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Categories table
CREATE TABLE public.categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type transaction_type NOT NULL,
  icon TEXT,
  color TEXT,
  is_system_category BOOLEAN DEFAULT false,
  parent_category UUID REFERENCES public.categories(category_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions table
CREATE TABLE public.transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(account_id) ON DELETE CASCADE,
  plaid_transaction_id TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL,
  merchant_name TEXT,
  description TEXT,
  category_id UUID REFERENCES public.categories(category_id) ON DELETE SET NULL,
  plaid_category TEXT[],
  is_recurring BOOLEAN DEFAULT false,
  is_transfer BOOLEAN DEFAULT false,
  pending BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Goals table
CREATE TABLE public.goals (
  goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) DEFAULT 0,
  deadline DATE,
  goal_type goal_type DEFAULT 'savings',
  monthly_contribution DECIMAL(12, 2),
  inferred_category_id UUID REFERENCES public.categories(category_id) ON DELETE SET NULL,
  destination_account_id UUID REFERENCES public.accounts(account_id) ON DELETE SET NULL,
  transfer_authorized BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  contribution_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Goal contributions table
CREATE TABLE public.goal_contributions (
  contribution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(goal_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL,
  source TEXT DEFAULT 'manual',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status subscription_status NOT NULL,
  plan subscription_tier NOT NULL,
  billing_cycle TEXT,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for accounts
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Users can view system categories" ON public.categories FOR SELECT USING (is_system_category = true OR auth.uid() = user_id);
CREATE POLICY "Users can create own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for goals
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for goal_contributions
CREATE POLICY "Users can view own contributions" ON public.goal_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own contributions" ON public.goal_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contributions" ON public.goal_contributions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contributions" ON public.goal_contributions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default system categories
INSERT INTO public.categories (name, type, icon, color, is_system_category) VALUES
  ('Food & Dining', 'expense', '🍔', '#FF5733', true),
  ('Transportation', 'expense', '🚗', '#3498DB', true),
  ('Shopping', 'expense', '🛍️', '#9B59B6', true),
  ('Entertainment', 'expense', '🎬', '#E74C3C', true),
  ('Bills & Utilities', 'expense', '💡', '#F39C12', true),
  ('Healthcare', 'expense', '🏥', '#1ABC9C', true),
  ('Education', 'expense', '📚', '#2ECC71', true),
  ('Travel', 'expense', '✈️', '#E67E22', true),
  ('Personal Care', 'expense', '💇', '#8E44AD', true),
  ('Income', 'income', '💰', '#27AE60', true),
  ('Salary', 'income', '💼', '#16A085', true),
  ('Investment', 'income', '📈', '#2980B9', true),
  ('Other', 'expense', '📝', '#95A5A6', true);
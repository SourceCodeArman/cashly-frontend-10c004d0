// Auth types
export interface User {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  subscription_tier?: 'free' | 'pro' | 'premium';
  subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing';
  created_at?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

// Account types
export interface Account {
  account_id: string;
  user_id: string;
  plaid_account_id?: string;
  plaid_item_id?: string;
  institution_name: string;
  institution_id?: string;
  custom_name?: string;
  account_type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'other';
  account_number_masked?: string;
  balance: number;
  currency: string;
  is_active: boolean;
  plaid_access_token?: string;
  created_at: string;
  updated_at: string;
}

export interface LinkTokenResponse {
  link_token: string;
}

export interface PlaidConnectRequest {
  public_token: string;
  institution_id: string;
  institution_name: string;
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    subtype: string;
    mask: string;
  }>;
}

// Transaction types
export interface Transaction {
  transaction_id: string;
  user_id: string;
  account_id: string;
  plaid_transaction_id?: string;
  amount: number;
  date: string;
  merchant_name?: string;
  description?: string;
  category_id?: string;
  plaid_category?: string[];
  is_recurring: boolean;
  is_transfer: boolean;
  pending: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    category_id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  account?: {
    account_id: string;
    institution_name: string;
    custom_name?: string;
  };
}

export interface TransactionStats {
  total_count: number;
  expense_count: number;
  income_count: number;
  expense_total: number;
  income_total: number;
  net: number;
}

// Category types
export interface Category {
  category_id: string;
  user_id?: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  is_system_category: boolean;
  parent_category?: string;
  created_at: string;
}

// Goal types
export interface Goal {
  goal_id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  goal_type: 'savings' | 'debt_payoff' | 'investment';
  monthly_contribution?: number;
  inferred_category_id?: string;
  destination_account_id?: string;
  transfer_authorized: boolean;
  is_active: boolean;
  is_completed: boolean;
  contribution_rules?: any;
  created_at: string;
  updated_at: string;
}

export interface GoalContribution {
  contribution_id?: string;
  goal_id: string;
  user_id?: string;
  amount: number;
  date: string;
  source?: string;
  note?: string;
  created_at?: string;
}

export interface GoalForecast {
  estimated_completion_date: string;
  monthly_recommendation: number;
  is_on_track: boolean;
}

// Subscription types
export interface SubscriptionConfig {
  publishable_key: string;
  tiers?: SubscriptionTier[];
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price_id: string;
  price: number;
  features: string[];
}

export interface Subscription {
  subscription_id: string;
  user_id: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  plan: 'free' | 'pro' | 'premium';
  billing_cycle?: string;
  current_period_end?: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionRequest {
  payment_method_id: string;
  plan: string;
  billing_cycle: string;
  trial_enabled?: boolean;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  type: 'goal_reminder' | 'transaction_alert' | 'subscription_update' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  metadata?: any;
  created_at: string;
}

export interface UnreadCountResponse {
  count: number;
}

// Dashboard types
export interface DashboardData {
  account_balance: {
    total: number;
    by_account: Array<{
      name: string;
      balance: number;
    }>;
  };
  recent_transactions: Transaction[];
  monthly_spending: {
    total: number;
    by_category: Array<{
      name: string;
      amount: number;
    }>;
  };
  goals: Goal[];
  category_chart_data: {
    labels: string[];
    data: number[];
  };
}

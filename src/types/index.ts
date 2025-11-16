// Auth types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
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
  id: string;
  plaid_account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string;
  mask: string | null;
  current_balance: number;
  available_balance: number | null;
  currency_code: string;
  institution_name: string;
  institution_id: string;
  is_active: boolean;
  last_synced_at: string;
  created_at: string;
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
  id: string;
  plaid_transaction_id: string;
  account: string;
  amount: number;
  date: string;
  name: string;
  merchant_name: string | null;
  category: string | null;
  pending: boolean;
  payment_channel: string;
  created_at: string;
}

export interface TransactionStats {
  total_spending: number;
  total_income: number;
  spending_by_category: Record<string, number>;
  transactions_count: number;
}

// Category types
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  is_default: boolean;
  created_at: string;
}

// Goal types
export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface GoalContribution {
  amount: number;
}

export interface GoalForecast {
  projected_completion_date: string;
  monthly_contribution_needed: number;
  on_track: boolean;
}

// Subscription types
export interface SubscriptionConfig {
  publishable_key: string;
  tiers: SubscriptionTier[];
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price_id: string;
  price: number;
  features: string[];
}

export interface Subscription {
  id: string;
  tier: string;
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

export interface CreateSubscriptionRequest {
  price_id: string;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  created_at: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}

// Dashboard types
export interface DashboardData {
  total_balance: number;
  total_spending: number;
  total_income: number;
  spending_trend: Array<{
    date: string;
    amount: number;
  }>;
  recent_transactions: Transaction[];
  upcoming_bills: Array<{
    name: string;
    amount: number;
    due_date: string;
  }>;
  savings_goals_summary: {
    total_saved: number;
    total_target: number;
    active_goals_count: number;
  };
}

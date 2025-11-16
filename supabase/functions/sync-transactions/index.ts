import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-TRANSACTIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { accountId } = await req.json();
    if (!accountId) throw new Error("Account ID is required");

    const plaidClientId = Deno.env.get("PLAID_CLIENT_ID");
    const plaidSecret = Deno.env.get("PLAID_SECRET");
    if (!plaidClientId || !plaidSecret) {
      throw new Error("Plaid credentials not configured");
    }

    // Get account details
    const { data: account, error: accountError } = await supabaseClient
      .from("accounts")
      .select("*")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .single();

    if (accountError || !account) {
      throw new Error("Account not found");
    }

    if (!account.plaid_access_token) {
      throw new Error("Account is not linked to Plaid");
    }

    logStep("Account found", { accountId });

    const plaidEnv = Deno.env.get("PLAID_ENV") || "sandbox";
    const plaidUrl = plaidEnv === "production" 
      ? "https://production.plaid.com" 
      : `https://${plaidEnv}.plaid.com`;

    // Get transactions from the last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    logStep("Fetching transactions", { 
      startDate: formatDate(startDate), 
      endDate: formatDate(endDate) 
    });

    const response = await fetch(`${plaidUrl}/transactions/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        access_token: account.plaid_access_token,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      logStep("Plaid API error", { error: data });
      throw new Error(data.error_message || "Failed to fetch transactions");
    }

    logStep("Fetched transactions", { count: data.transactions.length });

    // Filter transactions for this account
    const accountTransactions = data.transactions.filter(
      (tx: any) => tx.account_id === account.plaid_account_id
    );

    if (accountTransactions.length === 0) {
      logStep("No new transactions found");
      return new Response(JSON.stringify({ 
        success: true,
        transactions_synced: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Prepare transactions for insertion
    // Note: Plaid sends positive amounts for expenses, negative for income
    // We invert the sign: negative = expense (red), positive = income (green) in our UI
    const transactionsToInsert = accountTransactions.map((tx: any) => ({
      user_id: user.id,
      account_id: accountId,
      plaid_transaction_id: tx.transaction_id,
      amount: -tx.amount, // Invert sign: Plaid positive (expense) becomes negative
      date: tx.date,
      description: tx.name,
      merchant_name: tx.merchant_name || tx.name,
      pending: tx.pending,
      is_transfer: tx.transaction_type === "transfer",
      plaid_category: tx.category,
      category_id: null, // Will be categorized later
    }));

    // Insert or update transactions
    const { error: insertError } = await supabaseClient
      .from("transactions")
      .upsert(transactionsToInsert, { 
        onConflict: "plaid_transaction_id",
        ignoreDuplicates: false 
      });

    if (insertError) {
      logStep("Failed to insert transactions", { error: insertError.message });
      throw new Error(`Failed to save transactions: ${insertError.message}`);
    }

    logStep("Transactions synced successfully", { count: transactionsToInsert.length });

    return new Response(JSON.stringify({ 
      success: true,
      transactions_synced: transactionsToInsert.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

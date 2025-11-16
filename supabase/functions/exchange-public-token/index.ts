import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EXCHANGE-TOKEN] ${step}${detailsStr}`);
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

    const { publicToken } = await req.json();
    if (!publicToken) throw new Error("Public token is required");

    const plaidClientId = Deno.env.get("PLAID_CLIENT_ID");
    const plaidSecret = Deno.env.get("PLAID_SECRET");
    if (!plaidClientId || !plaidSecret) {
      throw new Error("Plaid credentials not configured");
    }

    const plaidEnv = Deno.env.get("PLAID_ENV") || "sandbox";
    const plaidUrl = plaidEnv === "production" 
      ? "https://production.plaid.com" 
      : `https://${plaidEnv}.plaid.com`;

    logStep("Exchanging public token");

    // Exchange public token for access token
    const exchangeResponse = await fetch(`${plaidUrl}/item/public_token/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        public_token: publicToken,
      }),
    });

    const exchangeData = await exchangeResponse.json();
    if (!exchangeResponse.ok) {
      logStep("Token exchange error", { error: exchangeData });
      throw new Error(exchangeData.error_message || "Failed to exchange token");
    }

    const { access_token, item_id } = exchangeData;
    logStep("Token exchanged successfully", { item_id });

    // Get accounts
    const accountsResponse = await fetch(`${plaidUrl}/accounts/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        access_token: access_token,
      }),
    });

    const accountsData = await accountsResponse.json();
    if (!accountsResponse.ok) {
      logStep("Accounts fetch error", { error: accountsData });
      throw new Error(accountsData.error_message || "Failed to fetch accounts");
    }

    logStep("Fetched accounts", { count: accountsData.accounts.length });

    // Get institution info
    const institution = accountsData.item.institution_id;
    let institutionName = "Unknown Institution";
    
    try {
      const instResponse = await fetch(`${plaidUrl}/institutions/get_by_id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: plaidClientId,
          secret: plaidSecret,
          institution_id: institution,
          country_codes: ["US"],
        }),
      });
      const instData = await instResponse.json();
      if (instResponse.ok) {
        institutionName = instData.institution.name;
      }
    } catch (error) {
      logStep("Failed to fetch institution name", { error });
    }

    // Store accounts in database
    const accountsToInsert = accountsData.accounts.map((acc: any) => ({
      user_id: user.id,
      plaid_account_id: acc.account_id,
      plaid_item_id: item_id,
      plaid_access_token: access_token,
      institution_name: institutionName,
      institution_id: institution,
      account_type: mapPlaidAccountType(acc.type),
      balance: acc.balances.current || 0,
      account_number_masked: acc.mask || null,
      custom_name: acc.name,
      currency: acc.balances.iso_currency_code || "USD",
      is_active: true,
    }));

    const { error: insertError } = await supabaseClient
      .from("accounts")
      .insert(accountsToInsert);

    if (insertError) {
      logStep("Failed to insert accounts", { error: insertError.message });
      throw new Error(`Failed to save accounts: ${insertError.message}`);
    }

    logStep("Accounts saved successfully");

    // Fetch and save transactions for all accounts
    let totalTransactionsSynced = 0;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    try {
      logStep("Fetching initial transactions", { 
        startDate: formatDate(startDate), 
        endDate: formatDate(endDate) 
      });

      const txResponse = await fetch(`${plaidUrl}/transactions/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: plaidClientId,
          secret: plaidSecret,
          access_token: access_token,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate),
        }),
      });

      const txData = await txResponse.json();
      
      if (txResponse.ok && txData.transactions?.length > 0) {
        logStep("Fetched transactions", { count: txData.transactions.length });

        // Map Plaid account IDs to our account IDs
        const accountIdMap = new Map();
        for (const acc of accountsData.accounts) {
          const ourAccount = accountsToInsert.find((a: any) => a.plaid_account_id === acc.account_id);
          if (ourAccount) {
            // Get the saved account ID from database
            const { data: savedAccount } = await supabaseClient
              .from("accounts")
              .select("account_id")
              .eq("plaid_account_id", acc.account_id)
              .eq("user_id", user.id)
              .single();
            
            if (savedAccount) {
              accountIdMap.set(acc.account_id, savedAccount.account_id);
            }
          }
        }

        // Prepare transactions for insertion
        // Note: Plaid sends positive amounts for expenses, negative for income
        // We invert the sign: negative = expense (red), positive = income (green) in our UI
        const transactionsToInsert = txData.transactions.map((tx: any) => ({
          user_id: user.id,
          account_id: accountIdMap.get(tx.account_id),
          plaid_transaction_id: tx.transaction_id,
          amount: -tx.amount, // Invert sign: Plaid positive (expense) becomes negative
          date: tx.date,
          description: tx.name,
          merchant_name: tx.merchant_name || tx.name,
          pending: tx.pending,
          is_transfer: tx.transaction_type === "transfer",
          plaid_category: tx.category,
          category_id: null,
        })).filter((tx: any) => tx.account_id); // Only include transactions for mapped accounts

        if (transactionsToInsert.length > 0) {
          const { error: txInsertError } = await supabaseClient
            .from("transactions")
            .insert(transactionsToInsert);

          if (txInsertError) {
            logStep("Failed to insert transactions", { error: txInsertError.message });
          } else {
            totalTransactionsSynced = transactionsToInsert.length;
            logStep("Transactions synced successfully", { count: totalTransactionsSynced });
          }
        }
      }
    } catch (txError) {
      logStep("Transaction sync error (non-fatal)", { 
        error: txError instanceof Error ? txError.message : String(txError) 
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      accounts_count: accountsData.accounts.length,
      transactions_synced: totalTransactionsSynced
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

function mapPlaidAccountType(plaidType: string): string {
  const typeMap: Record<string, string> = {
    depository: "checking",
    credit: "credit",
    loan: "loan",
    investment: "investment",
  };
  return typeMap[plaidType] || "other";
}

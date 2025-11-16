import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, user is on free plan");
      
      // Update user profile to free tier
      await supabaseClient
        .from('profiles')
        .update({ 
          subscription_tier: 'free',
          subscription_status: 'active'
        })
        .eq('user_id', user.id);
        
      return new Response(JSON.stringify({ 
        subscribed: false, 
        tier: 'free',
        product_id: null,
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    logStep("Fetched subscriptions", { count: subscriptions.data.length });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let tier = 'free';

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      logStep("Processing subscription", { 
        subscriptionId: subscription.id, 
        periodEnd: subscription.current_period_end,
        periodEndType: typeof subscription.current_period_end 
      });
      
      // Safely convert timestamp to ISO string
      try {
        if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
          const timestamp = subscription.current_period_end * 1000;
          logStep("Converting timestamp", { timestamp, original: subscription.current_period_end });
          subscriptionEnd = new Date(timestamp).toISOString();
          logStep("Converted date", { subscriptionEnd });
        } else {
          logStep("Invalid period end format", { periodEnd: subscription.current_period_end });
        }
      } catch (dateError) {
        logStep("Date conversion error", { 
          error: dateError instanceof Error ? dateError.message : String(dateError),
          periodEnd: subscription.current_period_end 
        });
      }
      
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Get product ID safely
      if (subscription.items?.data?.[0]?.price?.product) {
        productId = subscription.items.data[0].price.product as string;
        logStep("Determined product ID", { productId });
        
        // Map product ID to tier
        if (productId === 'prod_TQwmCxRJiMH3Nv') {
          tier = 'pro';
        } else if (productId === 'prod_TQwnEiqlldcXk0') {
          tier = 'premium';
        }
      } else {
        logStep("No product ID found in subscription");
      }
      
      // Update user profile with subscription info
      await supabaseClient
        .from('profiles')
        .update({ 
          subscription_tier: tier,
          subscription_status: 'active'
        })
        .eq('user_id', user.id);
        
      logStep("Updated user profile", { tier });
    } else {
      logStep("No active subscription found");
      
      // Update user profile to free tier
      await supabaseClient
        .from('profiles')
        .update({ 
          subscription_tier: 'free',
          subscription_status: 'active'
        })
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      product_id: productId,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

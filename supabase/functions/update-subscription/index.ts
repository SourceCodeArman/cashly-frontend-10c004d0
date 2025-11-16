import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { priceId } = await req.json();
    if (!priceId) throw new Error("Price ID is required");
    logStep("Received price ID", { priceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find the customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found. Please subscribe first.");
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found. Please subscribe first.");
    }

    const subscription = subscriptions.data[0];
    const subscriptionItemId = subscription.items.data[0].id;
    logStep("Found active subscription", { 
      subscriptionId: subscription.id, 
      currentPriceId: subscription.items.data[0].price.id,
      subscriptionItemId 
    });

    // Update the subscription with proration
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscriptionItemId,
          price: priceId,
        },
      ],
      proration_behavior: 'always_invoice',
      billing_cycle_anchor: 'unchanged',
    });

    logStep("Subscription updated successfully", { 
      subscriptionId: updatedSubscription.id,
      newPriceId: priceId,
      proratedAmount: updatedSubscription.latest_invoice
    });

    // Get the prorated invoice preview
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    });

    logStep("Retrieved prorated invoice", {
      amountDue: upcomingInvoice.amount_due,
      periodEnd: upcomingInvoice.period_end
    });

    // Map product ID to tier
    let newTier: 'free' | 'pro' | 'premium' = 'free';
    const productId = updatedSubscription.items?.data?.[0]?.price?.product as string | undefined;
    if (productId === 'prod_TQwmCxRJiMH3Nv' || productId === 'prod_Szh5jnk7eDYrvR') {
      newTier = 'pro';
    } else if (productId === 'prod_TQwnEiqlldcXk0') {
      newTier = 'premium';
    }

    // Convert period end
    let nextPeriodEndIso: string | null = null;
    try {
      const toIso = (ts: number) => new Date(ts * 1000).toISOString();
      if (typeof updatedSubscription.current_period_end === 'number') {
        nextPeriodEndIso = toIso(updatedSubscription.current_period_end);
      } else {
        const fullSub = await stripe.subscriptions.retrieve(updatedSubscription.id);
        if (typeof fullSub.current_period_end === 'number') {
          nextPeriodEndIso = toIso(fullSub.current_period_end);
        }
      }
    } catch (_) {}

    // Persist to DB (profile + subscriptions)
    const { error: profileErr } = await supabaseClient
      .from('profiles')
      .update({ subscription_tier: newTier, subscription_status: 'active' })
      .eq('user_id', user.id);
    if (profileErr) logStep('Failed to update profile after plan change', { error: profileErr.message });

    const subData = {
      user_id: user.id,
      plan: newTier,
      status: updatedSubscription.status as 'active' | 'canceled' | 'past_due' | 'trialing',
      stripe_subscription_id: updatedSubscription.id,
      stripe_customer_id: customerId,
      current_period_end: nextPeriodEndIso,
      billing_cycle: updatedSubscription.items.data[0].price.recurring?.interval || 'month',
    };

    const { data: existing } = await supabaseClient
      .from('subscriptions')
      .select('subscription_id')
      .eq('user_id', user.id)
      .eq('stripe_subscription_id', updatedSubscription.id)
      .maybeSingle();

    if (existing) {
      const { error: updErr } = await supabaseClient
        .from('subscriptions')
        .update(subData)
        .eq('subscription_id', existing.subscription_id);
      if (updErr) logStep('Failed to update subscription row', { error: updErr.message });
    } else {
      const { error: insErr } = await supabaseClient
        .from('subscriptions')
        .insert(subData);
      if (insErr) logStep('Failed to insert subscription row', { error: insErr.message });
    }

    return new Response(JSON.stringify({
      success: true,
      subscriptionId: updatedSubscription.id,
      proratedAmount: upcomingInvoice.amount_due / 100, // Convert cents to dollars
      nextBillingDate: new Date(upcomingInvoice.period_end * 1000).toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in update-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

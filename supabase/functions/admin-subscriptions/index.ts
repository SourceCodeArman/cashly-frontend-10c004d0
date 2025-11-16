import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-SUBSCRIPTIONS] ${step}${detailsStr}`);
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
    
    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    if (!roleData) {
      logStep("Unauthorized access attempt", { userId: user.id });
      throw new Error("Unauthorized - Admin access required");
    }
    
    logStep("Admin user authenticated", { userId: user.id });

    // Get all users with their profiles and subscriptions
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select(`
        user_id,
        username,
        first_name,
        last_name,
        subscription_tier,
        subscription_status,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    // Get all subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (subscriptionsError) throw subscriptionsError;

    // Merge data
    const usersWithSubscriptions = profiles?.map(profile => {
      const userSubscriptions = subscriptions?.filter(sub => sub.user_id === profile.user_id) || [];
      return {
        ...profile,
        subscriptions: userSubscriptions,
      };
    });

    logStep("Retrieved data", { 
      usersCount: profiles?.length || 0,
      subscriptionsCount: subscriptions?.length || 0
    });

    return new Response(JSON.stringify({ 
      users: usersWithSubscriptions,
      total_users: profiles?.length || 0,
      total_subscriptions: subscriptions?.length || 0
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

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_ADMIN_EMAIL = "support@tidywisecleaning.com";

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
    // Verify the user is the platform admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email || user.email !== PLATFORM_ADMIN_EMAIL) {
      throw new Error("Unauthorized: Platform admin access only");
    }

    // Get total signups (profiles count)
    const { count: totalSignups } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentSignups } = await supabaseClient
      .from('profiles')
      .select('id, email, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    // Get organizations count
    const { count: totalOrganizations } = await supabaseClient
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    // Get recent organizations
    const { data: recentOrganizations } = await supabaseClient
      .from('organizations')
      .select('id, name, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    // Get subscription data from Stripe
    let activeSubscriptions = 0;
    let trialSubscriptions = 0;
    let canceledSubscriptions = 0;
    let subscriptionList: any[] = [];

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      
      // Get all subscriptions
      const subscriptions = await stripe.subscriptions.list({ limit: 100 });
      
      for (const sub of subscriptions.data) {
        if (sub.status === 'active') activeSubscriptions++;
        if (sub.status === 'trialing') trialSubscriptions++;
        if (sub.status === 'canceled') canceledSubscriptions++;
        
        subscriptionList.push({
          id: sub.id,
          customer_email: sub.customer ? (typeof sub.customer === 'string' ? sub.customer : sub.customer) : 'Unknown',
          status: sub.status,
          created: new Date(sub.created * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        });
      }

      // Get customer emails for subscriptions
      for (const sub of subscriptionList) {
        if (typeof sub.customer_email === 'string' && sub.customer_email.startsWith('cus_')) {
          try {
            const customer = await stripe.customers.retrieve(sub.customer_email);
            if (!customer.deleted && 'email' in customer) {
              sub.customer_email = customer.email || 'Unknown';
            }
          } catch {
            // Keep the customer ID if retrieval fails
          }
        }
      }
    }

    return new Response(JSON.stringify({
      signups: {
        total: totalSignups || 0,
        recent: recentSignups || [],
        last30Days: recentSignups?.length || 0,
      },
      organizations: {
        total: totalOrganizations || 0,
        recent: recentOrganizations || [],
        last30Days: recentOrganizations?.length || 0,
      },
      subscriptions: {
        active: activeSubscriptions,
        trialing: trialSubscriptions,
        canceled: canceledSubscriptions,
        list: subscriptionList.slice(0, 50), // Limit to 50 most recent
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Platform analytics error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500,
    });
  }
});


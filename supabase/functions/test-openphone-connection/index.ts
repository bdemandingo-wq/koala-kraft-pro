import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, apiKey } = await req.json();

    if (!organizationId || !apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Organization ID and API key are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the caller belongs to this organization
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify org membership
      const { data: membership } = await supabase
        .from("org_memberships")
        .select("id")
        .eq("user_id", user.id)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (!membership) {
        return new Response(
          JSON.stringify({ success: false, error: "Not a member of this organization" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Ping OpenPhone API to verify the key
    const cleanKey = apiKey.trim().replace(/^Bearer\s+/i, "");
    const response = await fetch("https://api.openphone.com/v1/phone-numbers", {
      method: "GET",
      headers: {
        Authorization: cleanKey,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      const phoneCount = data?.data?.length || 0;
      return new Response(
        JSON.stringify({
          success: true,
          message: `Connection verified! Found ${phoneCount} phone number${phoneCount !== 1 ? "s" : ""}.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const errorText = await response.text();
    console.error("OpenPhone API test failed:", response.status, errorText);

    let errorMessage = "Invalid API key";
    if (response.status === 401) {
      errorMessage = "Invalid API key — please check your key and try again";
    } else if (response.status === 403) {
      errorMessage = "API key does not have permission to access phone numbers";
    } else if (response.status === 429) {
      errorMessage = "Rate limited — please try again in a moment";
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in test-openphone-connection:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

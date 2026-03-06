import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { logToSystem } from "../_shared/system-logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, organizationName, reason } = await req.json();

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("[DELETION-EMAIL] RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailBody = `
Account Deletion Request

Name: ${name}
Email: ${email}
Organization: ${organizationName || "N/A"}
Reason: ${reason || "Not provided"}
Submitted: ${new Date().toISOString()}

Please verify the user's identity and process this deletion request within 7 business days.
    `.trim();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TidyWise <noreply@tidywisecleaning.com>",
        to: ["Support@tidywisecleaning.com"],
        subject: `Account Deletion Request - ${email}`,
        text: emailBody,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[DELETION-EMAIL] Resend error:", errText);
    }

    await logToSystem({
      level: "info",
      source: "send-deletion-request-email",
      message: `Account deletion request submitted by ${email}`,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[DELETION-EMAIL] Error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

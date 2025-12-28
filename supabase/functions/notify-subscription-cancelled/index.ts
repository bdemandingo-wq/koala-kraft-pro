import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancellationRequest {
  customerEmail: string;
  customerName: string;
  reason?: string;
  organizationId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, customerName, reason, organizationId }: CancellationRequest = await req.json();

    // Fetch business settings for sender email and admin email
    // Default to Resend's verified domain for other organizations
    let senderEmail = "onboarding@resend.dev";
    let adminEmail = "onboarding@resend.dev";
    let companyName = "TIDYWISE";
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const settingsQuery = organizationId 
        ? supabase.from('business_settings').select('company_email, company_name').eq('organization_id', organizationId).maybeSingle()
        : supabase.from('business_settings').select('company_email, company_name').order('updated_at', { ascending: false }).limit(1).maybeSingle();
      
      const { data: settings } = await settingsQuery;
      
      if (settings?.company_email) {
        senderEmail = settings.company_email;
        adminEmail = settings.company_email;
        console.log("Using custom sender email:", senderEmail);
      }
      if (settings?.company_name) {
        companyName = settings.company_name;
      }
    }

    // Send notification to support
    const emailResponse = await resend.emails.send({
      from: `${companyName} <${senderEmail}>`,
      to: [adminEmail],
      subject: `Subscription Cancelled: ${customerName}`,
      html: `
        <h2>Subscription Cancellation Notice</h2>
        <p>A customer has cancelled their ${companyName} Pro subscription:</p>
        <table style="border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Customer Name:</td>
            <td style="padding: 8px;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Email:</td>
            <td style="padding: 8px;">${customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Cancellation Date:</td>
            <td style="padding: 8px;">${new Date().toLocaleDateString()}</td>
          </tr>
          ${reason ? `
          <tr>
            <td style="padding: 8px; font-weight: bold;">Reason:</td>
            <td style="padding: 8px;">${reason}</td>
          </tr>
          ` : ''}
        </table>
        <p>Please follow up with this customer to understand their feedback and potentially win them back.</p>
        <p style="color: #666; font-size: 12px;">This is an automated notification from ${companyName}.</p>
      `,
    });

    console.log("Cancellation notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-subscription-cancelled:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TechnicianNotificationRequest {
  technicianName: string;
  technicianPhone: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  address: string;
  bookingNumber: number;
  organizationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[send-technician-notification] Missing Supabase configuration");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const notification: TechnicianNotificationRequest = await req.json();

    // CRITICAL: organizationId is REQUIRED for multi-tenant isolation
    if (!notification.organizationId) {
      console.error("[send-technician-notification] Missing organizationId");
      return new Response(
        JSON.stringify({ success: false, error: "Missing organizationId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!notification.technicianPhone) {
      console.error("[send-technician-notification] Missing technician phone number");
      return new Response(
        JSON.stringify({ success: false, error: "Technician has no phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[send-technician-notification] Sending SMS to:", notification.technicianPhone, "for org:", notification.organizationId);

    // Fetch SMS settings for the organization
    const { data: smsSettings, error: settingsError } = await supabase
      .from('organization_sms_settings')
      .select('openphone_api_key, openphone_phone_number_id, sms_enabled')
      .eq('organization_id', notification.organizationId)
      .maybeSingle();

    if (settingsError) {
      console.error("[send-technician-notification] Error fetching SMS settings:", settingsError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch SMS settings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!smsSettings?.sms_enabled) {
      console.log("[send-technician-notification] SMS disabled for organization:", notification.organizationId);
      return new Response(
        JSON.stringify({ success: false, error: "SMS notifications are disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!smsSettings.openphone_api_key || !smsSettings.openphone_phone_number_id) {
      console.log("[send-technician-notification] OpenPhone not configured for org:", notification.organizationId);
      return new Response(
        JSON.stringify({ success: false, error: "OpenPhone not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get business settings for company name
    const { data: businessSettings } = await supabase
      .from('business_settings')
      .select('company_name')
      .eq('organization_id', notification.organizationId)
      .maybeSingle();

    const companyName = businessSettings?.company_name || 'Your Company';

    // Build SMS message
    const message = `📋 UPCOMING JOB\n\n` +
      `Hi ${notification.technicianName}!\n\n` +
      `Booking #${notification.bookingNumber}\n` +
      `Service: ${notification.serviceName}\n` +
      `Date: ${notification.appointmentDate}\n` +
      `Time: ${notification.appointmentTime}\n` +
      `Address: ${notification.address}\n\n` +
      `Customer: ${notification.customerName}\n\n` +
      `- ${companyName}`;

    // Format technician phone
    let formattedPhone = notification.technicianPhone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = `+1${formattedPhone}`;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    // Extract phone number ID if full URL was provided
    let phoneNumberId = smsSettings.openphone_phone_number_id;
    if (phoneNumberId.includes('openphone.com')) {
      const match = phoneNumberId.match(/phone-numbers\/([A-Za-z0-9]+)/);
      if (match) {
        phoneNumberId = match[1];
      }
    }

    console.log(`[send-technician-notification] Sending SMS to ${formattedPhone}`);

    // OpenPhone expects the raw API key in the Authorization header
    const authHeader = smsSettings.openphone_api_key.trim().replace(/^Bearer\s+/i, '');

    // Send SMS via OpenPhone API
    const response = await fetch("https://api.openphone.com/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: phoneNumberId,
        to: [formattedPhone],
        content: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[send-technician-notification] OpenPhone API error: ${response.status} - ${errorText}`);

      let provider: any = null;
      try {
        provider = JSON.parse(errorText);
      } catch {
        // ignore
      }

      // Always return 200 so the app can handle the error gracefully (no blank screens)
      let errorCode = 'SMS_FAILED';
      let userMessage = 'SMS delivery failed. Please try again later.';

      if (response.status === 402) {
        errorCode = 'BILLING_REQUIRED';
        userMessage = 'SMS is temporarily unavailable because your SMS provider account has insufficient credits or billing is past due.';
      } else if (response.status === 401) {
        errorCode = 'AUTH_FAILED';
        userMessage = 'Invalid SMS provider API key. Please update your SMS settings.';
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: userMessage,
          errorCode,
          providerStatus: response.status,
          providerMessage: provider?.message || provider?.title || errorText,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log(`[send-technician-notification] SMS sent successfully:`, result);

    return new Response(
      JSON.stringify({ success: true, messageId: result.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-technician-notification] Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

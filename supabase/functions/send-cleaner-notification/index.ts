import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getOrgEmailSettings, formatEmailFrom, getReplyTo } from "../_shared/get-org-email-settings.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CleanerNotificationRequest {
  cleanerName: string;
  cleanerEmail: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  address: string;
  bookingNumber: number;
  organizationId: string; // REQUIRED - no fallback allowed
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: CleanerNotificationRequest = await req.json();
    
    // CRITICAL: organizationId is REQUIRED for multi-tenant isolation
    if (!notification.organizationId) {
      console.error("[send-cleaner-notification] Missing organizationId - cannot send notification without organization context");
      return new Response(JSON.stringify({ 
        error: "Missing organizationId - organization context is required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("[send-cleaner-notification] Sending to:", notification.cleanerEmail, "for org:", notification.organizationId);

    // Get email settings from organization_email_settings table
    const emailSettingsResult = await getOrgEmailSettings(notification.organizationId);
    if (!emailSettingsResult.success || !emailSettingsResult.settings) {
      console.error("[send-cleaner-notification] Failed to get email settings:", emailSettingsResult.error);
      return new Response(
        JSON.stringify({ error: emailSettingsResult.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailSettings = emailSettingsResult.settings;
    const senderFrom = formatEmailFrom(emailSettings);
    const replyTo = getReplyTo(emailSettings);

    // Get business settings for branding
    let companyName = emailSettings.from_name;
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: settings } = await supabase
        .from('business_settings')
        .select('company_name')
        .eq('organization_id', notification.organizationId)
        .maybeSingle();
      
      if (settings?.company_name) {
        companyName = settings.company_name;
      }
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .alert-badge { display: inline-block; background-color: #dbeafe; color: #1d4ed8; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 20px; }
          .details { background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #6b7280; }
          .detail-value { font-weight: 600; color: #111827; }
          .address-box { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Upcoming Cleaning Assignment</h1>
          </div>
          <div class="content">
            <p>Hi ${notification.cleanerName},</p>
            <p>You have an upcoming cleaning assignment. Please review the details below:</p>
            
            <span class="alert-badge">Booking #${notification.bookingNumber}</span>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Service</span>
                <span class="detail-value">${notification.serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">${notification.appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${notification.appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer</span>
                <span class="detail-value">${notification.customerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer Phone</span>
                <span class="detail-value">${notification.customerPhone}</span>
              </div>
            </div>
            
            <div class="address-box">
              <strong>📍 Service Address:</strong><br/>
              ${notification.address}
            </div>
            
            <p style="margin-top: 20px;">Please arrive on time and contact the customer if you have any issues.</p>
            
            ${emailSettings.email_footer ? `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;"><p style="font-size: 12px; color: #9ca3af;">${emailSettings.email_footer}</p>` : ''}
          </div>
          <div class="footer">
            <p>${companyName}</p>
            <p>Thank you for your hard work!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend API directly
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: senderFrom,
        to: [notification.cleanerEmail],
        reply_to: replyTo,
        subject: `Upcoming Assignment - Booking #${notification.bookingNumber}`,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[send-cleaner-notification] Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("[send-cleaner-notification] Email sent successfully:", data.id);

    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[send-cleaner-notification] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

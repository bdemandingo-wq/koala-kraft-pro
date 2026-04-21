import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organization_id } = await req.json();
    if (!organization_id) {
      return new Response(JSON.stringify({ error: 'organization_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: bs } = await supabase
      .from('business_settings')
      .select('company_name, company_email, resend_api_key')
      .eq('organization_id', organization_id)
      .maybeSingle();

    const { data: es } = await supabase
      .from('organization_email_settings')
      .select('from_email, resend_api_key')
      .eq('organization_id', organization_id)
      .maybeSingle();

    const companyName = bs?.company_name || 'Remain Clean Services';
    const notifyEmail = bs?.company_email || es?.from_email || 'prophtjeff@yahoo.com';
    const resendKey = es?.resend_api_key || bs?.resend_api_key || Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'No Resend API key configured' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f5;margin:0;padding:0"><div style="max-width:600px;margin:30px auto"><div style="background:linear-gradient(135deg,#22c55e,#16a34a);color:white;padding:28px;border-radius:10px 10px 0 0;text-align:center"><h1 style="margin:0;font-size:22px">✅ Test Notification</h1><p style="margin:6px 0 0;opacity:.85">${companyName}</p></div><div style="background:white;padding:28px;border-radius:0 0 10px 10px"><div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:14px 18px;margin-bottom:22px"><p style="margin:0;font-size:16px;font-weight:700">Facebook Lead Notification System is Working!</p><p style="margin:6px 0 0;font-size:13px;color:#6b7280">This is a test email confirming your notification system is set up correctly.</p></div><table style="width:100%;border-collapse:collapse"><tr><td style="color:#6b7280;padding:10px 0;border-bottom:1px solid #f3f4f6;width:130px;">👤 Name</td><td style="font-weight:600;padding:10px 0;border-bottom:1px solid #f3f4f6;">Test Lead</td></tr><tr><td style="color:#6b7280;padding:10px 0;border-bottom:1px solid #f3f4f6;">📞 Phone</td><td style="font-weight:600;padding:10px 0;border-bottom:1px solid #f3f4f6;">+1 (555) 000-0000</td></tr><tr><td style="color:#6b7280;padding:10px 0;border-bottom:1px solid #f3f4f6;">🔧 Service</td><td style="font-weight:600;padding:10px 0;border-bottom:1px solid #f3f4f6;">Interior + Exterior Detail</td></tr><tr><td style="color:#6b7280;padding:10px 0;">📅 Submitted</td><td style="font-weight:600;padding:10px 0;">${now}</td></tr></table><div style="margin-top:20px;background:#f0f9ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:4px"><p style="margin:0;font-size:13px;color:#1e40af">When a real lead comes in from Facebook or Instagram, you'll receive a notification just like this one with the actual lead details.</p></div></div></div></body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: `${companyName} CRM <noreply@resend.dev>`,
        to: [notifyEmail],
        subject: '✅ Test: Facebook Lead Notification Working',
        html,
      }),
    });

    const data = await res.json();
    if (data.id) {
      return new Response(JSON.stringify({ success: true, sent_to: notifyEmail }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Email send failed', details: data }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

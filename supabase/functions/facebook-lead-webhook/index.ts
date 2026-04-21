import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const FACEBOOK_VERIFY_TOKEN = Deno.env.get("FACEBOOK_VERIFY_TOKEN") || "footprint_leads_2025";

  // ── GET: Meta webhook verification ──
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log("[facebook-lead-webhook] GET verification:", { mode, token, challenge });

    if (mode === 'subscribe' && token === FACEBOOK_VERIFY_TOKEN) {
      console.log("[facebook-lead-webhook] Verification SUCCESS");
      return new Response(challenge || '', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.error("[facebook-lead-webhook] Verification FAILED – token mismatch");
    return new Response('Forbidden', { status: 403, headers: { 'Content-Type': 'text/plain' } });
  }

  // ── POST: Incoming lead events ──
  if (req.method === 'POST') {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response('Bad Request', { status: 400, headers: { 'Content-Type': 'text/plain' } });
    }

    console.log("[facebook-lead-webhook] POST payload:", JSON.stringify(body).slice(0, 1000));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Store raw event
    try {
      await supabase.from('facebook_lead_webhook_events').insert({ payload: body });
    } catch (err) {
      console.error("[facebook-lead-webhook] DB insert error:", err);
    }

    // Process leads
    try {
      let FACEBOOK_PAGE_ACCESS_TOKEN = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN") || "";
      if (body.object === 'page') {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            if (change.field !== 'leadgen') continue;
            const leadgenId = change.value?.leadgen_id;
            const pageId = change.value?.page_id;
            if (!leadgenId) continue;

            // If no env-level token, try to load per-org token from business_settings
            let accessToken = FACEBOOK_PAGE_ACCESS_TOKEN;
            if (!accessToken && pageId) {
              const { data: tokenRow } = await supabase
                .from('business_settings')
                .select('facebook_page_access_token')
                .eq('facebook_page_id', pageId)
                .maybeSingle();
              accessToken = (tokenRow as any)?.facebook_page_access_token || '';
            }

            if (!accessToken) {
              console.error("[facebook-lead-webhook] No Facebook Page Access Token available for page:", pageId);

              // ── Fallback: send basic admin notification with webhook payload data ──
              try {
                const formId = change.value?.form_id || 'unknown';
                const createdTime = change.value?.created_time ? new Date(change.value.created_time * 1000).toLocaleString('en-US', { timeZone: 'America/New_York' }) : 'unknown';
                const metaLink = `https://business.facebook.com/latest/instant_forms/forms?asset_id=${pageId || ''}`;

                // Determine org for email settings
                let fallbackOrgId: string | null = null;
                if (pageId) {
                  const { data: orgMatch } = await supabase
                    .from('business_settings')
                    .select('organization_id, company_name, company_email, resend_api_key')
                    .eq('facebook_page_id', pageId)
                    .maybeSingle();
                  if (orgMatch) fallbackOrgId = orgMatch.organization_id;
                }

                // Load email settings
                let fallbackNotifyEmail = 'prophtjeff@gmail.com';
                let fallbackCompanyName = 'Remain Clean Services';
                let fallbackResendKey = Deno.env.get("RESEND_API_KEY") || '';

                if (fallbackOrgId) {
                  const { data: bs } = await supabase
                    .from('business_settings')
                    .select('company_name, company_email, resend_api_key')
                    .eq('organization_id', fallbackOrgId)
                    .maybeSingle();
                  const { data: es } = await supabase
                    .from('organization_email_settings')
                    .select('from_email, resend_api_key')
                    .eq('organization_id', fallbackOrgId)
                    .maybeSingle();

                  fallbackCompanyName = bs?.company_name || fallbackCompanyName;
                  fallbackNotifyEmail = bs?.company_email || es?.from_email || fallbackNotifyEmail;
                  fallbackResendKey = es?.resend_api_key || bs?.resend_api_key || fallbackResendKey;
                } else {
                  // No org match — try single-org fallback
                  const { data: allOrgs } = await supabase.from('organizations').select('id').limit(2);
                  if (allOrgs && allOrgs.length === 1) {
                    const soloOrgId = allOrgs[0].id;
                    const { data: bs } = await supabase
                      .from('business_settings')
                      .select('company_name, company_email, resend_api_key')
                      .eq('organization_id', soloOrgId)
                      .maybeSingle();
                    const { data: es } = await supabase
                      .from('organization_email_settings')
                      .select('from_email, resend_api_key')
                      .eq('organization_id', soloOrgId)
                      .maybeSingle();

                    fallbackCompanyName = bs?.company_name || fallbackCompanyName;
                    fallbackNotifyEmail = bs?.company_email || es?.from_email || fallbackNotifyEmail;
                    fallbackResendKey = es?.resend_api_key || bs?.resend_api_key || fallbackResendKey;
                  }
                }

                if (fallbackResendKey) {
                  const fallbackHtml = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f5;margin:0;padding:0"><div style="max-width:600px;margin:30px auto"><div style="background:linear-gradient(135deg,#1877F2,#0d5dbf);color:white;padding:28px;border-radius:10px 10px 0 0;text-align:center"><h1 style="margin:0;font-size:22px">🔔 New Facebook Lead Ad Submission</h1><p style="margin:6px 0 0;opacity:.85">${fallbackCompanyName}</p></div><div style="background:white;padding:28px;border-radius:0 0 10px 10px"><p style="font-size:15px;color:#374151;margin:0 0 18px">A new lead was submitted through your Facebook Lead Ad. The full lead details couldn't be fetched automatically because no Page Access Token is configured.</p><table style="width:100%;border-collapse:collapse"><tr><td style="color:#6b7280;padding:10px 0;border-bottom:1px solid #f3f4f6;width:140px;">📋 Leadgen ID</td><td style="font-weight:600;padding:10px 0;border-bottom:1px solid #f3f4f6;word-break:break-all">${leadgenId}</td></tr><tr><td style="color:#6b7280;padding:10px 0;border-bottom:1px solid #f3f4f6;">📄 Form ID</td><td style="font-weight:600;padding:10px 0;border-bottom:1px solid #f3f4f6;">${formId}</td></tr><tr><td style="color:#6b7280;padding:10px 0;border-bottom:1px solid #f3f4f6;">📅 Submitted</td><td style="font-weight:600;padding:10px 0;border-bottom:1px solid #f3f4f6;">${createdTime}</td></tr><tr><td style="color:#6b7280;padding:10px 0;">📍 Page ID</td><td style="font-weight:600;padding:10px 0;">${pageId || 'unknown'}</td></tr></table><div style="margin-top:24px;text-align:center"><a href="${metaLink}" style="display:inline-block;background:#1877F2;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px">View Lead in Meta Business Suite →</a></div><div style="margin-top:20px;background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px"><p style="margin:0;font-size:13px;color:#92400e"><strong>⚠️ Tip:</strong> To auto-capture full lead details (name, email, phone), add your Facebook Page Access Token in Settings → Facebook Integration.</p></div></div></div></body></html>`;

                  const fallbackRes = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${fallbackResendKey}` },
                    body: JSON.stringify({
                      from: `${fallbackCompanyName} CRM <noreply@resend.dev>`,
                      to: [fallbackNotifyEmail],
                      subject: `🔔 New Facebook Lead Ad Submission`,
                      html: fallbackHtml,
                    }),
                  });
                  const fallbackData = await fallbackRes.json();
                  if (fallbackData.id) {
                    console.log("[facebook-lead-webhook] Fallback notification sent to:", fallbackNotifyEmail);
                  } else {
                    console.error("[facebook-lead-webhook] Fallback notification failed:", JSON.stringify(fallbackData));
                  }
                } else {
                  console.warn("[facebook-lead-webhook] No Resend API key — fallback notification skipped");
                }
              } catch (fallbackErr) {
                console.error("[facebook-lead-webhook] Fallback notification error:", fallbackErr);
              }

              continue;
            }

            console.log("[facebook-lead-webhook] Processing leadgen_id:", leadgenId);

            const graphRes = await fetch(
              `https://graph.facebook.com/v21.0/${leadgenId}?access_token=${accessToken}`
            );
            const leadData = await graphRes.json();
            if (leadData.error) {
              console.error("[facebook-lead-webhook] Graph API error:", leadData.error);
              continue;
            }

            const fields: Record<string, string> = {};
            for (const f of leadData.field_data || []) {
              fields[f.name?.toLowerCase()] = f.values?.[0] || '';
            }

            const firstName = fields['first_name'] || fields['full_name']?.split(' ')[0] || 'Facebook';
            const lastName = fields['last_name'] || fields['full_name']?.split(' ').slice(1).join(' ') || 'Lead';
            const email = fields['email'] || '';
            const phone = fields['phone_number'] || fields['phone'] || '';
            const vehicleType = fields['vehicle_type'] || fields['car_type'] || '';
            const serviceInterest = fields['service_interested_in'] || fields['service'] || fields['package'] || '';
            const message = fields['message'] || fields['comments'] || fields['additional_info'] || '';

            // Determine organization
            let organizationId: string | null = null;
            const { data: orgMatch } = await supabase
              .from('business_settings')
              .select('organization_id')
              .eq('facebook_page_id', pageId)
              .maybeSingle();

            if (orgMatch) {
              organizationId = orgMatch.organization_id;
            } else {
              const { data: allOrgs } = await supabase.from('organizations').select('id').limit(2);
              if (allOrgs && allOrgs.length === 1) organizationId = allOrgs[0].id;
            }

            if (!organizationId) {
              console.error("[facebook-lead-webhook] Cannot determine org for page_id:", pageId);
              continue;
            }

            // De-duplicate by email
            if (email) {
              const { data: existing } = await supabase
                .from('leads')
                .select('id')
                .eq('email', email.toLowerCase())
                .eq('organization_id', organizationId)
                .maybeSingle();
              if (existing) {
                console.log("[facebook-lead-webhook] Duplicate lead skipped:", email);
                continue;
              }
            }

            // Build notes from custom fields
            const notesParts: string[] = [];
            notesParts.push(`Auto-captured from Facebook Lead Ad (leadgen_id: ${leadgenId})`);
            if (vehicleType) notesParts.push(`Vehicle Type: ${vehicleType}`);
            if (serviceInterest) notesParts.push(`Service Interest: ${serviceInterest}`);
            if (message) notesParts.push(`Message: ${message}`);

            const fullName = `${firstName} ${lastName}`.trim();

            // Insert lead
            const { data: newLead, error: leadError } = await supabase.from('leads').insert({
              first_name: firstName.slice(0, 100),
              last_name: lastName.slice(0, 100),
              name: fullName.slice(0, 200),
              email: email ? email.toLowerCase().slice(0, 255) : null,
              phone: phone ? phone.slice(0, 20) : null,
              source: 'facebook',
              status: 'new',
              service_interest: serviceInterest || null,
              notes: notesParts.join('\n'),
              organization_id: organizationId,
            }).select('id').single();

            if (leadError) {
              console.error("[facebook-lead-webhook] Lead insert error:", leadError);
              continue;
            }

            console.log("[facebook-lead-webhook] Lead created:", newLead?.id);

            // ── Admin Notification: New Lead Alert ──
            try {
              const { data: adminSettings } = await supabase
                .from('business_settings')
                .select('company_name, company_email, resend_api_key')
                .eq('organization_id', organizationId)
                .maybeSingle();

              const { data: emailSettings } = await supabase
                .from('organization_email_settings')
                .select('from_email, resend_api_key')
                .eq('organization_id', organizationId)
                .maybeSingle();

              const adminCompanyName = adminSettings?.company_name || 'Remain Clean Services';
              const adminNotifyEmail =
                adminSettings?.company_email ||
                emailSettings?.from_email ||
                'prophtjeff@gmail.com';
              const resendKey =
                emailSettings?.resend_api_key ||
                adminSettings?.resend_api_key ||
                Deno.env.get("RESEND_API_KEY");

              if (resendKey) {
                const detailRows = [
                  email ? `<tr><td style="color:#6b7280;padding:10px 0;border-bottom:1px solid #f3f4f6;width:130px;">📧 Email</td><td style="font-weight:600;padding:10px 0;border-bottom:1px solid #f3f4f6;">${email}</td></tr>` : '',
                  phone ? `<tr><td style="color:#6b7280;padding:10px 0;border-bottom:1px solid #f3f4f6;">📞 Phone</td><td style="font-weight:600;padding:10px 0;border-bottom:1px solid #f3f4f6;">${phone}</td></tr>` : '',
                  serviceInterest ? `<tr><td style="color:#6b7280;padding:10px 0;border-bottom:1px solid #f3f4f6;">🔧 Service</td><td style="font-weight:600;padding:10px 0;border-bottom:1px solid #f3f4f6;">${serviceInterest}</td></tr>` : '',
                  vehicleType ? `<tr><td style="color:#6b7280;padding:10px 0;border-bottom:1px solid #f3f4f6;">🚗 Vehicle</td><td style="font-weight:600;padding:10px 0;border-bottom:1px solid #f3f4f6;">${vehicleType}</td></tr>` : '',
                  message ? `<tr><td style="color:#6b7280;padding:10px 0;">💬 Message</td><td style="font-weight:600;padding:10px 0;">${message}</td></tr>` : '',
                ].filter(Boolean).join('');

                const notifyRes = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
                  body: JSON.stringify({
                    from: `${adminCompanyName} CRM <noreply@resend.dev>`,
                    to: [adminNotifyEmail],
                    subject: `🔔 New Facebook Lead: ${fullName}`,
                    html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f5;margin:0;padding:0"><div style="max-width:600px;margin:30px auto"><div style="background:linear-gradient(135deg,#1877F2,#0d5dbf);color:white;padding:28px;border-radius:10px 10px 0 0;text-align:center"><h1 style="margin:0;font-size:22px">🔔 New Lead from Facebook</h1><p style="margin:6px 0 0;opacity:.85">${adminCompanyName}</p></div><div style="background:white;padding:28px;border-radius:0 0 10px 10px"><div style="background:#f0f9ff;border-left:4px solid #1877F2;padding:14px 18px;margin-bottom:22px"><p style="margin:0;font-size:20px;font-weight:700">${fullName}</p><p style="margin:4px 0 0;font-size:13px;color:#1877F2;font-weight:600">NEW LEAD</p></div><table style="width:100%;border-collapse:collapse">${detailRows}</table></div></div></body></html>`,
                  }),
                });
                const notifyData = await notifyRes.json();
                if (notifyData.id) {
                  console.log("[facebook-lead-webhook] Admin notification sent to:", adminNotifyEmail);
                } else {
                  console.error("[facebook-lead-webhook] Admin notification failed:", JSON.stringify(notifyData));
                }
              } else {
                console.warn("[facebook-lead-webhook] No Resend API key — admin notification skipped");
              }
            } catch (adminNotifyErr) {
              console.error("[facebook-lead-webhook] Admin notification error:", adminNotifyErr);
            }

            // ── Follow-up: SMS via OpenPhone ──
            if (phone && organizationId) {
              try {
                const { data: smsSettings } = await supabase
                  .from('organization_sms_settings')
                  .select('openphone_api_key, openphone_phone_number_id')
                  .eq('organization_id', organizationId)
                  .maybeSingle();

                const { data: bizSettings } = await supabase
                  .from('business_settings')
                  .select('company_name')
                  .eq('organization_id', organizationId)
                  .maybeSingle();

                const companyName = bizSettings?.company_name || 'Remain Clean Services';

                if (smsSettings?.openphone_api_key && smsSettings?.openphone_phone_number_id) {
                  const smsBody = `Hey ${firstName}! Thanks for reaching out to ${companyName} 🚗 We'll be in touch shortly to get your vehicle looking brand new. Reply STOP to opt out.`;

                  await fetch('https://api.openphone.com/v1/messages', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': smsSettings.openphone_api_key,
                    },
                    body: JSON.stringify({
                      content: smsBody,
                      to: [phone],
                      from: smsSettings.openphone_phone_number_id,
                    }),
                  });
                  console.log("[facebook-lead-webhook] SMS sent to:", phone);
                }
              } catch (smsErr) {
                console.error("[facebook-lead-webhook] SMS error:", smsErr);
              }
            }

            // ── Follow-up: Email ──
            if (email && organizationId) {
              try {
                const { data: bizSettings } = await supabase
                  .from('business_settings')
                  .select('company_name, resend_api_key')
                  .eq('organization_id', organizationId)
                  .maybeSingle();

                const companyName = bizSettings?.company_name || 'Remain Clean Services';
                const resendKey = bizSettings?.resend_api_key || Deno.env.get("RESEND_API_KEY");

                if (resendKey) {
                  await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${resendKey}`,
                    },
                    body: JSON.stringify({
                      from: `${companyName} <noreply@resend.dev>`,
                      to: [email.toLowerCase()],
                      subject: `We got your request — ${companyName} will be in touch soon!`,
                      html: `<p>Hi ${firstName},</p><p>Thanks for reaching out to <strong>${companyName}</strong>! We received your inquiry and will be in touch shortly to discuss your detailing needs.</p><p>In the meantime, feel free to reply to this email if you have any questions.</p><p>Best,<br/>${companyName}</p>`,
                    }),
                  });
                  console.log("[facebook-lead-webhook] Email sent to:", email);
                }
              } catch (emailErr) {
                console.error("[facebook-lead-webhook] Email error:", emailErr);
              }
            }

            // ── Create follow-up task ──
            try {
              await supabase.from('tasks_and_notes').insert({
                organization_id: organizationId,
                type: 'daily',
                content: `Follow up with ${fullName} — Facebook Lead`,
                is_completed: false,
              });
              console.log("[facebook-lead-webhook] Task created for:", fullName);
            } catch (taskErr) {
              console.error("[facebook-lead-webhook] Task creation error:", taskErr);
            }
          }
        }
      }
    } catch (err) {
      console.error("[facebook-lead-webhook] Lead processing error:", err);
    }

    return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  return new Response('Method not allowed', { status: 405, headers: { 'Content-Type': 'text/plain' } });
});

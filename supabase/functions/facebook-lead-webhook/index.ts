import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const FACEBOOK_PAGE_ACCESS_TOKEN = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN");
  const FACEBOOK_VERIFY_TOKEN = Deno.env.get("FACEBOOK_VERIFY_TOKEN");

  // ── GET: Meta webhook verification ──
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === FACEBOOK_VERIFY_TOKEN) {
      console.log("[facebook-lead-webhook] Verification successful");
      return new Response(challenge, { status: 200 });
    }
    console.error("[facebook-lead-webhook] Verification failed – token mismatch");
    return new Response('Forbidden', { status: 403 });
  }

  // ── POST: Incoming lead events ──
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    console.log("[facebook-lead-webhook] Received event:", JSON.stringify(body).slice(0, 500));

    if (body.object !== 'page') {
      return new Response(JSON.stringify({ success: false, error: 'Not a page event' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!FACEBOOK_PAGE_ACCESS_TOKEN) {
      console.error("[facebook-lead-webhook] FACEBOOK_PAGE_ACCESS_TOKEN not set");
      return new Response(JSON.stringify({ success: false, error: 'Missing configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let leadsProcessed = 0;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'leadgen') continue;

        const leadgenId = change.value?.leadgen_id;
        const pageId = change.value?.page_id;
        if (!leadgenId) continue;

        console.log("[facebook-lead-webhook] Processing leadgen_id:", leadgenId);

        // Fetch full lead data from Graph API
        const graphRes = await fetch(
          `https://graph.facebook.com/v21.0/${leadgenId}?access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`
        );
        const leadData = await graphRes.json();

        if (leadData.error) {
          console.error("[facebook-lead-webhook] Graph API error:", leadData.error);
          continue;
        }

        // Parse field_data array into key-value map
        const fields: Record<string, string> = {};
        for (const f of leadData.field_data || []) {
          fields[f.name?.toLowerCase()] = f.values?.[0] || '';
        }

        const firstName = fields['first_name'] || fields['full_name']?.split(' ')[0] || 'Facebook';
        const lastName = fields['last_name'] || fields['full_name']?.split(' ').slice(1).join(' ') || 'Lead';
        const email = fields['email'] || '';
        const phone = fields['phone_number'] || fields['phone'] || '';

        // Find organization linked to this Facebook page
        // Look up by page_id in org settings, or fall back to all orgs
        let organizationId: string | null = null;

        // Try matching by facebook_page_id in business_settings
        const { data: orgMatch } = await supabase
          .from('business_settings')
          .select('organization_id')
          .eq('facebook_page_id', pageId)
          .maybeSingle();

        if (orgMatch) {
          organizationId = orgMatch.organization_id;
        } else {
          // Fallback: if only one org exists, use it (single-tenant convenience)
          const { data: allOrgs } = await supabase
            .from('organizations')
            .select('id')
            .limit(2);

          if (allOrgs && allOrgs.length === 1) {
            organizationId = allOrgs[0].id;
          }
        }

        if (!organizationId) {
          console.error("[facebook-lead-webhook] Cannot determine organization for page_id:", pageId);
          continue;
        }

        // Check for duplicate lead by email
        if (email) {
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('email', email.toLowerCase())
            .eq('organization_id', organizationId)
            .maybeSingle();

          if (existingLead) {
            console.log("[facebook-lead-webhook] Duplicate lead skipped:", email);
            continue;
          }
        }

        // Insert lead
        const { error: insertErr } = await supabase
          .from('leads')
          .insert({
            first_name: firstName.slice(0, 100),
            last_name: lastName.slice(0, 100),
            email: email ? email.toLowerCase().slice(0, 255) : null,
            phone: phone ? phone.slice(0, 20) : null,
            source: 'facebook',
            status: 'new',
            notes: `Auto-captured from Facebook Lead Ad (leadgen_id: ${leadgenId})`,
            organization_id: organizationId,
          });

        if (insertErr) {
          console.error("[facebook-lead-webhook] Insert error:", insertErr);
        } else {
          leadsProcessed++;
          console.log("[facebook-lead-webhook] Lead created:", email || firstName);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, leads_processed: leadsProcessed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error("[facebook-lead-webhook] Error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

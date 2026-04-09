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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const FACEBOOK_PAGE_ACCESS_TOKEN = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN");

    if (!FACEBOOK_PAGE_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "Facebook Page Access Token not configured" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { organization_id, date_from, date_to } = await req.json();

    if (!organization_id) {
      return new Response(JSON.stringify({ error: "organization_id is required" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Look up facebook_page_id from business_settings
    const { data: settings } = await supabase
      .from('business_settings')
      .select('facebook_page_id')
      .eq('organization_id', organization_id)
      .maybeSingle();

    const pageId = settings?.facebook_page_id;
    if (!pageId) {
      return new Response(JSON.stringify({ error: "Facebook Page ID not configured in settings" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert dates to Unix timestamps for Facebook API filtering
    const timeMin = date_from ? Math.floor(new Date(date_from).getTime() / 1000) : Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
    const timeMax = date_to ? Math.floor(new Date(date_to).getTime() / 1000) : Math.floor(Date.now() / 1000);

    // Step 1: Get all lead forms for this page
    const formsRes = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/leadgen_forms?access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}&limit=100`
    );
    const formsData = await formsRes.json();

    if (formsData.error) {
      console.error("[facebook-fetch-leads] Forms API error:", formsData.error);
      return new Response(JSON.stringify({ error: formsData.error.message || "Facebook API error" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const forms = formsData.data || [];
    const allLeads: any[] = [];

    // Step 2: For each form, fetch leads with time filtering and pagination
    for (const form of forms) {
      let url: string | null = `https://graph.facebook.com/v21.0/${form.id}/leads?access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}&limit=25&filtering=[{"field":"time_created","operator":"GREATER_THAN","value":${timeMin}},{"field":"time_created","operator":"LESS_THAN","value":${timeMax}}]`;

      while (url) {
        const leadsRes = await fetch(url);
        const leadsData = await leadsRes.json();

        if (leadsData.error) {
          console.error(`[facebook-fetch-leads] Leads API error for form ${form.id}:`, leadsData.error);
          break;
        }

        for (const lead of leadsData.data || []) {
          const fields: Record<string, string> = {};
          for (const f of lead.field_data || []) {
            fields[f.name?.toLowerCase()] = f.values?.[0] || '';
          }

          const firstName = fields['first_name'] || '';
          const lastName = fields['last_name'] || '';
          const fullName = fields['full_name'] || `${firstName} ${lastName}`.trim();
          const email = fields['email'] || '';
          const phone = fields['phone_number'] || fields['phone'] || '';

          allLeads.push({
            name: fullName || 'Unknown',
            email: email.toLowerCase(),
            phone,
            form_name: form.name || 'Unknown Form',
            created_time: lead.created_time,
            ad_name: form.name || '',
            facebook_lead_id: lead.id,
          });
        }

        // Handle pagination
        url = leadsData.paging?.next || null;
      }
    }

    console.log(`[facebook-fetch-leads] Fetched ${allLeads.length} leads from ${forms.length} forms`);

    return new Response(JSON.stringify({ leads: allLeads, forms_count: forms.length }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error("[facebook-fetch-leads] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

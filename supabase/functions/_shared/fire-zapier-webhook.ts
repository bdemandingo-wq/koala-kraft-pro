// Shared helper to fire Zapier webhook for an organization
// Loads the zapier_webhook_url from business_settings and POSTs the event payload

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface ZapierEventPayload {
  event: string;
  organization_id: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Fires the Zapier webhook for the given organization if configured.
 * Non-blocking: logs errors but never throws.
 */
export async function fireZapierWebhook(
  organizationId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!organizationId) {
    console.log("[fireZapierWebhook] No organizationId, skipping");
    return;
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("[fireZapierWebhook] Missing Supabase config, skipping");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settings } = await supabase
      .from('business_settings')
      .select('zapier_webhook_url')
      .eq('organization_id', organizationId)
      .maybeSingle();

    const webhookUrl = settings?.zapier_webhook_url;
    if (!webhookUrl) {
      console.log("[fireZapierWebhook] No Zapier webhook configured for org:", organizationId);
      return;
    }

    // Validate URL format
    try {
      const parsed = new URL(webhookUrl);
      if (!['https:', 'http:'].includes(parsed.protocol)) {
        console.error("[fireZapierWebhook] Invalid webhook URL protocol");
        return;
      }
    } catch {
      console.error("[fireZapierWebhook] Invalid webhook URL format");
      return;
    }

    const payload: ZapierEventPayload = {
      event,
      organization_id: organizationId,
      timestamp: new Date().toISOString(),
      data,
    };

    console.log(`[fireZapierWebhook] Firing '${event}' for org:`, organizationId);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log(`[fireZapierWebhook] Response status: ${response.status}`);
  } catch (err) {
    console.error("[fireZapierWebhook] Error (non-blocking):", err);
  }
}

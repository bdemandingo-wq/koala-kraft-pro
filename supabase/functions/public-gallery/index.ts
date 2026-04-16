import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase    = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { orgSlug } = await req.json().catch(() => ({}));
  if (!orgSlug) return json({ error: "orgSlug required" }, 400);

  // Resolve org
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) return json({ items: [] });

  // Fetch all gallery-featured media items
  const { data: rows, error } = await supabase
    .from("job_media")
    .select("id, file_url, file_type, media_type, file_name, booking_id, uploaded_at")
    .eq("organization_id", org.id)
    .eq("show_in_gallery", true)
    .order("uploaded_at", { ascending: false });

  if (error) return json({ error: error.message }, 500);
  if (!rows?.length) return json({ items: [] });

  // Generate signed URLs for each item
  const SIGNED_URL_EXPIRY = 60 * 60 * 6; // 6 hours
  const items = await Promise.all(
    rows.map(async (row) => {
      const bucket = row.media_type === "before" ? "job-before-media" : "job-after-media";
      const { data: signed } = await supabase.storage
        .from(bucket)
        .createSignedUrl(row.file_url, SIGNED_URL_EXPIRY);
      return {
        id: row.id,
        booking_id: row.booking_id,
        media_type: row.media_type,      // "before" | "after"
        file_type: row.file_type,        // "photo" | "video" | mime type
        signed_url: signed?.signedUrl ?? null,
        uploaded_at: row.uploaded_at,
      };
    })
  );

  // Group into before/after pairs by booking_id, allowing multiple pairs per booking
  const pairMap = new Map<string, { befores: typeof items[0][]; afters: typeof items[0][] }>();
  for (const item of items) {
    if (!item.signed_url) continue;
    if (!pairMap.has(item.booking_id)) {
      pairMap.set(item.booking_id, { befores: [], afters: [] });
    }
    const group = pairMap.get(item.booking_id)!;
    if (item.media_type === "before") group.befores.push(item);
    else if (item.media_type === "after") group.afters.push(item);
  }

  // Build pairs: zip befores and afters, then show any remaining as standalone
  const pairs: { before: typeof items[0] | null; after: typeof items[0] | null }[] = [];
  for (const group of pairMap.values()) {
    const maxPaired = Math.min(group.befores.length, group.afters.length);
    for (let i = 0; i < maxPaired; i++) {
      pairs.push({ before: group.befores[i], after: group.afters[i] });
    }
    // Remaining unpaired items shown as standalone cards
    for (let i = maxPaired; i < group.befores.length; i++) {
      pairs.push({ before: group.befores[i], after: null });
    }
    for (let i = maxPaired; i < group.afters.length; i++) {
      pairs.push({ before: null, after: group.afters[i] });
    }
  }

  return json({ items: pairs });
});

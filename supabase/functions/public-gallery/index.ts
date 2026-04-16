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

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) return json({ items: [] });

  const { data: rows, error } = await supabase
    .from("job_media")
    .select("id, file_url, file_type, media_type, file_name, booking_id, uploaded_at, bookings!inner(id, notes, vehicle_id, vehicles(year, make, model, color), customers(first_name, last_name))")
    .eq("organization_id", org.id)
    .eq("show_in_gallery", true)
    .order("uploaded_at", { ascending: false });

  if (error) return json({ error: error.message }, 500);
  if (!rows?.length) return json({ items: [] });

  // Build a booking label map from joined vehicle + customer data
  const bookingLabels = new Map<string, string>();
  for (const row of rows ?? []) {
    if (!bookingLabels.has(row.booking_id)) {
      const b = (row as any).bookings;
      const v = b?.vehicles;
      const vehicleLabel = v ? `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim() : "";
      const custName = b?.customers ? `${b.customers.first_name ?? ""} ${b.customers.last_name ?? ""}`.trim() : "";
      bookingLabels.set(row.booking_id, vehicleLabel || custName || "Detail");
    }
  }

  const SIGNED_URL_EXPIRY = 60 * 60 * 6;

  const signedItems = await Promise.all(
    rows.map(async (row) => {
      const bucket = row.media_type === "before" ? "job-before-media" : "job-after-media";
      const { data: signed } = await supabase.storage
        .from(bucket)
        .createSignedUrl(row.file_url, SIGNED_URL_EXPIRY);
      return {
        id: row.id,
        booking_id: row.booking_id,
        media_type: row.media_type,
        file_type: row.file_type,
        signed_url: signed?.signedUrl ?? null,
        uploaded_at: row.uploaded_at,
      };
    })
  );

  // Group ALL media by booking_id into a single post per booking
  const bookingMap = new Map<string, { befores: typeof signedItems; afters: typeof signedItems }>();
  for (const item of signedItems) {
    if (!item.signed_url) continue;
    if (!bookingMap.has(item.booking_id)) {
      bookingMap.set(item.booking_id, { befores: [], afters: [] });
    }
    const group = bookingMap.get(item.booking_id)!;
    if (item.media_type === "before") group.befores.push(item);
    else if (item.media_type === "after") group.afters.push(item);
  }

  // Return as array of posts with label
  const posts = Array.from(bookingMap.entries()).map(([bookingId, { befores, afters }]) => ({
    label: bookingLabels.get(bookingId) ?? "Detail",
    befores,
    afters,
  }));

  return json({ items: posts });
});

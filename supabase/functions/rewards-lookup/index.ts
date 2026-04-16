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

// Normalize phone to digits only for fuzzy matching
const digitsOnly = (s: string) => s.replace(/\D/g, "");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const { phone, organization_slug } = await req.json().catch(() => ({}));
  if (!phone || !organization_slug) return json({ error: "phone and organization_slug required" }, 400);

  // Resolve org
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", organization_slug)
    .maybeSingle();

  if (!org) return json({ error: "Organization not found" }, 404);

  const digits = digitsOnly(phone);
  if (digits.length < 10) return json({ error: "Enter a valid 10-digit phone number" }, 400);

  // Fetch all customers for this org and match by last 10 digits
  const { data: customers } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone")
    .eq("organization_id", org.id);

  const customer = (customers ?? []).find((c) => {
    const cd = digitsOnly(c.phone ?? "");
    return cd.length >= 10 && cd.slice(-10) === digits.slice(-10);
  });

  if (!customer) return json({ error: "No account found for that phone number" }, 404);

  // Count completed bookings = punches (mod 10 for current card progress)
  const { count: totalCompleted } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customer.id)
    .eq("organization_id", org.id)
    .eq("status", "completed");

  const total = totalCompleted ?? 0;
  const punches = total % 10; // current card progress
  const completedCards = Math.floor(total / 10);
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ");

  return json({ punches, name, total_washes: total, completed_cards: completedCards });
});

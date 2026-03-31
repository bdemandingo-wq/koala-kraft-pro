import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, messages, businessSnapshot } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const snap = businessSnapshot || {};

    // Build a rich context string from the snapshot
    const buildDetailedContext = () => {
      const parts: string[] = [];

      parts.push(`Monthly Revenue: $${snap.revenue || 0} (${snap.revenueChange >= 0 ? '+' : ''}${snap.revenueChange || 0}% vs last month, prev: $${snap.prevRevenue || 0})`);
      parts.push(`Average Ticket: $${snap.avgTicket || 0}`);
      parts.push(`Jobs Completed: ${snap.jobStats?.current || 0} this month, ${snap.jobStats?.previous || 0} last month, ${snap.jobStats?.cancelled || 0} cancelled`);
      parts.push(`Hot Leads: ${snap.hotLeads || 0}, Churn Risk: ${snap.churnCount || 0}`);
      parts.push(`Lead Conversion Rate: ${snap.conversionRate || 0}% (${snap.leadStats?.converted || 0} of ${snap.leadStats?.total || 0})`);

      if (snap.leadStats?.bySource && Object.keys(snap.leadStats.bySource).length > 0) {
        parts.push(`Lead Sources: ${Object.entries(snap.leadStats.bySource).map(([s, c]) => `${s}: ${c}`).join(', ')}`);
      }

      parts.push(`Best Day: ${snap.bestDay || "N/A"}`);
      parts.push(`Customers: ${snap.customerStats?.total || 0} total, ${snap.customerStats?.newThisMonth || 0} new this month, ${snap.customerStats?.newLastMonth || 0} new last month`);

      if (snap.packageRevenue?.length) {
        parts.push(`Revenue by Package: ${snap.packageRevenue.map((p: any) => `${p.name}: ${p.jobs} jobs, $${p.revenue}`).join(' | ')}`);
      }

      if (snap.vehicleRevenue?.length) {
        parts.push(`Revenue by Vehicle Type: ${snap.vehicleRevenue.map((v: any) => `${v.type}: ${v.jobs} jobs, $${v.revenue}`).join(' | ')}`);
      }

      if (snap.techPerformance?.length) {
        parts.push(`Technician Performance: ${snap.techPerformance.map((t: any) => `${t.name}: ${t.jobs} jobs, $${t.revenue}`).join(' | ')}`);
      }

      if (snap.lowStockItems?.length) {
        parts.push(`Low Stock Items: ${snap.lowStockItems.map((i: any) => `${i.product_name}: ${i.quantity_on_hand} ${i.unit}`).join(', ')}`);
      }

      if (snap.weeklyData && Object.keys(snap.weeklyData).length > 0) {
        parts.push(`Weekly Distribution: ${Object.entries(snap.weeklyData).map(([d, c]) => `${d}: ${c}`).join(', ')}`);
      }

      return parts.join('\n');
    };

    const detailedContext = buildDetailedContext();

    if (type === "insights") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are We Detail NC AI, a business intelligence assistant for a mobile car detailing company in Charlotte, NC. Services include Express ($175+), Reset ($225+), Deluxe ($350+), Elite ($480+), Ultimate Protect ($580+), and Maintenance Plans. Here is the live business data:\n\n${detailedContext}\n\nReturn exactly 5 JSON objects in an array. Each: { "priority": "Urgent|Watch|Opportunity|Pricing|Growth|Inventory", "insight": "2-sentence specific business insight referencing actual numbers from the data", "confidence": "High confidence|Medium confidence", "action": "short CTA label", "promptText": "full prompt for follow-up" }. Focus on: revenue by package, vehicle type trends, technician performance gaps, inventory alerts, customer churn/upsell opportunities. Return only valid JSON array, no markdown, no code fences.`,
            },
            { role: "user", content: "Generate 5 detailing-specific business insights based on the current data." },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_insights",
                description: "Return 5 business insights as structured data for a mobile car detailing business.",
                parameters: {
                  type: "object",
                  properties: {
                    insights: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          priority: { type: "string", enum: ["Urgent", "Watch", "Opportunity", "Pricing", "Growth", "Inventory"] },
                          insight: { type: "string" },
                          confidence: { type: "string", enum: ["High confidence", "Medium confidence"] },
                          action: { type: "string" },
                          promptText: { type: "string" },
                        },
                        required: ["priority", "insight", "confidence", "action", "promptText"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["insights"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "generate_insights" } },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await response.text();
        console.error("AI gateway error:", status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      let insights = [];
      if (toolCall?.function?.arguments) {
        try {
          const parsed = JSON.parse(toolCall.function.arguments);
          insights = parsed.insights || [];
        } catch { insights = []; }
      }
      return new Response(JSON.stringify({ insights }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (type === "chat") {
      const systemPrompt = `You are We Detail NC AI, a business intelligence assistant for a mobile car detailing company based in Charlotte, NC. The business offers these packages: Express ($175+), Reset ($225+), Deluxe ($350+), Elite ($480+), Ultimate Protect with Ceramic Coating ($580+), and Maintenance Plans (weekly/biweekly/monthly).

Here is the live business data:

${detailedContext}

You have deep knowledge of:
- Revenue by package and vehicle type
- Technician performance and productivity
- Customer retention and churn patterns
- Lead conversion by source (Facebook, Website, Referral, etc.)
- Inventory and supply levels for detailing products
- Scheduling optimization for mobile operations
- Upselling strategies (e.g., Express → Ceramic Coating)

Provide specific, actionable advice referencing actual numbers. When suggesting promotions, reference specific packages and pricing. When discussing customers, reference vehicle types and service history. Keep answers concise (under 250 words) but data-driven.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, ...(messages || [])],
          stream: true,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await response.text();
        console.error("AI gateway error:", status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    if (type === "scheduling") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are We Detail NC AI for a mobile car detailing business in Charlotte NC. Give one specific scheduling recommendation (2-3 sentences) based on the data. Consider drive time between jobs, package durations (Express: 2hr, Reset: 2.5hr, Deluxe: 3.5hr, Elite: 5hr, Ultimate: 6hr), and day-of-week patterns." },
            { role: "user", content: `Weekly booking distribution: ${JSON.stringify(snap.weeklyData || {})}. Best day: ${snap.bestDay || "N/A"}. Jobs this month: ${snap.jobStats?.current || 0}. Technicians: ${snap.techPerformance?.length || "unknown"}. Top package: ${snap.packageRevenue?.[0]?.name || "unknown"}.` },
          ],
        }),
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const recommendation = data.choices?.[0]?.message?.content || "Unable to generate recommendation.";
      return new Response(JSON.stringify({ recommendation }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-analysis-center error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { verifyAdminAuth, createUnauthorizedResponse, createForbiddenResponse } from "../_shared/verify-admin-auth.ts";
import { logAudit, AuditActions } from "../_shared/audit-log.ts";
import { getOrgStripeClient } from "../_shared/get-org-stripe-settings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, organizationId, paymentMethodId } = await req.json();

    const authResult = await verifyAdminAuth(req.headers.get("Authorization"), {
      requireAdmin: true,
      requireOrganizationId: organizationId,
    });

    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error || "Unauthorized", corsHeaders);
    }

    if (!email || !organizationId || !paymentMethodId) {
      return new Response(
        JSON.stringify({ success: false, error: "email, organizationId, and paymentMethodId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeResult = await getOrgStripeClient(organizationId);
    if (!stripeResult.success || !stripeResult.stripe) {
      return new Response(
        JSON.stringify({ success: false, error: stripeResult.error || "Stripe not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const stripe = stripeResult.stripe;

    // Verify the payment method belongs to a customer in this org before detaching
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (!pm.customer) {
      return new Response(
        JSON.stringify({ success: false, error: "Payment method is not attached to any customer" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify customer belongs to this org
    const customer = await stripe.customers.retrieve(pm.customer as string) as Stripe.Customer;
    if (customer.deleted) {
      return new Response(
        JSON.stringify({ success: false, error: "Customer has been deleted" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (customer.metadata?.organization_id && customer.metadata.organization_id !== organizationId) {
      console.error("[remove-customer-card] Org mismatch: card customer org =", customer.metadata.organization_id, "requested org =", organizationId);
      return createForbiddenResponse("Card does not belong to this organization", corsHeaders);
    }

    // Detach the payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    logAudit({
      action: 'payment.card_removed',
      userId: authResult.userId!,
      organizationId,
      resourceType: 'payment_method',
      resourceId: paymentMethodId,
      success: true,
      details: { email, stripeCustomerId: pm.customer },
    });

    console.log("[remove-customer-card] Successfully detached payment method:", paymentMethodId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[remove-customer-card] Error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

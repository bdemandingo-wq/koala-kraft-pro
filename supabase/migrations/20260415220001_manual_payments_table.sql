-- Table for manual charges made via "Charge a Card" on Payment Integration page
CREATE TABLE IF NOT EXISTS public.manual_payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_name    text NOT NULL,
  amount           numeric(10,2) NOT NULL,
  description      text,
  stripe_charge_id text,
  created_by       uuid REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage manual_payments"
  ON public.manual_payments
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships
      WHERE org_memberships.organization_id = manual_payments.organization_id
        AND org_memberships.user_id = auth.uid()
        AND org_memberships.role IN ('owner', 'admin', 'member')
    )
  );

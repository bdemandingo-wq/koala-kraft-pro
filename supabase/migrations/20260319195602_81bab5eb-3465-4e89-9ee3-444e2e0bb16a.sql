
CREATE TABLE public.charge_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  booking_id UUID,
  customer_id UUID,
  stripe_customer_id TEXT,
  payment_method_id TEXT,
  customer_email TEXT,
  amount_cents INTEGER,
  match_status TEXT NOT NULL CHECK (match_status IN ('pass', 'fail', 'skipped')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.charge_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view charge audit logs"
  ON public.charge_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE INDEX idx_charge_audit_log_org ON public.charge_audit_log(organization_id);
CREATE INDEX idx_charge_audit_log_booking ON public.charge_audit_log(booking_id);

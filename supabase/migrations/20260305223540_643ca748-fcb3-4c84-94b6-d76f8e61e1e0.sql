
CREATE TABLE public.payroll_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  details JSONB DEFAULT '{}',
  affected_booking_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payroll_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view payroll audit logs"
  ON public.payroll_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_org_admin(organization_id));

CREATE POLICY "Org admins can insert payroll audit logs"
  ON public.payroll_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));

CREATE INDEX idx_payroll_audit_log_org ON public.payroll_audit_log(organization_id);

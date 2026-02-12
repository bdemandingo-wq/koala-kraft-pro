
-- Create tips table to track tip payments
CREATE TABLE public.tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  amount NUMERIC(10,2) NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired')),
  payment_intent_id TEXT NULL,
  customer_name TEXT NULL,
  customer_phone TEXT NULL,
  sms_sent_at TIMESTAMPTZ NULL,
  paid_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Policy: org members can manage tips
CREATE POLICY "Org members can view tips"
  ON public.tips FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can insert tips"
  ON public.tips FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.org_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update tips"
  ON public.tips FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_memberships WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow public access by token for tip payment page (service role handles payment)
CREATE POLICY "Public can view tips by token"
  ON public.tips FOR SELECT
  USING (true);

-- Index for token lookups
CREATE INDEX idx_tips_token ON public.tips(token);
CREATE INDEX idx_tips_booking_id ON public.tips(booking_id);
CREATE INDEX idx_tips_organization_id ON public.tips(organization_id);

-- Trigger for updated_at
CREATE TRIGGER update_tips_updated_at
  BEFORE UPDATE ON public.tips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

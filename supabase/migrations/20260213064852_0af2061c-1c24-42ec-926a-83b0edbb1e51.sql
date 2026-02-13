
-- Create deposit_requests table
CREATE TABLE public.deposit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  amount NUMERIC(10,2) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'expired')),
  payment_intent_id TEXT,
  sms_sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

-- Admin policy: org members can manage deposit requests
CREATE POLICY "Org members can manage deposit requests"
ON public.deposit_requests
FOR ALL
USING (
  organization_id IN (
    SELECT om.organization_id FROM public.org_memberships om WHERE om.user_id = auth.uid()
  )
);

-- Public read for token-based access (customers accessing via link)
CREATE POLICY "Public can read deposit requests by token"
ON public.deposit_requests
FOR SELECT
USING (true);

-- Create index for token lookups
CREATE INDEX idx_deposit_requests_token ON public.deposit_requests(token);
CREATE INDEX idx_deposit_requests_booking_id ON public.deposit_requests(booking_id);
CREATE INDEX idx_deposit_requests_org_id ON public.deposit_requests(organization_id);

-- Trigger for updated_at
CREATE TRIGGER update_deposit_requests_updated_at
BEFORE UPDATE ON public.deposit_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

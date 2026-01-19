-- Create table for organization invoice settings (payment methods)
CREATE TABLE public.organization_invoice_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  accept_cards BOOLEAN DEFAULT true,
  accept_ach BOOLEAN DEFAULT true,
  accept_checks BOOLEAN DEFAULT false,
  accept_paypal BOOLEAN DEFAULT false,
  card_fee_percent NUMERIC DEFAULT 2.9,
  card_fee_fixed NUMERIC DEFAULT 0.30,
  ach_fee_percent NUMERIC DEFAULT 0,
  ach_fee_fixed NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Create table for invoice payment reminders
CREATE TABLE public.invoice_payment_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  days_after_due INTEGER NOT NULL DEFAULT 2,
  send_email BOOLEAN DEFAULT true,
  send_sms BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add scheduling fields to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_interval TEXT,
ADD COLUMN IF NOT EXISTS send_copy_to_self BOOLEAN DEFAULT true;

-- Enable Row Level Security
ALTER TABLE public.organization_invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payment_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for organization_invoice_settings
CREATE POLICY "Users can view their org invoice settings"
ON public.organization_invoice_settings
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.org_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their org invoice settings"
ON public.organization_invoice_settings
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.org_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their org invoice settings"
ON public.organization_invoice_settings
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.org_memberships WHERE user_id = auth.uid()
  )
);

-- Create policies for invoice_payment_reminders
CREATE POLICY "Users can view their org payment reminders"
ON public.invoice_payment_reminders
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.org_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their org payment reminders"
ON public.invoice_payment_reminders
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.org_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their org payment reminders"
ON public.invoice_payment_reminders
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.org_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their org payment reminders"
ON public.invoice_payment_reminders
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.org_memberships WHERE user_id = auth.uid()
  )
);

-- Create trigger for updated_at on organization_invoice_settings
CREATE TRIGGER update_organization_invoice_settings_updated_at
BEFORE UPDATE ON public.organization_invoice_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
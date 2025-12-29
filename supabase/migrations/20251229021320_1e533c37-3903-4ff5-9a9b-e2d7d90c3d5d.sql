-- Create organization SMS settings table for multi-tenant OpenPhone integration
CREATE TABLE public.organization_sms_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  openphone_api_key TEXT,
  openphone_phone_number_id TEXT,
  sms_enabled BOOLEAN DEFAULT false,
  sms_booking_confirmation BOOLEAN DEFAULT true,
  sms_appointment_reminder BOOLEAN DEFAULT true,
  reminder_hours_before INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_sms_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies - only org members can view, only admins can modify
CREATE POLICY "Organization members can view SMS settings"
ON public.organization_sms_settings
FOR SELECT
USING (public.is_org_member(organization_id));

CREATE POLICY "Organization admins can insert SMS settings"
ON public.organization_sms_settings
FOR INSERT
WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Organization admins can update SMS settings"
ON public.organization_sms_settings
FOR UPDATE
USING (public.is_org_admin(organization_id));

CREATE POLICY "Organization admins can delete SMS settings"
ON public.organization_sms_settings
FOR DELETE
USING (public.is_org_admin(organization_id));

-- Add trigger for updated_at
CREATE TRIGGER update_organization_sms_settings_updated_at
BEFORE UPDATE ON public.organization_sms_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
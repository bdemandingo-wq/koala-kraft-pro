
-- Create organization automations table for per-org automation toggles
CREATE TABLE public.organization_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  automation_type TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, automation_type)
);

-- Enable RLS
ALTER TABLE public.organization_automations ENABLE ROW LEVEL SECURITY;

-- Policies: org admins can view and manage
CREATE POLICY "Org admins can view automations"
  ON public.organization_automations FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org admins can update automations"
  ON public.organization_automations FOR UPDATE
  USING (public.is_org_admin(organization_id));

CREATE POLICY "Org admins can insert automations"
  ON public.organization_automations FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Org admins can delete automations"
  ON public.organization_automations FOR DELETE
  USING (public.is_org_admin(organization_id));

-- Timestamp trigger
CREATE TRIGGER update_organization_automations_updated_at
  BEFORE UPDATE ON public.organization_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to provision default automations for a new organization
CREATE OR REPLACE FUNCTION public.provision_default_automations()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.organization_automations (organization_id, automation_type, is_enabled, description)
  VALUES
    (NEW.id, 'review_request', true, 'Send review request SMS 30 minutes after job completion'),
    (NEW.id, 'appointment_reminder', true, 'Send appointment reminder SMS 24 hours before scheduled cleaning'),
    (NEW.id, 'missed_call_textback', true, 'Auto-reply SMS when a call is missed on the organization phone number'),
    (NEW.id, 'rebooking_reminder', true, 'Send rebooking reminder 28 days after completed cleaning'),
    (NEW.id, 'recurring_upsell', true, 'Send recurring service upsell 2 hours after completed cleaning'),
    (NEW.id, 'winback_60day', true, 'Send win-back message to customers inactive for 60+ days')
  ON CONFLICT (organization_id, automation_type) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Trigger on new organization creation
CREATE TRIGGER provision_automations_on_org_create
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.provision_default_automations();

-- Backfill existing organizations with default automations
INSERT INTO public.organization_automations (organization_id, automation_type, is_enabled, description)
SELECT o.id, a.automation_type, true, a.description
FROM public.organizations o
CROSS JOIN (
  VALUES
    ('review_request', 'Send review request SMS 30 minutes after job completion'),
    ('appointment_reminder', 'Send appointment reminder SMS 24 hours before scheduled cleaning'),
    ('missed_call_textback', 'Auto-reply SMS when a call is missed on the organization phone number'),
    ('rebooking_reminder', 'Send rebooking reminder 28 days after completed cleaning'),
    ('recurring_upsell', 'Send recurring service upsell 2 hours after completed cleaning'),
    ('winback_60day', 'Send win-back message to customers inactive for 60+ days')
) AS a(automation_type, description)
ON CONFLICT (organization_id, automation_type) DO NOTHING;

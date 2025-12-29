-- Create organization_email_settings table for email identity
-- This is SEPARATE from business_settings to prevent cross-org email leakage

CREATE TABLE public.organization_email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_name text NOT NULL,
  from_email text NOT NULL,
  reply_to_email text,
  email_footer text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- One organization = one email identity (enforced at DB level)
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.organization_email_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own organization's email settings
-- Uses org_memberships to determine organization access (NOT profiles.organization_id)
CREATE POLICY "Org members can view email settings"
ON public.organization_email_settings
FOR SELECT
USING (organization_id = get_user_organization_id());

-- Only org admins/owners can modify email settings
CREATE POLICY "Org admins can manage email settings"
ON public.organization_email_settings
FOR ALL
USING (is_org_admin(organization_id))
WITH CHECK (is_org_admin(organization_id));

-- Create trigger for updated_at
CREATE TRIGGER update_organization_email_settings_updated_at
BEFORE UPDATE ON public.organization_email_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment explaining separation from business_settings
COMMENT ON TABLE public.organization_email_settings IS 
'Email sending identity for organizations. SEPARATE from business_settings to enforce strict org isolation for outgoing emails. One org = one email identity.';
-- Custom frequency presets per organization
CREATE TABLE public.custom_frequencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  interval_days INTEGER NOT NULL CHECK (interval_days > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_frequencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view custom frequencies"
  ON public.custom_frequencies FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.org_memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org admins can manage custom frequencies"
  ON public.custom_frequencies FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.org_memberships WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Add custom_frequency_days column to bookings for free-form intervals
ALTER TABLE public.bookings ADD COLUMN custom_frequency_days INTEGER DEFAULT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_custom_frequencies_updated_at
  BEFORE UPDATE ON public.custom_frequencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
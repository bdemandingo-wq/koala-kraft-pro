
-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  year TEXT,
  make TEXT,
  model TEXT,
  color TEXT,
  vehicle_type TEXT,
  condition TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add vehicle_id to bookings
ALTER TABLE public.bookings ADD COLUMN vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- RLS: org members can read their org's vehicles
CREATE POLICY "Org members can view vehicles" ON public.vehicles
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

-- RLS: org admins can insert vehicles
CREATE POLICY "Org members can insert vehicles" ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id));

-- RLS: org admins can update vehicles
CREATE POLICY "Org members can update vehicles" ON public.vehicles
  FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id));

-- RLS: org admins can delete vehicles
CREATE POLICY "Org members can delete vehicles" ON public.vehicles
  FOR DELETE TO authenticated
  USING (public.is_org_member(organization_id));

-- Allow anon insert for public booking form vehicle creation
CREATE POLICY "Anon can insert vehicles" ON public.vehicles
  FOR INSERT TO anon
  WITH CHECK (true);

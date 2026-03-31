
-- Add supplier_link to inventory_items if not exists
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS supplier_link text;

-- Add unit column if not exists
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS unit text DEFAULT 'units';

-- Create inventory_usage table
CREATE TABLE IF NOT EXISTS public.inventory_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  quantity_used decimal NOT NULL DEFAULT 0,
  used_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  used_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory_usage
CREATE POLICY "Org members can view inventory usage"
  ON public.inventory_usage FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org admins can insert inventory usage"
  ON public.inventory_usage FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org admins can update inventory usage"
  ON public.inventory_usage FOR UPDATE
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org admins can delete inventory usage"
  ON public.inventory_usage FOR DELETE
  TO authenticated
  USING (public.is_org_admin(organization_id));

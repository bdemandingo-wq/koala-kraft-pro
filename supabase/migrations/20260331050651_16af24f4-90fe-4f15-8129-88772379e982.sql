
-- Add new detailing-specific fields to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS vehicle_info text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS license_plate text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS pay_type text DEFAULT 'per_job';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS package_pay_rates jsonb DEFAULT '{}';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS commission_rate numeric;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS bonus_trigger text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS bonus_threshold numeric;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS bonus_amount numeric;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS bonus_type text DEFAULT 'flat';

-- Add tip_split_percent to business_settings  
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS tip_split_technician_percent numeric DEFAULT 100;

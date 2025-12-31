-- Add visibility toggle columns to organization_pricing_settings
ALTER TABLE public.organization_pricing_settings 
ADD COLUMN IF NOT EXISTS show_addons_on_booking boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_frequency_discount boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_pet_options boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_home_condition boolean DEFAULT true;
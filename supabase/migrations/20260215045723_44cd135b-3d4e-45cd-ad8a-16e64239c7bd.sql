-- Add custom form color columns for full booking form branding
ALTER TABLE public.organization_pricing_settings 
ADD COLUMN IF NOT EXISTS form_bg_color TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS form_card_color TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS form_text_color TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS form_button_color TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS form_button_text_color TEXT DEFAULT NULL;

-- Add Zapier webhook URL column to business_settings
ALTER TABLE public.business_settings
ADD COLUMN IF NOT EXISTS zapier_webhook_url TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.business_settings.zapier_webhook_url IS 'Per-organization Zapier webhook URL that fires on key events (new booking, completed job, new customer, etc.)';

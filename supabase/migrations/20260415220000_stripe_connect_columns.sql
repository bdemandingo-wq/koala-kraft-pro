-- Add Stripe Connect OAuth columns to org_stripe_settings
ALTER TABLE public.org_stripe_settings
  ADD COLUMN IF NOT EXISTS stripe_access_token  text,
  ADD COLUMN IF NOT EXISTS stripe_refresh_token text,
  ADD COLUMN IF NOT EXISTS stripe_user_email    text,
  ADD COLUMN IF NOT EXISTS stripe_display_name  text,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS stripe_default_currency text DEFAULT 'usd';

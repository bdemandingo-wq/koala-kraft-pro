-- Create table to store short URLs for SMS links
CREATE TABLE public.short_urls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(8) NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Create index for fast lookups
CREATE INDEX idx_short_urls_code ON public.short_urls(code);

-- Enable RLS
ALTER TABLE public.short_urls ENABLE ROW LEVEL SECURITY;

-- Allow public read for redirects (anyone with the code can access)
CREATE POLICY "Anyone can read short URLs by code" 
ON public.short_urls 
FOR SELECT 
USING (true);

-- Allow authenticated users to create short URLs
CREATE POLICY "Authenticated users can create short URLs" 
ON public.short_urls 
FOR INSERT 
WITH CHECK (true);
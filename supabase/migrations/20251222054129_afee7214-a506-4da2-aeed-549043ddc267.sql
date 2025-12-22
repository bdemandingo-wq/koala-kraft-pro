-- Add notes column for call tracking to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes text;
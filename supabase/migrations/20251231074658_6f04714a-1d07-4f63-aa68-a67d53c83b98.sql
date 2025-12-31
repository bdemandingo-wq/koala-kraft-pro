-- Add calendar_color column to staff table for custom color assignments
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS calendar_color TEXT;
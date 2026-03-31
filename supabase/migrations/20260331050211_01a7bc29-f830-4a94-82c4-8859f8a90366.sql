
-- Add travel_time column to bookings (default 30 minutes)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS travel_time integer DEFAULT 30;

-- Add en_route to the booking_status enum
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'en_route';

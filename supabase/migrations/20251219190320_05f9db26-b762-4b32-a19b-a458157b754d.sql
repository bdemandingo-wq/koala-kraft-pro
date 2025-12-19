-- Add cleaner payment fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN cleaner_wage numeric DEFAULT NULL,
ADD COLUMN cleaner_wage_type text DEFAULT 'hourly' CHECK (cleaner_wage_type IN ('hourly', 'flat', 'percentage')),
ADD COLUMN cleaner_override_hours numeric DEFAULT NULL,
ADD COLUMN cleaner_actual_payment numeric DEFAULT NULL;
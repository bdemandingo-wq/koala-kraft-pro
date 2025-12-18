-- Add a sequential booking number column
ALTER TABLE public.bookings ADD COLUMN booking_number SERIAL;

-- Create an index for faster lookups
CREATE INDEX idx_bookings_booking_number ON public.bookings(booking_number);
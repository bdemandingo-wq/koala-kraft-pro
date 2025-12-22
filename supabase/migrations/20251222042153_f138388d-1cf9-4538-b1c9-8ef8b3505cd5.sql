-- Allow staff to view unassigned bookings (for "Open Jobs" feature)
CREATE POLICY "Staff can view unassigned bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  staff_id IS NULL 
  AND status IN ('pending', 'confirmed')
  AND has_role(auth.uid(), 'staff'::app_role)
);

-- Add new service types if they don't exist
INSERT INTO public.services (name, description, price, duration, is_active)
SELECT 'Post Construction Clean', 'Heavy-duty cleaning after construction or renovation', 400, 300, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Post Construction Clean');

INSERT INTO public.services (name, description, price, duration, is_active)
SELECT 'Commercial Cleaning', 'Professional cleaning for commercial spaces and offices', 350, 300, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Commercial Cleaning');

INSERT INTO public.services (name, description, price, duration, is_active)
SELECT 'Airbnb/Short-Term Rental', 'Turnover cleaning for vacation rentals and Airbnb properties', 200, 180, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name ILIKE '%airbnb%');
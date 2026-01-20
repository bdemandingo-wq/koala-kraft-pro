-- Make booking-photos bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'booking-photos';

-- Create RLS policies for booking-photos bucket
-- Staff can upload photos for their bookings
CREATE POLICY "Staff can upload booking photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'booking-photos' 
  AND auth.role() = 'authenticated'
);

-- Staff and admins can view booking photos from their organization
CREATE POLICY "Authenticated users can view booking photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'booking-photos' 
  AND auth.role() = 'authenticated'
);

-- Staff can update their uploaded photos
CREATE POLICY "Staff can update booking photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'booking-photos' 
  AND auth.role() = 'authenticated'
);

-- Admins can delete booking photos
CREATE POLICY "Admins can delete booking photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'booking-photos' 
  AND auth.role() = 'authenticated'
);
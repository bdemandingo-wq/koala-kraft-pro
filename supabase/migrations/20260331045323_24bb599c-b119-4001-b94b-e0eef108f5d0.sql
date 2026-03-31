
-- Create job_media table
CREATE TABLE public.job_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('before', 'after')),
  file_type text NOT NULL CHECK (file_type IN ('photo', 'video')),
  file_url text NOT NULL,
  file_name text NOT NULL,
  uploaded_by uuid REFERENCES public.staff(id),
  uploaded_at timestamptz DEFAULT now(),
  notes text,
  damage_notes text,
  customer_acknowledged boolean DEFAULT false
);

ALTER TABLE public.job_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage job_media"
  ON public.job_media
  FOR ALL
  TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('job-before-media', 'job-before-media', false, 104857600),
  ('job-after-media', 'job-after-media', false, 104857600);

-- Storage RLS for job-before-media
CREATE POLICY "Org members can upload before media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'job-before-media' AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM public.organizations o
    JOIN public.org_memberships om ON om.organization_id = o.id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY "Org members can read before media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'job-before-media' AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM public.organizations o
    JOIN public.org_memberships om ON om.organization_id = o.id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete before media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'job-before-media' AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM public.organizations o
    JOIN public.org_memberships om ON om.organization_id = o.id
    WHERE om.user_id = auth.uid()
  ));

-- Storage RLS for job-after-media
CREATE POLICY "Org members can upload after media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'job-after-media' AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM public.organizations o
    JOIN public.org_memberships om ON om.organization_id = o.id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY "Org members can read after media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'job-after-media' AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM public.organizations o
    JOIN public.org_memberships om ON om.organization_id = o.id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete after media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'job-after-media' AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM public.organizations o
    JOIN public.org_memberships om ON om.organization_id = o.id
    WHERE om.user_id = auth.uid()
  ));

-- Staff access policies for storage (technicians uploading from mobile)
CREATE POLICY "Staff can upload before media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'job-before-media' AND (storage.foldername(name))[1] IN (
    SELECT s.organization_id::text FROM public.staff s WHERE s.user_id = auth.uid() AND s.is_active = true
  ));

CREATE POLICY "Staff can read before media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'job-before-media' AND (storage.foldername(name))[1] IN (
    SELECT s.organization_id::text FROM public.staff s WHERE s.user_id = auth.uid() AND s.is_active = true
  ));

CREATE POLICY "Staff can upload after media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'job-after-media' AND (storage.foldername(name))[1] IN (
    SELECT s.organization_id::text FROM public.staff s WHERE s.user_id = auth.uid() AND s.is_active = true
  ));

CREATE POLICY "Staff can read after media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'job-after-media' AND (storage.foldername(name))[1] IN (
    SELECT s.organization_id::text FROM public.staff s WHERE s.user_id = auth.uid() AND s.is_active = true
  ));

-- Staff RLS for job_media table
CREATE POLICY "Staff can view job_media for their bookings"
  ON public.job_media FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.user_id = auth.uid() AND s.is_active = true
      AND s.organization_id = job_media.organization_id
    )
  );

CREATE POLICY "Staff can insert job_media"
  ON public.job_media FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.user_id = auth.uid() AND s.is_active = true
      AND s.organization_id = job_media.organization_id
    )
  );

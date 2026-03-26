-- Allow staff to upload signatures into signatures/ folder
DROP POLICY IF EXISTS "Staff can upload signatures" ON storage.objects;
CREATE POLICY "Staff can upload signatures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff-documents'
  AND (storage.foldername(name))[1] = 'signatures'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow service role / edge functions to upload signed PDFs into signed/ folder
-- Edge functions use service role key which bypasses RLS, so no policy needed for that.

-- Allow admins to read signed PDFs  
DROP POLICY IF EXISTS "Admins can view signed PDFs" ON storage.objects;
CREATE POLICY "Admins can view signed PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'staff-documents'
  AND (storage.foldername(name))[1] = 'signed'
  AND EXISTS (
    SELECT 1 FROM public.org_memberships om
    WHERE om.user_id = auth.uid()
      AND om.organization_id::text = (storage.foldername(name))[2]
      AND om.role IN ('owner', 'admin')
  )
);

-- Allow admins to delete signable docs
DROP POLICY IF EXISTS "Admins can delete signable documents" ON storage.objects;
CREATE POLICY "Admins can delete signable documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'staff-documents'
  AND (storage.foldername(name))[1] = 'signable'
  AND EXISTS (
    SELECT 1 FROM public.org_memberships om
    WHERE om.user_id = auth.uid()
      AND om.organization_id::text = (storage.foldername(name))[2]
      AND om.role IN ('owner', 'admin')
  )
);

-- Add signed_pdf_path column to staff_signatures
ALTER TABLE public.staff_signatures ADD COLUMN IF NOT EXISTS signed_pdf_path text;
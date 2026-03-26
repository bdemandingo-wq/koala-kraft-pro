-- Allow organization admins/owners to upload org-wide signable docs into staff-documents bucket
DROP POLICY IF EXISTS "Admins can upload signable documents" ON storage.objects;
CREATE POLICY "Admins can upload signable documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff-documents'
  AND (storage.foldername(name))[1] = 'signable'
  AND EXISTS (
    SELECT 1
    FROM public.org_memberships om
    WHERE om.user_id = auth.uid()
      AND om.organization_id::text = (storage.foldername(name))[2]
      AND om.role IN ('owner', 'admin')
  )
);
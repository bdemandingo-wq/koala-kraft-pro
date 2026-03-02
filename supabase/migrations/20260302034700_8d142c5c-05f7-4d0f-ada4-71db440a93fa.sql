-- Create storage bucket for staff documents (insurance, W9, etc.)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('staff-documents', 'staff-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Staff can upload their own documents
CREATE POLICY "Staff can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'staff-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Staff can view their own documents
CREATE POLICY "Staff can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'staff-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Staff can delete their own documents
CREATE POLICY "Staff can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'staff-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Admins can view staff documents in their org
CREATE POLICY "Admins can view staff documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'staff-documents'
  AND EXISTS (
    SELECT 1 FROM public.org_memberships om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Create a table to track staff document metadata
CREATE TABLE IF NOT EXISTS public.staff_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other',
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

-- Staff can view their own documents
CREATE POLICY "Staff view own documents" ON public.staff_documents
FOR SELECT USING (user_id = auth.uid());

-- Staff can insert their own documents
CREATE POLICY "Staff insert own documents" ON public.staff_documents
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Staff can delete their own documents
CREATE POLICY "Staff delete own documents" ON public.staff_documents
FOR DELETE USING (user_id = auth.uid());

-- Admins can view org documents
CREATE POLICY "Admins view org documents" ON public.staff_documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.org_memberships om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = staff_documents.organization_id
    AND om.role IN ('owner', 'admin')
  )
);

-- Signable documents that admin uploads for staff to sign
CREATE TABLE public.staff_signable_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  created_by uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_signable_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view signable docs"
  ON public.staff_signable_documents FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org admins can manage signable docs"
  ON public.staff_signable_documents FOR ALL
  TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

-- Staff can also view signable docs for their org
CREATE POLICY "Staff can view signable docs"
  ON public.staff_signable_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.user_id = auth.uid()
        AND s.organization_id = staff_signable_documents.organization_id
        AND s.is_active = true
    )
  );

-- Signatures recorded by staff
CREATE TABLE public.staff_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signable_document_id uuid NOT NULL REFERENCES public.staff_signable_documents(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  signature_data text NOT NULL,
  signature_type text NOT NULL DEFAULT 'draw',
  signed_pdf_path text,
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  UNIQUE(signable_document_id, staff_id)
);

ALTER TABLE public.staff_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own signatures"
  ON public.staff_signatures FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can insert own signatures"
  ON public.staff_signatures FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Org admins can view all signatures"
  ON public.staff_signatures FOR SELECT
  TO authenticated
  USING (public.is_org_admin(organization_id));

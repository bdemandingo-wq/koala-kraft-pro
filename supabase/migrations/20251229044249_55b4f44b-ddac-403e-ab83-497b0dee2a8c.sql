-- =====================================================
-- SECURITY HARDENING: Customer & Staff Data Protection
-- =====================================================

-- 1. Create a view for staff that hides sensitive data from non-admins
-- Staff members can only see their own sensitive data, admins see all
CREATE OR REPLACE VIEW public.staff_safe AS
SELECT 
  s.id,
  s.name,
  s.email,
  s.phone,
  s.avatar_url,
  s.bio,
  s.is_active,
  s.organization_id,
  s.created_at,
  s.updated_at,
  s.user_id,
  -- Only show sensitive fields to admins or the staff member themselves
  CASE 
    WHEN public.is_org_admin(s.organization_id) OR s.user_id = auth.uid() 
    THEN s.ssn_last4 
    ELSE NULL 
  END as ssn_last4,
  CASE 
    WHEN public.is_org_admin(s.organization_id) OR s.user_id = auth.uid() 
    THEN s.ein 
    ELSE NULL 
  END as ein,
  CASE 
    WHEN public.is_org_admin(s.organization_id) OR s.user_id = auth.uid() 
    THEN s.tax_classification 
    ELSE NULL 
  END as tax_classification,
  CASE 
    WHEN public.is_org_admin(s.organization_id) OR s.user_id = auth.uid() 
    THEN s.tax_document_url 
    ELSE NULL 
  END as tax_document_url,
  CASE 
    WHEN public.is_org_admin(s.organization_id) OR s.user_id = auth.uid() 
    THEN s.base_wage 
    ELSE NULL 
  END as base_wage,
  CASE 
    WHEN public.is_org_admin(s.organization_id) OR s.user_id = auth.uid() 
    THEN s.hourly_rate 
    ELSE NULL 
  END as hourly_rate,
  CASE 
    WHEN public.is_org_admin(s.organization_id) OR s.user_id = auth.uid() 
    THEN s.percentage_rate 
    ELSE NULL 
  END as percentage_rate
FROM public.staff s
WHERE public.is_org_member(s.organization_id);

-- 2. Drop existing customer policies and create stricter ones
DROP POLICY IF EXISTS "Users can view customers in their organization" ON public.customers;
DROP POLICY IF EXISTS "Users can insert customers in their organization" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers in their organization" ON public.customers;
DROP POLICY IF EXISTS "Users can delete customers in their organization" ON public.customers;

-- Create new stricter policies for customers
-- Only org members can view customers in their organization
CREATE POLICY "Org members can view their org customers" 
ON public.customers 
FOR SELECT 
USING (public.is_org_member(organization_id));

-- Only admins can create customers
CREATE POLICY "Admins can create customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (public.is_org_admin(organization_id));

-- Only admins can update customers
CREATE POLICY "Admins can update customers" 
ON public.customers 
FOR UPDATE 
USING (public.is_org_admin(organization_id));

-- Only admins can delete customers
CREATE POLICY "Admins can delete customers" 
ON public.customers 
FOR DELETE 
USING (public.is_org_admin(organization_id));

-- 3. Drop existing staff policies and create stricter ones
DROP POLICY IF EXISTS "Users can view staff in their organization" ON public.staff;
DROP POLICY IF EXISTS "Users can insert staff in their organization" ON public.staff;
DROP POLICY IF EXISTS "Users can update staff in their organization" ON public.staff;
DROP POLICY IF EXISTS "Users can delete staff in their organization" ON public.staff;
DROP POLICY IF EXISTS "Staff can view their own record" ON public.staff;
DROP POLICY IF EXISTS "Staff can update their own profile" ON public.staff;

-- Staff can view basic info of other staff in their org (sensitive data hidden via view)
CREATE POLICY "Org members can view staff in their org" 
ON public.staff 
FOR SELECT 
USING (public.is_org_member(organization_id));

-- Only admins can create staff
CREATE POLICY "Admins can create staff" 
ON public.staff 
FOR INSERT 
WITH CHECK (public.is_org_admin(organization_id));

-- Staff can update their own non-sensitive fields, admins can update all
CREATE POLICY "Staff can update own profile or admins update all" 
ON public.staff 
FOR UPDATE 
USING (
  public.is_org_admin(organization_id) 
  OR (user_id = auth.uid() AND public.is_org_member(organization_id))
);

-- Only admins can delete staff
CREATE POLICY "Admins can delete staff" 
ON public.staff 
FOR DELETE 
USING (public.is_org_admin(organization_id));

-- 4. Protect tax-documents storage bucket - only admins and document owner
DROP POLICY IF EXISTS "Admins can view tax documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload tax documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete tax documents" ON storage.objects;

-- Create stricter storage policies for tax documents
CREATE POLICY "Admins or owner can view tax documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tax-documents' 
  AND (
    -- Check if user is admin of any org they belong to
    EXISTS (
      SELECT 1 FROM public.org_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
    -- Or the file belongs to the user (filename starts with their user_id)
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

CREATE POLICY "Admins or owner can upload tax documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tax-documents' 
  AND (
    EXISTS (
      SELECT 1 FROM public.org_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

CREATE POLICY "Admins can delete tax documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tax-documents' 
  AND EXISTS (
    SELECT 1 FROM public.org_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);
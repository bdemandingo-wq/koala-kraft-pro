-- =====================================================
-- SECURITY HARDENING MIGRATION
-- Fix overly permissive RLS policies
-- =====================================================

-- 1. Fix customer_loyalty policies - REMOVE permissive policies and add proper org-based access
DROP POLICY IF EXISTS "Admin can manage loyalty" ON public.customer_loyalty;
DROP POLICY IF EXISTS "Staff can view loyalty" ON public.customer_loyalty;

-- Admins can manage loyalty for their organization's customers
CREATE POLICY "Org admins can manage customer loyalty"
ON public.customer_loyalty
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.customers c
    JOIN public.org_memberships om ON om.organization_id = c.organization_id
    WHERE c.id = customer_loyalty.customer_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers c
    JOIN public.org_memberships om ON om.organization_id = c.organization_id
    WHERE c.id = customer_loyalty.customer_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
);

-- Staff can view loyalty for customers in their organization
CREATE POLICY "Org staff can view customer loyalty"
ON public.customer_loyalty
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customers c
    JOIN public.staff s ON s.organization_id = c.organization_id
    WHERE c.id = customer_loyalty.customer_id
      AND s.user_id = auth.uid()
      AND s.is_active = true
  )
);

-- 2. Fix loyalty_transactions policies - REMOVE permissive policies and add proper org-based access
DROP POLICY IF EXISTS "Admin can manage loyalty transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Staff can view loyalty transactions" ON public.loyalty_transactions;

-- Admins can manage loyalty transactions for their organization's customers
CREATE POLICY "Org admins can manage loyalty transactions"
ON public.loyalty_transactions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.customers c
    JOIN public.org_memberships om ON om.organization_id = c.organization_id
    WHERE c.id = loyalty_transactions.customer_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers c
    JOIN public.org_memberships om ON om.organization_id = c.organization_id
    WHERE c.id = loyalty_transactions.customer_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
);

-- Staff can view loyalty transactions for customers in their organization
CREATE POLICY "Org staff can view loyalty transactions"
ON public.loyalty_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customers c
    JOIN public.staff s ON s.organization_id = c.organization_id
    WHERE c.id = loyalty_transactions.customer_id
      AND s.user_id = auth.uid()
      AND s.is_active = true
  )
);

-- 3. Add organization isolation to working_hours if not already secured
DROP POLICY IF EXISTS "Anyone can view working hours" ON public.working_hours;
DROP POLICY IF EXISTS "Public can view working hours" ON public.working_hours;

-- Only org members can view working hours
CREATE POLICY "Org members can view working hours"
ON public.working_hours
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff s
    JOIN public.org_memberships om ON om.organization_id = s.organization_id
    WHERE s.id = working_hours.staff_id
      AND om.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.staff s
    JOIN public.staff staff_viewer ON staff_viewer.organization_id = s.organization_id
    WHERE s.id = working_hours.staff_id
      AND staff_viewer.user_id = auth.uid()
      AND staff_viewer.is_active = true
  )
);

-- Admins and staff owners can manage their own working hours
CREATE POLICY "Staff can manage own working hours"
ON public.working_hours
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = working_hours.staff_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = working_hours.staff_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Org admins can manage working hours"
ON public.working_hours
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.staff s
    JOIN public.org_memberships om ON om.organization_id = s.organization_id
    WHERE s.id = working_hours.staff_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.staff s
    JOIN public.org_memberships om ON om.organization_id = s.organization_id
    WHERE s.id = working_hours.staff_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
);
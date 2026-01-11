-- =====================================================
-- FINAL SECURITY HARDENING - Remove remaining permissive policies
-- =====================================================

-- Drop the old permissive policies on customer_loyalty if they still exist
DROP POLICY IF EXISTS "Admin can manage loyalty" ON public.customer_loyalty;
DROP POLICY IF EXISTS "Staff can view loyalty" ON public.customer_loyalty;

-- Drop the old permissive policies on loyalty_transactions if they still exist  
DROP POLICY IF EXISTS "Admin can manage loyalty transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Staff can view loyalty transactions" ON public.loyalty_transactions;

-- Verify policies are in place (if not, create them)
-- Check for customer_loyalty policies
DO $$
BEGIN
  -- Drop existing proper policies first to avoid conflicts
  DROP POLICY IF EXISTS "Org admins can manage customer loyalty" ON public.customer_loyalty;
  DROP POLICY IF EXISTS "Org staff can view customer loyalty" ON public.customer_loyalty;
  
  -- Create fresh policies
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
END $$;

-- Same for loyalty_transactions
DO $$
BEGIN
  DROP POLICY IF EXISTS "Org admins can manage loyalty transactions" ON public.loyalty_transactions;
  DROP POLICY IF EXISTS "Org staff can view loyalty transactions" ON public.loyalty_transactions;
  
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
END $$;

-- Tighten cleaner_notifications insert policy - only allow service role, not anyone
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.cleaner_notifications;

-- Admins can insert notifications for staff in their organization
CREATE POLICY "Org admins can insert notifications"
ON public.cleaner_notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.staff s
    JOIN public.org_memberships om ON om.organization_id = s.organization_id
    WHERE s.id = cleaner_notifications.staff_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
);
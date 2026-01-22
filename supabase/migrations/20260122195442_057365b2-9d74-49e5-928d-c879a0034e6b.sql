-- Security hardening based on scan findings

-- 1) system_logs: remove NULL-org public readability
DO $$
BEGIN
  -- Drop permissive SELECT policy (recreate strict)
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='system_logs' AND policyname='Admins can view org logs'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can view org logs" ON public.system_logs;';
  END IF;

  EXECUTE 'CREATE POLICY "Admins can view org logs" ON public.system_logs FOR SELECT USING (public.is_org_admin(organization_id));';
END $$;

-- 2) services: remove public SELECT access
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;

-- Ensure org-member/admin access remains (do not duplicate if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='services' AND policyname='Org members can manage services'
  ) THEN
    EXECUTE 'CREATE POLICY "Org members can manage services" ON public.services FOR ALL TO authenticated USING (organization_id = public.get_user_organization_id()) WITH CHECK (organization_id = public.get_user_organization_id());';
  END IF;
END $$;

-- 3) service_categories: remove public SELECT access
DROP POLICY IF EXISTS "Public can view categories" ON public.service_categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.service_categories;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='service_categories' AND policyname='Org members can manage categories'
  ) THEN
    EXECUTE 'CREATE POLICY "Org members can manage categories" ON public.service_categories FOR ALL TO authenticated USING (organization_id = public.get_user_organization_id()) WITH CHECK (organization_id = public.get_user_organization_id());';
  END IF;
END $$;

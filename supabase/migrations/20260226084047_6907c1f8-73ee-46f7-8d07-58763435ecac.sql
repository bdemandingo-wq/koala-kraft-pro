-- Tighten short_urls INSERT policy to require authentication
DROP POLICY IF EXISTS "Authenticated users can create short URLs" ON public.short_urls;
CREATE POLICY "Authenticated users can create short URLs"
  ON public.short_urls FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(organization_id));
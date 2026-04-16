-- ============================================================
-- Give both accounts full (owner) access to Remain Clean org
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ymbxlrhyggretbgvpwjf/sql/new
-- ============================================================

DO $$
DECLARE
  v_org_id   UUID;
  v_user1_id UUID;
  v_user2_id UUID;
BEGIN
  -- Find the Remain Clean org (try both likely slugs)
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug IN ('remain-clean-services', 'remainclean', 'remain_clean', 'remaincleanservices')
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Remain Clean org not found — check slug with: SELECT id, name, slug FROM organizations;';
  END IF;
  RAISE NOTICE 'Found org: %', v_org_id;

  -- Ensure slug is consistently "remain-clean-services"
  UPDATE public.organizations SET slug = 'remain-clean-services' WHERE id = v_org_id;

  -- Look up both users
  SELECT id INTO v_user1_id FROM auth.users WHERE email = 'support@tidywisecleaning.com' LIMIT 1;
  SELECT id INTO v_user2_id FROM auth.users WHERE email = 'prophtjeff@yahoo.com' LIMIT 1;

  IF v_user1_id IS NULL THEN RAISE NOTICE 'WARNING: support@tidywisecleaning.com not found in auth.users'; END IF;
  IF v_user2_id IS NULL THEN RAISE NOTICE 'WARNING: prophtjeff@yahoo.com not found in auth.users'; END IF;

  -- Grant owner access to support@tidywisecleaning.com
  IF v_user1_id IS NOT NULL THEN
    INSERT INTO public.org_memberships (organization_id, user_id, role)
    VALUES (v_org_id, v_user1_id, 'owner')
    ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner';
    RAISE NOTICE 'Granted owner to support@tidywisecleaning.com';
  END IF;

  -- Grant owner access to prophtjeff@yahoo.com
  IF v_user2_id IS NOT NULL THEN
    INSERT INTO public.org_memberships (organization_id, user_id, role)
    VALUES (v_org_id, v_user2_id, 'owner')
    ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner';
    RAISE NOTICE 'Granted owner to prophtjeff@yahoo.com';
  END IF;

END $$;

-- Verify result
SELECT u.email, om.role, o.name AS org_name, o.slug
FROM public.org_memberships om
JOIN auth.users u ON u.id = om.user_id
JOIN public.organizations o ON o.id = om.organization_id
WHERE u.email IN ('support@tidywisecleaning.com', 'prophtjeff@yahoo.com');

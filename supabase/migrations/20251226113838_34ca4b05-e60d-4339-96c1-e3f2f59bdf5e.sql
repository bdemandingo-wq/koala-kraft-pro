-- RLS policies for organizations table
CREATE POLICY "Users can view their organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (public.is_org_member(id));

CREATE POLICY "Users can create organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Org owners can update their organization"
ON public.organizations FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Org owners can delete their organization"
ON public.organizations FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- RLS policies for org_memberships table
CREATE POLICY "Users can view memberships in their orgs"
ON public.org_memberships FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.is_org_admin(organization_id)
);

CREATE POLICY "Org admins can manage memberships"
ON public.org_memberships FOR INSERT
TO authenticated
WITH CHECK (
  -- Owner creating first membership for themselves OR admin adding members
  (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())) OR
  public.is_org_admin(organization_id)
);

CREATE POLICY "Org admins can update memberships"
ON public.org_memberships FOR UPDATE
TO authenticated
USING (public.is_org_admin(organization_id))
WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Org admins can remove memberships"
ON public.org_memberships FOR DELETE
TO authenticated
USING (
  public.is_org_admin(organization_id) OR 
  user_id = auth.uid() -- Users can leave orgs
);

-- Drop old admin-based RLS policies and create org-based ones
-- Bookings
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins and staff can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Staff can view assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Staff can view unassigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Staff can update assigned bookings" ON public.bookings;

CREATE POLICY "Org members can manage bookings"
ON public.bookings FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Customers
DROP POLICY IF EXISTS "Admins can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Staff can view customers" ON public.customers;
DROP POLICY IF EXISTS "Staff can create customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view own customer record" ON public.customers;

CREATE POLICY "Org members can manage customers"
ON public.customers FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Staff
DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Anyone can view active staff" ON public.staff;
DROP POLICY IF EXISTS "Staff can view own record" ON public.staff;
DROP POLICY IF EXISTS "Staff can update own record" ON public.staff;

CREATE POLICY "Org members can view staff"
ON public.staff FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can manage staff"
ON public.staff FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id() AND public.is_org_admin(organization_id))
WITH CHECK (organization_id = public.get_user_organization_id() AND public.is_org_admin(organization_id));

CREATE POLICY "Staff can update own record"
ON public.staff FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Services
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;

CREATE POLICY "Org members can manage services"
ON public.services FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Public can view active services"
ON public.services FOR SELECT
TO anon
USING (is_active = true);

-- Service categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.service_categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.service_categories;

CREATE POLICY "Org members can manage categories"
ON public.service_categories FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Public can view categories"
ON public.service_categories FOR SELECT
TO anon
USING (true);

-- Leads
DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;

CREATE POLICY "Org members can manage leads"
ON public.leads FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Quotes
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.quotes;

CREATE POLICY "Org members can manage quotes"
ON public.quotes FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Recurring bookings
DROP POLICY IF EXISTS "Admins can manage recurring bookings" ON public.recurring_bookings;
DROP POLICY IF EXISTS "Customers can view their own recurring bookings" ON public.recurring_bookings;

CREATE POLICY "Org members can manage recurring bookings"
ON public.recurring_bookings FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Expenses
DROP POLICY IF EXISTS "Admins can manage expenses" ON public.expenses;

CREATE POLICY "Org members can manage expenses"
ON public.expenses FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Inventory items
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Staff can view inventory" ON public.inventory_items;

CREATE POLICY "Org members can manage inventory"
ON public.inventory_items FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Locations
DROP POLICY IF EXISTS "Admins can manage locations" ON public.locations;
DROP POLICY IF EXISTS "Anyone can view active locations" ON public.locations;

CREATE POLICY "Org members can manage locations"
ON public.locations FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Automated campaigns
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.automated_campaigns;

CREATE POLICY "Org members can manage campaigns"
ON public.automated_campaigns FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Checklist templates
DROP POLICY IF EXISTS "Admins can manage checklist templates" ON public.checklist_templates;
DROP POLICY IF EXISTS "Staff can view active templates" ON public.checklist_templates;

CREATE POLICY "Org members can manage checklist templates"
ON public.checklist_templates FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Client feedback
DROP POLICY IF EXISTS "Admins can manage client feedback" ON public.client_feedback;

CREATE POLICY "Org members can manage client feedback"
ON public.client_feedback FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Operations tracker
DROP POLICY IF EXISTS "Admins can manage operations tracker" ON public.operations_tracker;

CREATE POLICY "Org members can manage operations tracker"
ON public.operations_tracker FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Business settings
DROP POLICY IF EXISTS "Admins can manage settings" ON public.business_settings;
DROP POLICY IF EXISTS "Anyone can view settings" ON public.business_settings;

CREATE POLICY "Org members can manage business settings"
ON public.business_settings FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Referrals
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
DROP POLICY IF EXISTS "Customers can view own referrals" ON public.referrals;

CREATE POLICY "Org members can manage referrals"
ON public.referrals FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());
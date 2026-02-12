
-- Fix checklist_items RLS policies to use org membership instead of app_role
DROP POLICY IF EXISTS "Admins can manage checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Staff can view checklist items" ON public.checklist_items;

-- Allow org admins to manage checklist items (via template's org)
CREATE POLICY "Org admins can manage checklist items"
ON public.checklist_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.checklist_templates ct
    WHERE ct.id = checklist_items.template_id
    AND public.is_org_admin(ct.organization_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.checklist_templates ct
    WHERE ct.id = checklist_items.template_id
    AND public.is_org_admin(ct.organization_id)
  )
);

-- Allow org members (including staff) to view checklist items
CREATE POLICY "Org members can view checklist items"
ON public.checklist_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.checklist_templates ct
    WHERE ct.id = checklist_items.template_id
    AND public.is_org_member(ct.organization_id)
  )
);

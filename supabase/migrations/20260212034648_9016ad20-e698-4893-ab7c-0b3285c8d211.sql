
-- Auto-create default invoice payment reminders for every new organization
CREATE OR REPLACE FUNCTION public.create_default_payment_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.invoice_payment_reminders (organization_id, days_after_due, send_sms, is_active)
  VALUES
    (NEW.id, 2, true, true),
    (NEW.id, 7, true, true);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_organization_created_default_reminders
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_payment_reminders();

-- Backfill: Add default reminders for all existing organizations that don't have any
INSERT INTO public.invoice_payment_reminders (organization_id, days_after_due, send_sms, is_active)
SELECT o.id, days.d, true, true
FROM public.organizations o
CROSS JOIN (VALUES (2), (7)) AS days(d)
WHERE NOT EXISTS (
  SELECT 1 FROM public.invoice_payment_reminders r WHERE r.organization_id = o.id
);

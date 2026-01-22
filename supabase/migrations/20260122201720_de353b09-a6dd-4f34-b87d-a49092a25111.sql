-- Customer Portal: allow customers to view their own invoices (spending history)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='invoices' AND policyname='Customers can view own invoices'
  ) THEN
    EXECUTE 'CREATE POLICY "Customers can view own invoices" ON public.invoices FOR SELECT USING (customer_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.customers c WHERE c.id = invoices.customer_id AND c.user_id = auth.uid() AND c.organization_id = invoices.organization_id));';
  END IF;
END $$;

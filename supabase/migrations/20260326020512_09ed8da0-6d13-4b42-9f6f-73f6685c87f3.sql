CREATE OR REPLACE FUNCTION public.notify_admin_staff_signature()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_staff_name TEXT;
  v_org_id UUID;
  v_doc_title TEXT;
BEGIN
  SELECT s.name, s.organization_id INTO v_staff_name, v_org_id
  FROM public.staff s WHERE s.id = NEW.staff_id;

  SELECT title INTO v_doc_title
  FROM public.staff_signable_documents WHERE id = NEW.signable_document_id;

  IF v_org_id IS NOT NULL THEN
    INSERT INTO public.staff_event_notifications (organization_id, staff_id, event_type, title, message)
    VALUES (v_org_id, NEW.staff_id, 'document_signed',
      'Document Signed',
      COALESCE(v_staff_name, 'A staff member') || ' signed "' || COALESCE(v_doc_title, 'a document') || '"');
  END IF;
  RETURN NEW;
END;
$function$;
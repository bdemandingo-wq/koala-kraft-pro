
CREATE OR REPLACE FUNCTION public.notify_admin_booking_claimed()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_staff_name TEXT;
  v_customer_name TEXT;
  v_booking_number INTEGER;
BEGIN
  -- Only fire when staff_id changes from NULL to a value (cleaner claims a job)
  IF NEW.staff_id IS NOT NULL AND OLD.staff_id IS NULL AND NEW.organization_id IS NOT NULL THEN
    SELECT s.name INTO v_staff_name
    FROM public.staff s WHERE s.id = NEW.staff_id;

    SELECT CONCAT(c.first_name, ' ', c.last_name) INTO v_customer_name
    FROM public.customers c WHERE c.id = NEW.customer_id;

    INSERT INTO public.staff_event_notifications (organization_id, staff_id, event_type, title, message)
    VALUES (
      NEW.organization_id,
      NEW.staff_id,
      'booking_claimed',
      'Booking Claimed',
      COALESCE(v_staff_name, 'A cleaner') || ' claimed booking #' || NEW.booking_number || COALESCE(' for ' || v_customer_name, '')
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_booking_claimed
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_booking_claimed();

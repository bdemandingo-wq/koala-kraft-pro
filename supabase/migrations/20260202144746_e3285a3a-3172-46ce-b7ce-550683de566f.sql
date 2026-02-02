-- Create a security definer function to insert booking requests from client portal
-- This bypasses RLS since client portal users aren't authenticated via Supabase Auth
CREATE OR REPLACE FUNCTION public.submit_client_booking_request(
  p_client_user_id UUID,
  p_customer_id UUID,
  p_organization_id UUID,
  p_requested_date TIMESTAMPTZ,
  p_service_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
  v_is_valid BOOLEAN;
BEGIN
  -- Validate that the client_user_id exists and belongs to the customer
  SELECT EXISTS(
    SELECT 1 FROM public.client_portal_users
    WHERE id = p_client_user_id
      AND customer_id = p_customer_id
      AND organization_id = p_organization_id
      AND is_active = true
  ) INTO v_is_valid;
  
  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Invalid client portal user or session';
  END IF;
  
  -- Insert the booking request
  INSERT INTO public.client_booking_requests (
    client_user_id,
    customer_id,
    organization_id,
    requested_date,
    service_id,
    notes,
    status
  ) VALUES (
    p_client_user_id,
    p_customer_id,
    p_organization_id,
    p_requested_date,
    p_service_id,
    p_notes,
    'pending'
  )
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$;
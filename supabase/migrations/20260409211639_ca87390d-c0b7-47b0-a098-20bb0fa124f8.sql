
CREATE OR REPLACE FUNCTION public.get_public_booking_data(p_org_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org RECORD;
  v_services jsonb;
  v_pricing jsonb;
  v_branding jsonb;
  v_display jsonb;
  v_form_colors jsonb;
  v_theme text;
BEGIN
  -- Lookup organization
  SELECT id, name, logo_url, slug INTO v_org
  FROM public.organizations
  WHERE slug = p_org_slug;

  IF v_org.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization not found');
  END IF;

  -- Fetch active services
  SELECT COALESCE(jsonb_agg(row_to_json(s)::jsonb ORDER BY s.name), '[]'::jsonb)
  INTO v_services
  FROM (
    SELECT id, name, description, duration, price, is_active, image_url
    FROM public.services
    WHERE organization_id = v_org.id AND is_active = true
  ) s;

  -- Fetch service pricing
  SELECT COALESCE(jsonb_agg(row_to_json(p)::jsonb), '[]'::jsonb)
  INTO v_pricing
  FROM (
    SELECT id, service_id, organization_id, minimum_price, sqft_prices, bedroom_pricing, extras, home_condition_options, pet_options
    FROM public.service_pricing
    WHERE organization_id = v_org.id
  ) p;

  -- Fetch branding
  SELECT jsonb_build_object(
    'primary_color', COALESCE(bs.primary_color, '#3b82f6'),
    'accent_color', COALESCE(bs.accent_color, '#14b8a6')
  ) INTO v_branding
  FROM public.business_settings bs
  WHERE bs.organization_id = v_org.id;

  -- Fetch pricing/display settings
  SELECT
    COALESCE(ops.booking_form_theme, 'dark'),
    jsonb_build_object(
      'bg', ops.form_bg_color,
      'card', ops.form_card_color,
      'text', ops.form_text_color,
      'button', ops.form_button_color,
      'buttonText', ops.form_button_text_color,
      'accent', ops.form_accent_color
    ),
    jsonb_build_object(
      'show_sqft_on_booking', COALESCE(ops.show_sqft_on_booking, true),
      'show_bed_bath_on_booking', COALESCE(ops.show_bed_bath_on_booking, true),
      'show_addons_on_booking', COALESCE(ops.show_addons_on_booking, true),
      'show_frequency_discount', COALESCE(ops.show_frequency_discount, true),
      'show_pet_options', COALESCE(ops.show_pet_options, true),
      'show_home_condition', COALESCE(ops.show_home_condition, true)
    )
  INTO v_theme, v_form_colors, v_display
  FROM public.organization_pricing_settings ops
  WHERE ops.organization_id = v_org.id;

  RETURN jsonb_build_object(
    'success', true,
    'organization', jsonb_build_object('id', v_org.id, 'name', v_org.name, 'logo_url', v_org.logo_url),
    'services', v_services,
    'servicePricing', v_pricing,
    'branding', COALESCE(v_branding, jsonb_build_object('primary_color', '#3b82f6', 'accent_color', '#14b8a6')),
    'bookingFormTheme', COALESCE(v_theme, 'dark'),
    'formColors', COALESCE(v_form_colors, jsonb_build_object('bg', null, 'card', null, 'text', null, 'button', null, 'buttonText', null, 'accent', null)),
    'displaySettings', COALESCE(v_display, jsonb_build_object('show_sqft_on_booking', true, 'show_bed_bath_on_booking', true, 'show_addons_on_booking', true, 'show_frequency_discount', true, 'show_pet_options', true, 'show_home_condition', true))
  );
END;
$$;

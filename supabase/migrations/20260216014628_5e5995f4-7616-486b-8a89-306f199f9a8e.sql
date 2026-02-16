
-- Seed default campaign templates for all existing organizations
INSERT INTO public.automated_campaigns (organization_id, name, subject, body, type, is_active, days_inactive)
SELECT o.id, t.name, t.subject, t.body, t.type, true, t.days_inactive
FROM public.organizations o
CROSS JOIN (VALUES
  ('Slow Week Availability Fill', 'Slow Week Fill', 'Hi, this is {company_name}. We had a few cleaning spots open this week and are offering priority scheduling to past clients. Want me to reserve one for you? Reply STOP to opt out.', 'custom', 30),
  ('Holiday Cleaning Reminder', 'Holiday Reminder', 'Hi, this is {company_name}. Holiday cleanings book out fast. Want me to lock in your cleaning before spots run out? Reply STOP to opt out.', 'seasonal_promo', 0),
  ('VIP Client Offer', 'VIP Offer', 'Hi, this is {company_name}. We are opening extra cleaning slots for returning clients this week. Want me to reserve one for you? Reply STOP to opt out.', 'custom', 0),
  ('Recurring Service Offer', 'Recurring Offer', 'Hi, this is {company_name}. Clients on recurring service get priority scheduling and lower pricing while never worrying about cleaning again. Want me to lock in a regular cleaning spot for you? Reply STOP to opt out.', 'post_service', 0),
  ('Win-Back 60 Day', 'Win-Back', 'Hi, this is {company_name}. It has been a while since we last cleaned your home. Want me to get you back on the schedule this week? Reply STOP to opt out.', 'win_back', 60)
) AS t(name, subject, body, type, days_inactive)
WHERE NOT EXISTS (
  SELECT 1 FROM public.automated_campaigns ac 
  WHERE ac.organization_id = o.id AND ac.name = t.name
);

-- Update the provision function to also seed campaign templates for new orgs
CREATE OR REPLACE FUNCTION public.provision_default_automations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automation toggles
  INSERT INTO public.organization_automations (organization_id, automation_type, is_enabled, description)
  VALUES
    (NEW.id, 'review_request', true, 'Send review request SMS 30 minutes after job completion'),
    (NEW.id, 'appointment_reminder', true, 'Send appointment reminder SMS 24 hours before scheduled cleaning'),
    (NEW.id, 'missed_call_textback', true, 'Auto-reply SMS when a call is missed on the organization phone number'),
    (NEW.id, 'rebooking_reminder', true, 'Send rebooking reminder 28 days after completed cleaning'),
    (NEW.id, 'recurring_upsell', true, 'Send recurring service upsell 2 hours after completed cleaning'),
    (NEW.id, 'winback_60day', true, 'Send win-back message to customers inactive for 60+ days')
  ON CONFLICT (organization_id, automation_type) DO NOTHING;

  -- Default campaign templates
  INSERT INTO public.automated_campaigns (organization_id, name, subject, body, type, is_active, days_inactive)
  VALUES
    (NEW.id, 'Slow Week Availability Fill', 'Slow Week Fill', 'Hi, this is {company_name}. We had a few cleaning spots open this week and are offering priority scheduling to past clients. Want me to reserve one for you? Reply STOP to opt out.', 'custom', true, 30),
    (NEW.id, 'Holiday Cleaning Reminder', 'Holiday Reminder', 'Hi, this is {company_name}. Holiday cleanings book out fast. Want me to lock in your cleaning before spots run out? Reply STOP to opt out.', 'seasonal_promo', true, 0),
    (NEW.id, 'VIP Client Offer', 'VIP Offer', 'Hi, this is {company_name}. We are opening extra cleaning slots for returning clients this week. Want me to reserve one for you? Reply STOP to opt out.', 'custom', true, 0),
    (NEW.id, 'Recurring Service Offer', 'Recurring Offer', 'Hi, this is {company_name}. Clients on recurring service get priority scheduling and lower pricing while never worrying about cleaning again. Want me to lock in a regular cleaning spot for you? Reply STOP to opt out.', 'post_service', true, 0),
    (NEW.id, 'Win-Back 60 Day', 'Win-Back', 'Hi, this is {company_name}. It has been a while since we last cleaned your home. Want me to get you back on the schedule this week? Reply STOP to opt out.', 'win_back', true, 60);

  RETURN NEW;
END;
$$;

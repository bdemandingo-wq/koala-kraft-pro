-- Create a function to invoke the welcome email edge function
CREATE OR REPLACE FUNCTION public.handle_new_user_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'email', NEW.email,
    'fullName', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'userId', NEW.id::text
  );

  -- Call the edge function via pg_net (async HTTP request)
  PERFORM net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := payload
  );

  RETURN NEW;
END;
$$;

-- Create trigger to send welcome email on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created_welcome_email ON auth.users;
CREATE TRIGGER on_auth_user_created_welcome_email
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_welcome_email();

-- Add is_recommended column to help_videos for recommended/default videos
ALTER TABLE public.help_videos ADD COLUMN IF NOT EXISTS is_recommended boolean DEFAULT false;

-- Add is_default column to checklist_templates for recommended templates
ALTER TABLE public.checklist_templates ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;
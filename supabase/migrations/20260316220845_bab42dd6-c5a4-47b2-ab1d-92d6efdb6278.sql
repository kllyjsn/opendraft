-- Create a database webhook that fires when a new profile is inserted (i.e. new user signup)
-- This calls the notify-new-user edge function automatically
CREATE OR REPLACE FUNCTION public.trigger_notify_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  payload jsonb;
  request_id bigint;
BEGIN
  payload := jsonb_build_object(
    'record', jsonb_build_object(
      'user_id', NEW.user_id,
      'username', NEW.username,
      'avatar_url', NEW.avatar_url
    )
  );

  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-new-user',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
    ),
    body := payload
  ) INTO request_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_profile_notify_admin
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notify_new_user();

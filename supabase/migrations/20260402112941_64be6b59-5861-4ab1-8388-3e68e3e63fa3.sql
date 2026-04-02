
CREATE OR REPLACE FUNCTION public.trigger_notify_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  payload jsonb;
  request_id bigint;
  base_url text;
  service_key text;
BEGIN
  base_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.supabase_service_role_key', true);

  -- Skip notification if settings are not configured (don't block signup)
  IF base_url IS NULL OR base_url = '' OR service_key IS NULL OR service_key = '' THEN
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'record', jsonb_build_object(
      'user_id', NEW.user_id,
      'username', NEW.username,
      'avatar_url', NEW.avatar_url
    )
  );

  BEGIN
    SELECT net.http_post(
      url := base_url || '/functions/v1/notify-new-user',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := payload
    ) INTO request_id;
  EXCEPTION WHEN OTHERS THEN
    -- Never block user creation for a notification failure
    NULL;
  END;

  RETURN NEW;
END;
$function$;

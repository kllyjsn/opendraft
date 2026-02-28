
-- Create a trigger function that sends a welcome notification when a user submits their first listing
CREATE OR REPLACE FUNCTION public.notify_first_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  listing_count integer;
BEGIN
  -- Count how many listings this seller already has (including the new one)
  SELECT COUNT(*) INTO listing_count
  FROM public.listings
  WHERE seller_id = NEW.seller_id;

  -- Only send welcome notification on first listing
  IF listing_count = 1 THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.seller_id,
      'welcome_creator',
      'Welcome to OpenDraft! 🎉',
      'Your first listing "' || NEW.title || '" is pending review. Check out our Creator Handbook for tips on maximizing sales.',
      '/guides/creators'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Attach trigger to listings table
CREATE TRIGGER on_first_listing_created
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_first_listing();

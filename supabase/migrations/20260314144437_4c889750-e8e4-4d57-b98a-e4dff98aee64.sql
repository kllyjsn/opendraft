-- Fix search_path for the function to resolve linter warning
CREATE OR REPLACE FUNCTION public.listing_has_screenshot(screenshots text[])
RETURNS boolean
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT screenshots IS NOT NULL 
    AND array_length(screenshots, 1) > 0 
    AND screenshots[1] != '' 
    AND screenshots[1] NOT LIKE '%.svg';
$$;
-- Add a has_screenshot computed helper for sorting priority
-- Listings with real screenshots appear first in browse results
CREATE OR REPLACE FUNCTION public.listing_has_screenshot(screenshots text[])
RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT screenshots IS NOT NULL 
    AND array_length(screenshots, 1) > 0 
    AND screenshots[1] != '' 
    AND screenshots[1] NOT LIKE '%.svg';
$$;
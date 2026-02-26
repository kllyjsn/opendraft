
-- Expand public_profiles view to include all publicly-safe fields
-- so we can switch all public queries away from the profiles base table
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
  SELECT 
    id,
    user_id,
    username,
    avatar_url,
    bio,
    total_sales,
    followers_count,
    following_count,
    verified,
    created_at,
    updated_at
  FROM public.profiles;
  -- Excludes: stripe_account_id, stripe_onboarded

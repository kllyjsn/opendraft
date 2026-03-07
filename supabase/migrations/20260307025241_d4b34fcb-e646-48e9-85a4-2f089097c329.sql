-- Re-add public SELECT on profiles, but ONLY expose safe columns via a security definer function
-- Since RLS can't restrict columns, we use a two-pronged approach:
-- 1. A restrictive public policy that allows SELECT but the view handles column filtering
-- 2. Drop and recreate the public_profiles view as SECURITY DEFINER to bypass RLS

-- First, drop the existing view
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate as a SECURITY DEFINER view (bypasses RLS, so we control exactly what's exposed)
CREATE VIEW public.public_profiles
WITH (security_invoker = false)
AS
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

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_profiles TO anon, authenticated;
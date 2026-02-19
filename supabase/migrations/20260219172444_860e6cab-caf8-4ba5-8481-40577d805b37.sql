
-- Fix the security definer view warning by recreating as security invoker
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, user_id, username, avatar_url, bio, total_sales, created_at, updated_at
FROM public.profiles;

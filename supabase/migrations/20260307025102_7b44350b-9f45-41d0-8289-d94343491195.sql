-- Fix PUBLIC_DATA_EXPOSURE: Remove overly permissive public SELECT policy on profiles
-- The public_profiles view already provides safe public access without Stripe fields
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;
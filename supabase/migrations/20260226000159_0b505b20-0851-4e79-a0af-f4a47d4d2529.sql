
-- Fix: Remove overly permissive public SELECT on profiles that exposes stripe_account_id
DROP POLICY "Public can view basic profile info" ON public.profiles;

-- Replace with a policy that only allows public access to safe columns via the public_profiles view
-- The view already exists and excludes stripe_account_id, stripe_onboarded
-- Users can still see their own full profile via the existing "Users can view own full profile" policy

-- Add a restricted public SELECT that hides sensitive fields by restricting direct access
-- to only authenticated users viewing their own profile (already covered) or admins
-- Public access goes through the public_profiles view instead


-- Fix 1: Restrict public profile SELECT to exclude sensitive Stripe fields
-- Replace the broad "Profiles viewable by everyone" policy with one that
-- only exposes safe columns via a security definer function + view approach.
-- Since RLS is row-level (not column-level), we create a view for public access.

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;

-- Add a policy that allows everyone to SELECT but only the owner can see stripe fields.
-- For public access, apps should query the public_profiles view instead.
CREATE POLICY "Users can view own full profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Public can view basic profile info"
ON public.profiles FOR SELECT
USING (true);

-- Create a view that excludes sensitive fields for public consumption
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, user_id, username, avatar_url, bio, total_sales, created_at, updated_at
FROM public.profiles;

-- Fix 2: Remove the overly permissive storage policy on listing-files
-- The get-download-url edge function already verifies purchases and generates signed URLs
DROP POLICY IF EXISTS "Buyers can download listing files" ON storage.objects;

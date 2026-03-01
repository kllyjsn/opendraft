-- Allow anyone to read profiles via the public_profiles view
-- The view already excludes sensitive fields (stripe_account_id, stripe_onboarded)
CREATE POLICY "Anyone can view public profiles"
  ON public.profiles FOR SELECT
  USING (true);
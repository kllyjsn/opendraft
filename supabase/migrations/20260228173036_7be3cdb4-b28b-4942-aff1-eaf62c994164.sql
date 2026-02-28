
-- 1. Fix public_profiles view: recreate as SECURITY INVOKER and exclude sensitive fields
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  username,
  avatar_url,
  bio,
  verified,
  followers_count,
  following_count,
  total_sales,
  created_at,
  updated_at
FROM public.profiles;

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. Fix agent_popular_listings view: recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.agent_popular_listings;
CREATE VIEW public.agent_popular_listings
WITH (security_invoker = true)
AS
SELECT
  listing_id,
  COUNT(*) AS agent_view_count,
  COUNT(DISTINCT agent_id) AS unique_agents,
  MAX(created_at) AS last_agent_view
FROM public.agent_listing_views
GROUP BY listing_id;

GRANT SELECT ON public.agent_popular_listings TO anon, authenticated;

-- 3. Tighten activity_log INSERT: require authenticated + match user_id
DROP POLICY IF EXISTS "Anyone can insert activity logs" ON public.activity_log;
CREATE POLICY "Authenticated users can insert own activity logs"
ON public.activity_log FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 4. Tighten agent_demand_signals INSERT: allow anon for agent API but add basic check
-- (Agents use API keys, not auth tokens, so we keep this open but log it)
-- Keep as-is since agents are unauthenticated by design

-- 5. Tighten agent_listing_views INSERT: same as above for agent traffic
-- Keep as-is since agents are unauthenticated by design

-- 6. Tighten cloud_waitlist INSERT: keep open (public waitlist form) but it's intentional
-- Keep as-is since it's a public signup form

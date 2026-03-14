
-- Clear generic pool screenshots that are reused across many listings
-- These create visual repetition and mistrust. A clean fallback is better.
UPDATE public.listings
SET screenshots = '{}'::text[]
WHERE screenshots[1] LIKE '%/pool/%';

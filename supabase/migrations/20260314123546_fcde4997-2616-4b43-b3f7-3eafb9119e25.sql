
-- 1. Clear all SVG-template screenshots site-wide (789 listings using identical-looking dashboard SVGs)
UPDATE public.listings
SET screenshots = '{}'::text[]
WHERE screenshots[1] LIKE '%.svg';

-- 2. Reset all current staff picks
UPDATE public.listings
SET staff_pick = false, staff_pick_category = NULL
WHERE staff_pick = true;

-- 3. Re-curate staff picks from listings that have real AI-generated PNG screenshots
-- Pick top production_ready and mvp listings with actual screenshots, spread across categories
WITH ranked AS (
  SELECT id, category,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY completeness_badge DESC, sales_count DESC, view_count DESC) as rn
  FROM public.listings
  WHERE status = 'live'
    AND screenshots[1] LIKE '%ai-generated%'
    AND screenshots[1] LIKE '%.png'
    AND completeness_badge IN ('production_ready', 'mvp')
)
UPDATE public.listings l
SET staff_pick = true
FROM ranked r
WHERE l.id = r.id AND r.rn <= 3;

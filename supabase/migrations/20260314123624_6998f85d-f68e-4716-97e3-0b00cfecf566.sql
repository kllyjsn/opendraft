
-- Re-assign staff picks for built-for-agents category from listings with PNG screenshots
UPDATE public.listings
SET staff_pick_category = 'built-for-agents'
WHERE staff_pick = true
  AND category IN ('utility', 'ai_app')
  AND screenshots[1] LIKE '%ai-generated%.png';

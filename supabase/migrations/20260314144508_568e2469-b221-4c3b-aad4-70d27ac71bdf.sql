-- Auto-score completeness badges based on actual deliverable signals
-- Score: demo_url (+2), screenshots (+1), file_path (+1), github_url (+1)
-- 0-1 = prototype, 2 = mvp, 3+ = production_ready

UPDATE public.listings
SET completeness_badge = (CASE
  WHEN (
    (CASE WHEN demo_url IS NOT NULL THEN 2 ELSE 0 END) +
    (CASE WHEN screenshots[1] IS NOT NULL AND screenshots[1] != '' THEN 1 ELSE 0 END) +
    (CASE WHEN file_path IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN github_url IS NOT NULL THEN 1 ELSE 0 END)
  ) >= 3 THEN 'production_ready'
  WHEN (
    (CASE WHEN demo_url IS NOT NULL THEN 2 ELSE 0 END) +
    (CASE WHEN screenshots[1] IS NOT NULL AND screenshots[1] != '' THEN 1 ELSE 0 END) +
    (CASE WHEN file_path IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN github_url IS NOT NULL THEN 1 ELSE 0 END)
  ) >= 2 THEN 'mvp'
  ELSE 'prototype'
END)::completeness_badge
WHERE status = 'live';
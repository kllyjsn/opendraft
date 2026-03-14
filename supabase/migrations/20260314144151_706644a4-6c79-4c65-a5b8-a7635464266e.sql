-- Hide listings that have no deliverable (no ZIP file and no GitHub URL)
-- These are empty shells that erode marketplace trust
UPDATE public.listings
SET status = 'hidden'
WHERE status = 'live'
  AND file_path IS NULL
  AND github_url IS NULL;
UPDATE public.listings l
SET demo_url = ds.site_url
FROM (
  SELECT DISTINCT ON (listing_id) listing_id, site_url
  FROM public.deployed_sites
  WHERE status IN ('healthy', 'degraded')
  ORDER BY listing_id, created_at DESC
) ds
WHERE l.id = ds.listing_id
  AND l.demo_url IS NULL;
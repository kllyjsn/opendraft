
-- Add unique constraint on site_id for upsert support
ALTER TABLE public.deployed_sites ADD CONSTRAINT deployed_sites_site_id_key UNIQUE (site_id);


-- Enable pg_trgm extension for fuzzy/trigram matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add a plain tsvector column (not generated)
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate existing rows
UPDATE public.listings SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tech_stack, ' '), '')), 'C');

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_listings_search_vector ON public.listings USING GIN (search_vector);

-- GIN trigram indexes
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON public.listings USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_description_trgm ON public.listings USING GIN (description gin_trgm_ops);

-- Trigger function to keep search_vector up to date
CREATE OR REPLACE FUNCTION public.update_listing_search_vector()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tech_stack, ' '), '')), 'C');
  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_update_listing_search_vector ON public.listings;
CREATE TRIGGER trg_update_listing_search_vector
  BEFORE INSERT OR UPDATE OF title, description, tech_stack ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_search_vector();

-- Search function combining full-text, trigram, and ilike
CREATE OR REPLACE FUNCTION public.search_listings(
  search_query text,
  category_filter text DEFAULT NULL,
  completeness_filter text DEFAULT NULL,
  free_only boolean DEFAULT false,
  sort_by text DEFAULT 'relevance',
  page_offset integer DEFAULT 0,
  page_limit integer DEFAULT 24
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price integer,
  pricing_type pricing_type,
  completeness_badge completeness_badge,
  tech_stack text[],
  screenshots text[],
  sales_count integer,
  view_count integer,
  built_with text,
  seller_id uuid,
  relevance_score real,
  total_count bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  ts_query tsquery;
  total bigint;
BEGIN
  BEGIN
    ts_query := websearch_to_tsquery('english', search_query);
  EXCEPTION WHEN OTHERS THEN
    ts_query := plainto_tsquery('english', search_query);
  END;

  SELECT count(*) INTO total
  FROM listings l
  WHERE l.status = 'live'
    AND (category_filter IS NULL OR l.category::text = category_filter)
    AND (completeness_filter IS NULL OR l.completeness_badge::text = completeness_filter)
    AND (NOT free_only OR l.price = 0)
    AND (
      l.search_vector @@ ts_query
      OR l.title % search_query
      OR l.title ILIKE '%' || search_query || '%'
      OR l.description ILIKE '%' || search_query || '%'
    );

  RETURN QUERY
  SELECT
    l.id, l.title, l.description, l.price, l.pricing_type,
    l.completeness_badge, l.tech_stack, l.screenshots,
    l.sales_count, l.view_count, l.built_with, l.seller_id,
    (
      COALESCE(ts_rank_cd(l.search_vector, ts_query), 0) * 10 +
      COALESCE(similarity(l.title, search_query), 0) * 5 +
      CASE WHEN l.title ILIKE '%' || search_query || '%' THEN 3 ELSE 0 END +
      CASE WHEN l.title ILIKE search_query || '%' THEN 2 ELSE 0 END +
      CASE WHEN lower(l.title) = lower(search_query) THEN 5 ELSE 0 END
    )::real AS relevance_score,
    total AS total_count
  FROM listings l
  WHERE l.status = 'live'
    AND (category_filter IS NULL OR l.category::text = category_filter)
    AND (completeness_filter IS NULL OR l.completeness_badge::text = completeness_filter)
    AND (NOT free_only OR l.price = 0)
    AND (
      l.search_vector @@ ts_query
      OR l.title % search_query
      OR l.title ILIKE '%' || search_query || '%'
      OR l.description ILIKE '%' || search_query || '%'
    )
  ORDER BY
    CASE WHEN sort_by = 'relevance' THEN
      (COALESCE(ts_rank_cd(l.search_vector, ts_query), 0) * 10 +
       COALESCE(similarity(l.title, search_query), 0) * 5 +
       CASE WHEN l.title ILIKE '%' || search_query || '%' THEN 3 ELSE 0 END +
       CASE WHEN l.title ILIKE search_query || '%' THEN 2 ELSE 0 END +
       CASE WHEN lower(l.title) = lower(search_query) THEN 5 ELSE 0 END)
    ELSE 0 END DESC,
    CASE WHEN sort_by = 'popular' THEN l.sales_count ELSE 0 END DESC,
    l.created_at DESC
  OFFSET page_offset
  LIMIT page_limit;
END;
$$;

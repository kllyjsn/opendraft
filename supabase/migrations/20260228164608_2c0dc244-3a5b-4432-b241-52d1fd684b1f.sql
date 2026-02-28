
CREATE OR REPLACE FUNCTION public.get_featured_listings()
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
  purchase_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    l.id,
    l.title,
    l.description,
    l.price,
    l.pricing_type,
    l.completeness_badge,
    l.tech_stack,
    l.screenshots,
    l.sales_count,
    l.view_count,
    l.built_with,
    l.seller_id,
    COUNT(p.id) AS purchase_count
  FROM listings l
  INNER JOIN purchases p ON p.listing_id = l.id
  WHERE l.status = 'live'
  GROUP BY l.id
  ORDER BY purchase_count DESC, l.sales_count DESC
  LIMIT 12;
$$;

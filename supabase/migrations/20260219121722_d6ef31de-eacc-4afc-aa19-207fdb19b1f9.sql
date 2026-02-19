
-- Helper RPC: increment sales_count on listing
CREATE OR REPLACE FUNCTION public.increment_sales_count(listing_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listings
  SET sales_count = COALESCE(sales_count, 0) + 1
  WHERE id = listing_id_param;
END;
$$;

-- Helper RPC: increment total_sales on seller profile
CREATE OR REPLACE FUNCTION public.increment_seller_sales(seller_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET total_sales = COALESCE(total_sales, 0) + 1
  WHERE user_id = seller_id_param;
END;
$$;

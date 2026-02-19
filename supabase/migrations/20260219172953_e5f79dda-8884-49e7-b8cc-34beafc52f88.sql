
-- Fix: Revoke public execute permissions on internal-only RPC functions
-- These are only called from edge functions using service_role key
REVOKE EXECUTE ON FUNCTION public.increment_sales_count(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_sales_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_sales_count(uuid) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.increment_seller_sales(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_seller_sales(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_seller_sales(uuid) FROM authenticated;

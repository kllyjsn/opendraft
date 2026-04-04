-- Fix 1: Remove the dangerous purchases INSERT policy
-- Purchases should ONLY be created by edge functions using the service-role key
DROP POLICY IF EXISTS "System can insert purchases" ON public.purchases;

-- Fix 2: Replace reviews INSERT policy with one that verifies purchase ownership
DROP POLICY IF EXISTS "Buyers can insert own reviews" ON public.reviews;

CREATE POLICY "Verified buyers can review"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = buyer_id
    AND EXISTS (
      SELECT 1 FROM public.purchases p
      WHERE p.id = purchase_id
        AND p.buyer_id = auth.uid()
        AND p.listing_id = reviews.listing_id
    )
  );

-- Prevent duplicate reviews per listing per buyer
ALTER TABLE public.reviews
  ADD CONSTRAINT unique_review_per_buyer_listing UNIQUE (listing_id, buyer_id);
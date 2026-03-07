-- Drop the overly permissive storage policy that lets any authenticated user download files
DROP POLICY IF EXISTS "Buyers can download listing files" ON storage.objects;

-- Replace with a policy that verifies purchase ownership or seller ownership
CREATE POLICY "Verified buyers and sellers can access listing files" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'listing-files'
    AND auth.role() = 'authenticated'
    AND (
      EXISTS (
        SELECT 1 FROM public.purchases p
        JOIN public.listings l ON l.id = p.listing_id
        WHERE p.buyer_id = auth.uid()
        AND l.file_path = name
      )
      OR
      EXISTS (
        SELECT 1 FROM public.listings l
        WHERE l.seller_id = auth.uid()
        AND l.file_path = name
      )
    )
  );
-- 1. Fix analyzed_urls: restrict INSERT to authenticated users
DROP POLICY "Anyone can insert analyzed urls" ON public.analyzed_urls;
CREATE POLICY "Authenticated users can insert analyzed urls"
  ON public.analyzed_urls
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 2. Add UPDATE and DELETE policies for listing-files bucket
CREATE POLICY "Sellers can update own listing files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'listing-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Sellers can delete own listing files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'listing-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 3. Add UPDATE policy for listing-screenshots bucket
CREATE POLICY "Owners can update own screenshots"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'listing-screenshots' AND (auth.uid())::text = (storage.foldername(name))[1]);


-- Fix 1: Restrict discount_codes SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can read active discount codes" ON public.discount_codes;
CREATE POLICY "Authenticated users can read active discount codes"
  ON public.discount_codes FOR SELECT
  TO authenticated
  USING (active = true);

-- Fix 2: Add owner path restriction to listing-screenshots uploads
DROP POLICY IF EXISTS "Authenticated users can upload screenshots" ON storage.objects;
CREATE POLICY "Users can upload own screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-screenshots'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

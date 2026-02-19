-- Add file_path column to listings to track the uploaded ZIP file in storage
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS file_path text DEFAULT NULL;

COMMENT ON COLUMN public.listings.file_path IS 'Path to the uploaded ZIP file in the listing-files storage bucket. Null if delivery is GitHub-only.';
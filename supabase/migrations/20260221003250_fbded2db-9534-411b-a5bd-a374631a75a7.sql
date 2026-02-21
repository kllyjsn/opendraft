
-- Create remix_chains table to track parent→child listing relationships
CREATE TABLE public.remix_chains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  child_listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  remixer_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(child_listing_id) -- a listing can only be a remix of one parent
);

-- Enable RLS
ALTER TABLE public.remix_chains ENABLE ROW LEVEL SECURITY;

-- Anyone can view remix chains (public data for chain visualization)
CREATE POLICY "Anyone can view remix chains"
ON public.remix_chains FOR SELECT
USING (true);

-- Only the remixer can create a chain entry
CREATE POLICY "Remixers can create chain entries"
ON public.remix_chains FOR INSERT
WITH CHECK (auth.uid() = remixer_id);

-- Add remixed_from column to listings for quick lookup
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS remixed_from UUID REFERENCES public.listings(id);

-- Add remix_count to listings for display
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS remix_count INTEGER DEFAULT 0;

-- Trigger to increment parent's remix_count
CREATE OR REPLACE FUNCTION public.update_remix_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings SET remix_count = COALESCE(remix_count, 0) + 1 WHERE id = NEW.parent_listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings SET remix_count = GREATEST(COALESCE(remix_count, 0) - 1, 0) WHERE id = OLD.parent_listing_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_remix_count_trigger
AFTER INSERT OR DELETE ON public.remix_chains
FOR EACH ROW EXECUTE FUNCTION public.update_remix_count();

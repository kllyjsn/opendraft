-- Add security_score column to listings (0-100 scale, null = not scanned)
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS security_score integer DEFAULT NULL;

-- Index for fast filtering on security-hardened listings
CREATE INDEX IF NOT EXISTS idx_listings_security_score ON public.listings (security_score) WHERE security_score IS NOT NULL;
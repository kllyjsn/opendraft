
-- Verification tokens for ownership proofs
CREATE TABLE public.listing_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  method TEXT NOT NULL DEFAULT 'meta_tag',
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Community flags for suspicious listings
CREATE TABLE public.listing_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add domain_verified to listings for quick lookups
ALTER TABLE public.listings ADD COLUMN domain_verified BOOLEAN NOT NULL DEFAULT false;

-- RLS for listing_verifications
ALTER TABLE public.listing_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own verification tokens"
  ON public.listing_verifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.listings l WHERE l.id = listing_verifications.listing_id AND l.seller_id = auth.uid()
  ));

CREATE POLICY "Sellers can create verification tokens"
  ON public.listing_verifications FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.listings l WHERE l.id = listing_verifications.listing_id AND l.seller_id = auth.uid()
  ));

CREATE POLICY "Admins can view all verifications"
  ON public.listing_verifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update verifications"
  ON public.listing_verifications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for listing_flags
ALTER TABLE public.listing_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can flag listings"
  ON public.listing_flags FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own flags"
  ON public.listing_flags FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all flags"
  ON public.listing_flags FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update flags"
  ON public.listing_flags FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Unique constraint: one verification per listing per method
CREATE UNIQUE INDEX idx_listing_verifications_unique ON public.listing_verifications(listing_id, method);

-- Unique constraint: one flag per user per listing
CREATE UNIQUE INDEX idx_listing_flags_unique ON public.listing_flags(listing_id, reporter_id);

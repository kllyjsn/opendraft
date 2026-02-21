
-- Bounty status enum
CREATE TYPE public.bounty_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');

-- Bounties table
CREATE TABLE public.bounties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget INTEGER NOT NULL, -- cents
  category public.listing_category NOT NULL DEFAULT 'other',
  tech_stack TEXT[] DEFAULT '{}',
  status public.bounty_status NOT NULL DEFAULT 'open',
  winner_listing_id UUID REFERENCES public.listings(id),
  winner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submissions_count INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view open bounties"
  ON public.bounties FOR SELECT
  USING (status = 'open' OR auth.uid() = poster_id);

CREATE POLICY "Authenticated users can create bounties"
  ON public.bounties FOR INSERT
  WITH CHECK (auth.uid() = poster_id);

CREATE POLICY "Posters can update own bounties"
  ON public.bounties FOR UPDATE
  USING (auth.uid() = poster_id);

CREATE POLICY "Posters can delete own bounties"
  ON public.bounties FOR DELETE
  USING (auth.uid() = poster_id AND status = 'open');

-- Bounty submissions table
CREATE TABLE public.bounty_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bounty_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bounty poster can view submissions"
  ON public.bounty_submissions FOR SELECT
  USING (
    auth.uid() = seller_id
    OR EXISTS (SELECT 1 FROM public.bounties WHERE id = bounty_id AND poster_id = auth.uid())
  );

CREATE POLICY "Sellers can submit to bounties"
  ON public.bounty_submissions FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Bounty poster can update submissions"
  ON public.bounty_submissions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.bounties WHERE id = bounty_id AND poster_id = auth.uid()));

-- Trigger to update bounties.updated_at
CREATE TRIGGER update_bounties_updated_at
  BEFORE UPDATE ON public.bounties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment submission count
CREATE OR REPLACE FUNCTION public.increment_bounty_submissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.bounties
  SET submissions_count = submissions_count + 1
  WHERE id = NEW.bounty_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_bounty_submissions_trigger
  AFTER INSERT ON public.bounty_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_bounty_submissions();

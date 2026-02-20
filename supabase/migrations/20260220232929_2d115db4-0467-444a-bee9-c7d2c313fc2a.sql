
-- Add pricing_type to listings (one_time is the default for backward compat)
CREATE TYPE public.pricing_type AS ENUM ('one_time', 'monthly');

ALTER TABLE public.listings
  ADD COLUMN pricing_type public.pricing_type NOT NULL DEFAULT 'one_time';

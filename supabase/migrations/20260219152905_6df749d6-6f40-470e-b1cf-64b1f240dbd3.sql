-- Track whether the platform has transferred the seller's share to their Stripe account.
-- false = funds are being held by the platform (seller not yet connected to Stripe)
-- true  = destination charge was used OR a manual Transfer was created
ALTER TABLE public.purchases
  ADD COLUMN payout_transferred boolean NOT NULL DEFAULT false;

-- Index for efficient querying of unpaid payouts per seller
CREATE INDEX idx_purchases_seller_payout ON public.purchases (seller_id, payout_transferred)
  WHERE payout_transferred = false;

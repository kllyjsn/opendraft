
-- Fork requests: buyers request custom versions of a builder's listing
CREATE TABLE public.fork_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  builder_id uuid NOT NULL,
  description text NOT NULL,
  budget integer, -- buyer's suggested budget in cents
  builder_fee integer, -- builder's quoted fee in cents
  status text NOT NULL DEFAULT 'pending',
  -- pending → quoted → accepted → in_progress → delivered → cancelled
  delivered_listing_id uuid REFERENCES public.listings(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fork_requests ENABLE ROW LEVEL SECURITY;

-- Requesters can view their own requests
CREATE POLICY "Requesters can view own fork requests"
  ON public.fork_requests FOR SELECT
  USING (auth.uid() = requester_id);

-- Builders can view requests for their listings
CREATE POLICY "Builders can view incoming fork requests"
  ON public.fork_requests FOR SELECT
  USING (auth.uid() = builder_id);

-- Authenticated users can create fork requests
CREATE POLICY "Users can create fork requests"
  ON public.fork_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Builders can update requests (quote, accept, deliver)
CREATE POLICY "Builders can update fork requests"
  ON public.fork_requests FOR UPDATE
  USING (auth.uid() = builder_id);

-- Requesters can update their own requests (cancel, accept quote)
CREATE POLICY "Requesters can update own fork requests"
  ON public.fork_requests FOR UPDATE
  USING (auth.uid() = requester_id);

-- Trigger for updated_at
CREATE TRIGGER update_fork_requests_updated_at
  BEFORE UPDATE ON public.fork_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

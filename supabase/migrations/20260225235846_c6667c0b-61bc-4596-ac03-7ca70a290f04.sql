
-- Webhook event audit log — records every Stripe event so we never lose data
CREATE TABLE public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_status text NOT NULL DEFAULT 'received',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

-- Prevent duplicate processing of the same Stripe event
CREATE UNIQUE INDEX idx_webhook_events_stripe_id ON public.webhook_events (stripe_event_id);

-- Fast lookups by status for retry processing
CREATE INDEX idx_webhook_events_status ON public.webhook_events (processing_status) WHERE processing_status != 'success';

-- RLS: only service role can access (webhooks use service key)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook events"
  ON public.webhook_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));


-- Activity log to track all user interactions across the platform
CREATE TABLE public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  page text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for querying by event type and user
CREATE INDEX idx_activity_log_event_type ON public.activity_log (event_type);
CREATE INDEX idx_activity_log_user_id ON public.activity_log (user_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log (created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (even anonymous visitors)
CREATE POLICY "Anyone can insert activity logs"
ON public.activity_log FOR INSERT
WITH CHECK (true);

-- Only admins can read logs
CREATE POLICY "Admins can view all activity logs"
ON public.activity_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));


CREATE TABLE public.generation_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  prompt text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  stage text DEFAULT 'queued',
  listing_id uuid REFERENCES public.listings(id),
  listing_title text,
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs" ON public.generation_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON public.generation_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role updates jobs, but users need to see updates
-- Enable realtime for polling
ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_jobs;


-- Store every URL analysis with full results
CREATE TABLE public.analyzed_urls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  url TEXT NOT NULL,
  business_name TEXT,
  industry TEXT,
  summary TEXT,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_builds JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_fallback BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analyzed_urls ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (supports anonymous users)
CREATE POLICY "Anyone can insert analyzed urls"
  ON public.analyzed_urls FOR INSERT
  WITH CHECK (true);

-- Users can view their own analyses
CREATE POLICY "Users can view own analyses"
  ON public.analyzed_urls FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all analyses"
  ON public.analyzed_urls FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for quick user lookups
CREATE INDEX idx_analyzed_urls_user_id ON public.analyzed_urls(user_id);
CREATE INDEX idx_analyzed_urls_created_at ON public.analyzed_urls(created_at DESC);

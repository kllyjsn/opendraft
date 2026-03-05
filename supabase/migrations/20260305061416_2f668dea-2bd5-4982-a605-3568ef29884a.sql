
-- Track deployed sites for health monitoring and auto-fixing
CREATE TABLE public.deployed_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'netlify',
  site_id text NOT NULL,
  site_url text NOT NULL,
  deploy_id text,
  netlify_token_hash text,
  status text NOT NULL DEFAULT 'healthy',
  last_check_at timestamptz,
  last_fix_at timestamptz,
  fix_count integer NOT NULL DEFAULT 0,
  health_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deployed_sites ENABLE ROW LEVEL SECURITY;

-- Users can view their own deployed sites
CREATE POLICY "Users can view own deployed sites"
  ON public.deployed_sites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own deployed sites
CREATE POLICY "Users can insert own deployed sites"
  ON public.deployed_sites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own deployed sites
CREATE POLICY "Users can update own deployed sites"
  ON public.deployed_sites FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete own deployed sites
CREATE POLICY "Users can delete own deployed sites"
  ON public.deployed_sites FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all deployed sites"
  ON public.deployed_sites FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

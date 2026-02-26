
-- Track agent interactions per listing for "Popular with Agents" badges
CREATE TABLE public.agent_listing_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  agent_id uuid,
  source text NOT NULL DEFAULT 'api',
  action text NOT NULL DEFAULT 'view',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_listing_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (agents hit API without auth)
CREATE POLICY "Anyone can insert agent views" ON public.agent_listing_views
  FOR INSERT WITH CHECK (true);

-- Admins and sellers can view
CREATE POLICY "Admins can view agent views" ON public.agent_listing_views
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can view own listing agent views" ON public.agent_listing_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = agent_listing_views.listing_id AND l.seller_id = auth.uid()
    )
  );

-- Create index for fast lookups
CREATE INDEX idx_agent_listing_views_listing ON public.agent_listing_views(listing_id);
CREATE INDEX idx_agent_listing_views_created ON public.agent_listing_views(created_at);

-- Create a view for agent popularity counts (last 30 days)
CREATE OR REPLACE VIEW public.agent_popular_listings AS
SELECT 
  listing_id,
  COUNT(*) as agent_view_count,
  COUNT(DISTINCT agent_id) as unique_agents,
  MAX(created_at) as last_agent_view
FROM public.agent_listing_views
WHERE created_at > now() - interval '30 days'
GROUP BY listing_id
HAVING COUNT(*) >= 3;


-- Agent API keys for persistent auth
CREATE TABLE public.agent_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default',
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read'],
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.agent_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys"
  ON public.agent_api_keys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast key lookup
CREATE INDEX idx_agent_api_keys_hash ON public.agent_api_keys (key_hash) WHERE revoked_at IS NULL;

-- Agent demand signals — captured when searches return 0 results
CREATE TABLE public.agent_demand_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  category TEXT,
  tech_stack TEXT[],
  max_price INTEGER,
  source TEXT NOT NULL DEFAULT 'mcp',
  agent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_demand_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert demand signals"
  ON public.agent_demand_signals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view demand signals"
  ON public.agent_demand_signals FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Agent webhook subscriptions
CREATE TABLE public.agent_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['new_listing'],
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  secret TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own webhooks"
  ON public.agent_webhooks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

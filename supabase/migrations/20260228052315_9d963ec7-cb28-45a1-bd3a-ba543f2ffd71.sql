
CREATE TABLE public.swarm_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_type TEXT NOT NULL, -- 'seo_content' or 'outreach_growth'
  action TEXT NOT NULL, -- e.g. 'generate_blog_post', 'submit_directory', 'optimize_meta'
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  triggered_by TEXT NOT NULL DEFAULT 'cron' -- 'cron' or 'manual'
);

ALTER TABLE public.swarm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage swarm tasks"
  ON public.swarm_tasks
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_swarm_tasks_agent_type ON public.swarm_tasks(agent_type);
CREATE INDEX idx_swarm_tasks_status ON public.swarm_tasks(status);
CREATE INDEX idx_swarm_tasks_created_at ON public.swarm_tasks(created_at DESC);

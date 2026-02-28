
-- Create security_audit_log table for tracking sensitive operations
CREATE TABLE public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can view security audit logs"
ON public.security_audit_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert (via service role in edge functions)
-- No public INSERT policy — only service_role writes to this table

-- Organization audit log for tracking all workspace activity
CREATE TABLE public.org_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id UUID,  -- user who performed the action (null for system events)
  action TEXT NOT NULL,  -- e.g. 'member.invited', 'member.removed', 'app.approved', 'settings.updated'
  target_type TEXT,  -- e.g. 'member', 'app', 'invitation', 'settings'
  target_id TEXT,  -- ID of the affected resource
  metadata JSONB DEFAULT '{}'::jsonb,  -- additional context (member email, app name, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_org_audit_log_org_id ON public.org_audit_log(org_id);
CREATE INDEX idx_org_audit_log_created_at ON public.org_audit_log(created_at DESC);
CREATE INDEX idx_org_audit_log_action ON public.org_audit_log(action);

-- Enable RLS
ALTER TABLE public.org_audit_log ENABLE ROW LEVEL SECURITY;

-- Org admins can view audit logs for their org
CREATE POLICY "Org admins can view audit logs"
ON public.org_audit_log FOR SELECT
USING (public.is_org_admin(auth.uid(), org_id));

-- Org members can insert audit logs for their org
CREATE POLICY "Org members can insert audit logs"
ON public.org_audit_log FOR INSERT
WITH CHECK (public.is_org_member(auth.uid(), org_id) AND (actor_id = auth.uid() OR actor_id IS NULL));

-- Platform admins can view all audit logs (read-only to preserve immutability)
CREATE POLICY "Platform admins can view all audit logs"
ON public.org_audit_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

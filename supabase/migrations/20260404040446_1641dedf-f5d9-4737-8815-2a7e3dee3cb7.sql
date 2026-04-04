
-- Create org_invitations table for email-based team invites
CREATE TABLE public.org_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.org_role NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(org_id, email, status)
);

-- Index for token lookups
CREATE INDEX idx_org_invitations_token ON public.org_invitations(token);
CREATE INDEX idx_org_invitations_email ON public.org_invitations(email);

-- Enable RLS
ALTER TABLE public.org_invitations ENABLE ROW LEVEL SECURITY;

-- Org admins can create invitations
CREATE POLICY "Org admins can insert invitations"
ON public.org_invitations FOR INSERT
WITH CHECK (is_org_admin(auth.uid(), org_id));

-- Org admins can view invitations for their org
CREATE POLICY "Org admins can view org invitations"
ON public.org_invitations FOR SELECT
USING (is_org_admin(auth.uid(), org_id));

-- Users can view invitations sent to their email
CREATE POLICY "Users can view own invitations"
ON public.org_invitations FOR SELECT
USING (lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Users can accept invitations sent to them
CREATE POLICY "Users can accept own invitations"
ON public.org_invitations FOR UPDATE
USING (lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Org admins can delete/revoke invitations
CREATE POLICY "Org admins can delete invitations"
ON public.org_invitations FOR DELETE
USING (is_org_admin(auth.uid(), org_id));

-- Platform admins can manage all invitations
CREATE POLICY "Platform admins can manage all invitations"
ON public.org_invitations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow users to add themselves as org members when accepting an invitation
CREATE POLICY "Users can join org via invitation"
ON public.org_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.org_invitations
    WHERE org_id = org_members.org_id
    AND lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
    AND status = 'pending'
  )
);

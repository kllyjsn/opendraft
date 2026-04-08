-- Add UPDATE policy for org admins on org_invitations
-- This allows admins to resend (update created_at/expires_at) and revoke (update status) invitations.
-- The original UPDATE policy ("Users can accept own invitations") was dropped in
-- migration 20260404101031 to prevent role escalation, but no replacement was added for org admins.

CREATE POLICY "Org admins can update invitations"
ON public.org_invitations FOR UPDATE
USING (is_org_admin(auth.uid(), org_id))
WITH CHECK (is_org_admin(auth.uid(), org_id));

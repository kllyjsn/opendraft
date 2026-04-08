-- SECURITY DEFINER functions for resend/revoke org invitations.
-- These replace a broad UPDATE RLS policy to prevent admins from modifying
-- sensitive columns like `role` (which would enable role escalation).
-- Mirrors the pattern established by accept_org_invitation.

-- Resend: resets created_at and extends expires_at by 7 days.
-- Only works on pending invitations for orgs where the caller is an admin.
CREATE OR REPLACE FUNCTION public.resend_org_invitation(_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
BEGIN
  SELECT org_id INTO _org_id
    FROM org_invitations
   WHERE id = _invitation_id AND status = 'pending';

  IF _org_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or not pending';
  END IF;

  IF NOT is_org_admin(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Only org admins can resend invitations';
  END IF;

  UPDATE org_invitations
     SET created_at = now(),
         expires_at = now() + interval '7 days'
   WHERE id = _invitation_id;
END;
$$;

-- Revoke: sets status to 'revoked'.
-- Only works on pending invitations for orgs where the caller is an admin.
CREATE OR REPLACE FUNCTION public.revoke_org_invitation(_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
BEGIN
  SELECT org_id INTO _org_id
    FROM org_invitations
   WHERE id = _invitation_id AND status = 'pending';

  IF _org_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or not pending';
  END IF;

  IF NOT is_org_admin(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Only org admins can revoke invitations';
  END IF;

  UPDATE org_invitations
     SET status = 'revoked'
   WHERE id = _invitation_id;
END;
$$;

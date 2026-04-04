-- Fix: Prevent role escalation via org_invitations UPDATE policy
DROP POLICY IF EXISTS "Users can accept own invitations" ON public.org_invitations;

-- Create a SECURITY DEFINER function to safely accept invitations
-- This prevents users from modifying role, org_id, or other fields
CREATE OR REPLACE FUNCTION public.accept_org_invitation(_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
BEGIN
  SELECT * INTO inv
  FROM public.org_invitations
  WHERE id = _invitation_id
    AND status = 'pending'
    AND expires_at > now()
    AND lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())::text);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found, expired, or not yours';
  END IF;

  -- Mark invitation as accepted
  UPDATE public.org_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = _invitation_id;

  -- Add user as org member with the role specified by the admin (not user-modifiable)
  INSERT INTO public.org_members (org_id, user_id, role, invited_by)
  VALUES (inv.org_id, auth.uid(), inv.role, inv.invited_by)
  ON CONFLICT DO NOTHING;
END;
$$;
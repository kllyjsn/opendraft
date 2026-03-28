-- Add a restrictive policy to deny non-admin INSERT on user_roles
-- This ensures only admins (via the existing ALL policy) can insert roles
CREATE POLICY "Deny non-admin inserts on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);
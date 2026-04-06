-- Drop the overly permissive INSERT policy
DROP POLICY "Anyone can insert activity logs" ON public.activity_log;

-- Create a tighter policy: authenticated users only, user_id must match if set
CREATE POLICY "Authenticated users can insert activity logs"
  ON public.activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

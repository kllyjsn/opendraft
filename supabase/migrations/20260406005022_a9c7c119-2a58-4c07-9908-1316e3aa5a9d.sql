-- 1. Tighten activity_log INSERT: require user_id = auth.uid() always
DROP POLICY "Authenticated users can insert activity logs" ON public.activity_log;
CREATE POLICY "Authenticated users can insert activity logs"
  ON public.activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 2. Create a safe view for subscriptions (hides Stripe IDs)
CREATE OR REPLACE VIEW public.public_subscriptions
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  status,
  plan,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
FROM public.subscriptions;

-- 3. Standardize cloud_waitlist admin check to use has_role()
DROP POLICY "Admins can view waitlist" ON public.cloud_waitlist;
CREATE POLICY "Admins can view waitlist"
  ON public.cloud_waitlist
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

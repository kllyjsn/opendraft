
-- Allow anonymous visitors to insert activity logs (fixes top-of-funnel tracking gap)
DROP POLICY IF EXISTS "Authenticated users can insert own activity logs" ON public.activity_log;

CREATE POLICY "Anyone can insert activity logs"
ON public.activity_log
FOR INSERT
TO public
WITH CHECK (true);

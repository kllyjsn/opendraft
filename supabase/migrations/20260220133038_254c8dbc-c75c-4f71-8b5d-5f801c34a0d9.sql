
-- Waitlist for managed cloud offering
CREATE TABLE public.cloud_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  company_name TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cloud_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can sign up (insert)
CREATE POLICY "Anyone can join waitlist"
  ON public.cloud_waitlist FOR INSERT
  WITH CHECK (true);

-- Only admins can view waitlist entries
CREATE POLICY "Admins can view waitlist"
  ON public.cloud_waitlist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

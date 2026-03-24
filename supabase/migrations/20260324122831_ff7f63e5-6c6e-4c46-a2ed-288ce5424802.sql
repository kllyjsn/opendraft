CREATE TABLE public.enterprise_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text,
  team_size text,
  message text,
  budget text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.enterprise_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit enterprise inquiry"
  ON public.enterprise_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Only admins can read inquiries"
  ON public.enterprise_inquiries FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Discount codes table
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value integer NOT NULL CHECK (discount_value > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Track usage per buyer
CREATE TABLE public.discount_code_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id uuid NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (discount_code_id, buyer_id)
);

-- RLS for discount_codes
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Everyone can read active codes (needed to validate at checkout)
CREATE POLICY "Anyone can read active discount codes"
  ON public.discount_codes FOR SELECT
  USING (active = true);

-- Admins can do everything
CREATE POLICY "Admins manage discount codes"
  ON public.discount_codes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS for discount_code_usage
ALTER TABLE public.discount_code_usage ENABLE ROW LEVEL SECURITY;

-- Users can see their own usage
CREATE POLICY "Users can view own discount usage"
  ON public.discount_code_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

-- Users can insert own usage (for claiming)
CREATE POLICY "Users can insert own discount usage"
  ON public.discount_code_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Admins can view all usage
CREATE POLICY "Admins can view all discount usage"
  ON public.discount_code_usage FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

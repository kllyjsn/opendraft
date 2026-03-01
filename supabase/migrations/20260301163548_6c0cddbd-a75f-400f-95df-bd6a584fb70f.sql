
-- Credit balances: one row per user, tracks current balance in cents
CREATE TABLE public.credit_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Credit transactions: full audit trail
CREATE TABLE public.credit_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount integer NOT NULL, -- positive = credit added, negative = credit spent
  type text NOT NULL, -- 'signup_bonus', 'purchase', 'top_up', 'refund'
  description text,
  listing_id uuid REFERENCES public.listings(id),
  stripe_session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS: users can view own balance
CREATE POLICY "Users can view own balance" ON public.credit_balances
  FOR SELECT USING (auth.uid() = user_id);

-- RLS: users can view own transactions
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger: auto-create credit balance with $25 bonus on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create balance with $25 (2500 cents) signup bonus
  INSERT INTO public.credit_balances (user_id, balance)
  VALUES (NEW.id, 2500);

  -- Log the bonus transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 2500, 'signup_bonus', 'Welcome bonus — $25 free credits');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- Function to spend credits atomically
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id uuid,
  p_amount integer,
  p_listing_id uuid DEFAULT NULL,
  p_description text DEFAULT 'Purchase'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_bal integer;
BEGIN
  -- Lock the row
  SELECT balance INTO current_bal
  FROM public.credit_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_bal IS NULL OR current_bal < p_amount THEN
    RETURN false;
  END IF;

  UPDATE public.credit_balances
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description, listing_id)
  VALUES (p_user_id, -p_amount, 'purchase', p_description, p_listing_id);

  RETURN true;
END;
$$;

-- Function to add credits
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text DEFAULT 'top_up',
  p_description text DEFAULT 'Credit top-up',
  p_stripe_session_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.credit_balances (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = credit_balances.balance + p_amount, updated_at = now();

  INSERT INTO public.credit_transactions (user_id, amount, type, description, stripe_session_id)
  VALUES (p_user_id, p_amount, p_type, p_description, p_stripe_session_id);
END;
$$;

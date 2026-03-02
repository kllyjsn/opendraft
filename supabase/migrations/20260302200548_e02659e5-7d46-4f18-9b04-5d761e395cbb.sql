
-- Create subscriptions table to track active $20/mo subscribers
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  plan text NOT NULL DEFAULT 'pro',
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view own subscription
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create builder_support_plans table for monthly retainers
CREATE TABLE public.builder_support_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Monthly Support',
  description text,
  price integer NOT NULL DEFAULT 5000,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.builder_support_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view active plans
CREATE POLICY "Anyone can view active builder support plans"
  ON public.builder_support_plans FOR SELECT
  USING (active = true);

-- Builders can manage own plans
CREATE POLICY "Builders can manage own support plans"
  ON public.builder_support_plans FOR ALL
  TO authenticated
  USING (auth.uid() = builder_id)
  WITH CHECK (auth.uid() = builder_id);

-- Drop the signup bonus trigger (removes $25 free credits on signup)
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_credits();

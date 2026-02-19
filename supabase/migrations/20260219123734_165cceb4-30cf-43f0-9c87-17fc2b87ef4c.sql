
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table (secure, separate from profiles)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS: only admins can read all roles; users can read their own
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Only admins can insert/update/delete roles (via service role in edge fn, or direct admin)
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Allow admins to update listing status (approve/reject)
CREATE POLICY "Admins can update any listing"
  ON public.listings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Allow admins to view all listings (including pending)
CREATE POLICY "Admins can view all listings"
  ON public.listings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Assign admin role to kllyjsn@gmail.com (user id: 58914d64-b602-4be0-b0ba-0ddc3fdded50)
INSERT INTO public.user_roles (user_id, role)
VALUES ('58914d64-b602-4be0-b0ba-0ddc3fdded50', 'admin')
ON CONFLICT DO NOTHING;

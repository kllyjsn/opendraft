
-- Organization roles enum
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'builder', 'member');

-- Org listing approval status
CREATE TYPE public.org_listing_status AS ENUM ('pending', 'approved', 'rejected');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  logo_url TEXT,
  brand_colors JSONB DEFAULT '{}',
  sso_config JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'team',
  max_seats INTEGER DEFAULT 50,
  max_apps INTEGER DEFAULT 25,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Org members table
CREATE TABLE public.org_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role org_role NOT NULL DEFAULT 'member',
  invited_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- Org listings (private catalog)
CREATE TABLE public.org_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  status org_listing_status NOT NULL DEFAULT 'pending',
  compliance_tags TEXT[] DEFAULT '{}',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  department TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, listing_id)
);

ALTER TABLE public.org_listings ENABLE ROW LEVEL SECURITY;

-- Add compliance_tags to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS compliance_tags TEXT[] DEFAULT '{}';

-- Helper: check if user is member of org
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = _user_id AND org_id = _org_id
  );
$$;

-- Helper: check if user is org admin or owner
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = _user_id AND org_id = _org_id AND role IN ('owner', 'admin')
  );
$$;

-- Organizations RLS
CREATE POLICY "Org members can view their org"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(auth.uid(), id));

CREATE POLICY "Org admins can update their org"
  ON public.organizations FOR UPDATE
  USING (public.is_org_admin(auth.uid(), id));

CREATE POLICY "Authenticated users can create orgs"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can view all orgs"
  ON public.organizations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Org members RLS
CREATE POLICY "Org members can view fellow members"
  ON public.org_members FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org admins can add members"
  ON public.org_members FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Org admins can update members"
  ON public.org_members FOR UPDATE
  USING (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Org admins can remove members"
  ON public.org_members FOR DELETE
  USING (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Platform admins can manage all members"
  ON public.org_members FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Org listings RLS
CREATE POLICY "Org members can view approved listings"
  ON public.org_listings FOR SELECT
  USING (
    public.is_org_member(auth.uid(), org_id)
    AND (status = 'approved' OR public.is_org_admin(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can manage org listings"
  ON public.org_listings FOR ALL
  USING (public.is_org_admin(auth.uid(), org_id))
  WITH CHECK (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Platform admins can manage all org listings"
  ON public.org_listings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-add creator as org owner
CREATE OR REPLACE FUNCTION public.auto_add_org_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_org_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_org_owner();

-- Updated_at triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- 1. project_goals table
CREATE TABLE public.project_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  goals_prompt TEXT NOT NULL,
  structured_goals JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE public.project_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON public.project_goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.project_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.project_goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.project_goals
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Listing sellers can view goals" ON public.project_goals
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.listings l WHERE l.id = project_goals.listing_id AND l.seller_id = auth.uid()
  ));

-- 2. improvement_cycles table
CREATE TABLE public.improvement_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  trigger TEXT NOT NULL DEFAULT 'manual',
  screenshot_url TEXT,
  analysis JSONB NOT NULL DEFAULT '{}',
  suggestions JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.improvement_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cycles" ON public.improvement_cycles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cycles" ON public.improvement_cycles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cycles" ON public.improvement_cycles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Listing sellers can view cycles" ON public.improvement_cycles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.listings l WHERE l.id = improvement_cycles.listing_id AND l.seller_id = auth.uid()
  ));
CREATE POLICY "Admins can view all cycles" ON public.improvement_cycles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 3. improvement_changes table
CREATE TABLE public.improvement_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.improvement_cycles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'modify',
  description TEXT NOT NULL,
  code TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'low',
  approved BOOLEAN DEFAULT NULL,
  applied_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.improvement_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view changes for own cycles" ON public.improvement_changes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.improvement_cycles ic WHERE ic.id = improvement_changes.cycle_id AND ic.user_id = auth.uid()
  ));
CREATE POLICY "Users can update changes for own cycles" ON public.improvement_changes
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.improvement_cycles ic WHERE ic.id = improvement_changes.cycle_id AND ic.user_id = auth.uid()
  ));
CREATE POLICY "Admins can view all changes" ON public.improvement_changes
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_project_goals_updated_at
  BEFORE UPDATE ON public.project_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

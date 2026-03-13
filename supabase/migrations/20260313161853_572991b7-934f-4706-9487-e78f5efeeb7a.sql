ALTER TABLE public.listings ADD COLUMN staff_pick boolean NOT NULL DEFAULT false;
ALTER TABLE public.listings ADD COLUMN staff_pick_category text;
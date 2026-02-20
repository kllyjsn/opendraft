
-- Create offers table
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  offer_amount INTEGER NOT NULL,
  original_price INTEGER NOT NULL,
  counter_amount INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'expired')),
  message TEXT,
  seller_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own offers
CREATE POLICY "Buyers can view own offers" ON public.offers
  FOR SELECT USING (auth.uid() = buyer_id);

-- Sellers can view offers on their listings
CREATE POLICY "Sellers can view offers on their listings" ON public.offers
  FOR SELECT USING (auth.uid() = seller_id);

-- Buyers can create offers
CREATE POLICY "Buyers can create offers" ON public.offers
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Sellers can update offers (accept/reject/counter)
CREATE POLICY "Sellers can update offers" ON public.offers
  FOR UPDATE USING (auth.uid() = seller_id);

-- Buyers can update own offers (for accepting counter-offers)
CREATE POLICY "Buyers can update own offers" ON public.offers
  FOR UPDATE USING (auth.uid() = buyer_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- System/edge functions insert notifications (via service role), but also allow user insert for flexibility
CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for offers updated_at
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

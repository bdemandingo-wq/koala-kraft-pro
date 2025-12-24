-- Add Google Review URL to business settings
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS google_review_url TEXT;

-- Create customer loyalty points table
CREATE TABLE IF NOT EXISTS public.customer_loyalty (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id)
);

-- Create loyalty transactions table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'bonus', 'expired')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create booking photos table for cleaner uploads
CREATE TABLE IF NOT EXISTS public.booking_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'after' CHECK (photo_type IN ('before', 'after')),
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add staff_id to review_requests to track which cleaner was reviewed
ALTER TABLE public.review_requests ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_loyalty (admin and staff can read, admin can write)
CREATE POLICY "Admin can manage loyalty" ON public.customer_loyalty FOR ALL USING (true);
CREATE POLICY "Staff can view loyalty" ON public.customer_loyalty FOR SELECT USING (true);

-- RLS Policies for loyalty_transactions
CREATE POLICY "Admin can manage loyalty transactions" ON public.loyalty_transactions FOR ALL USING (true);
CREATE POLICY "Staff can view loyalty transactions" ON public.loyalty_transactions FOR SELECT USING (true);

-- RLS Policies for booking_photos
CREATE POLICY "Admin can manage photos" ON public.booking_photos FOR ALL USING (true);
CREATE POLICY "Staff can insert photos" ON public.booking_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can view photos" ON public.booking_photos FOR SELECT USING (true);

-- Create storage bucket for booking photos
INSERT INTO storage.buckets (id, name, public) VALUES ('booking-photos', 'booking-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for booking photos
CREATE POLICY "Authenticated users can upload booking photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'booking-photos');

CREATE POLICY "Anyone can view booking photos" ON storage.objects
FOR SELECT USING (bucket_id = 'booking-photos');

-- Enable realtime for booking_photos
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_photos;
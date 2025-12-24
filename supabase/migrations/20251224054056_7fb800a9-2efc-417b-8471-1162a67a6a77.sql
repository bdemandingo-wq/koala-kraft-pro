-- Create notifications table for cleaners
CREATE TABLE public.cleaner_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'new_job',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cleaner_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can view their own notifications
CREATE POLICY "Staff can view own notifications"
ON public.cleaner_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE staff.id = cleaner_notifications.staff_id 
    AND staff.user_id = auth.uid()
  )
);

-- Policy: Staff can update their own notifications (mark as read)
CREATE POLICY "Staff can update own notifications"
ON public.cleaner_notifications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE staff.id = cleaner_notifications.staff_id 
    AND staff.user_id = auth.uid()
  )
);

-- Policy: Allow service role to insert notifications
CREATE POLICY "Service role can insert notifications"
ON public.cleaner_notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.cleaner_notifications;
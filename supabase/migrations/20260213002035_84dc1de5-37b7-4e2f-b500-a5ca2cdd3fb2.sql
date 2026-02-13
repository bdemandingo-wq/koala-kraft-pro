-- Allow anonymous insert into client_feedback from review pages (low-rating feedback)
CREATE POLICY "Anyone can insert client feedback from review"
ON public.client_feedback
FOR INSERT
WITH CHECK (true);
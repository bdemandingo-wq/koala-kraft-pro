-- Allow admin to feature job before/after pairs on the public gallery
ALTER TABLE public.job_media
  ADD COLUMN IF NOT EXISTS show_in_gallery boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_job_media_gallery
  ON public.job_media (organization_id, show_in_gallery)
  WHERE show_in_gallery = true;

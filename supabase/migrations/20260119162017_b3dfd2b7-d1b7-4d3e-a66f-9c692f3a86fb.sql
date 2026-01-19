-- Create system_logs table for edge function error tracking
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  level TEXT NOT NULL DEFAULT 'error' CHECK (level IN ('info', 'warn', 'error', 'debug')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  user_id UUID,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  request_id TEXT,
  stack_trace TEXT
);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs for their organization
CREATE POLICY "Admins can view org logs"
  ON public.system_logs
  FOR SELECT
  USING (is_org_admin(organization_id) OR organization_id IS NULL);

-- Service role can insert logs (for edge functions)
CREATE POLICY "Service role can insert logs"
  ON public.system_logs
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_system_logs_org_created ON public.system_logs(organization_id, created_at DESC);
CREATE INDEX idx_system_logs_level ON public.system_logs(level);
CREATE INDEX idx_system_logs_source ON public.system_logs(source);
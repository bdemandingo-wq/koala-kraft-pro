-- Create tasks_and_notes table for reminders, tasks, and notes
CREATE TABLE public.tasks_and_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'note')),
  content TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payroll_payments table to track weekly paid status
CREATE TABLE public.payroll_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL,
  week_start DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_by UUID NOT NULL,
  amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, staff_id, week_start)
);

-- Enable RLS on tasks_and_notes
ALTER TABLE public.tasks_and_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for tasks_and_notes
CREATE POLICY "Users can view their org tasks" 
  ON public.tasks_and_notes 
  FOR SELECT 
  USING (is_org_member(organization_id));

CREATE POLICY "Users can create tasks for their org" 
  ON public.tasks_and_notes 
  FOR INSERT 
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Users can update their org tasks" 
  ON public.tasks_and_notes 
  FOR UPDATE 
  USING (is_org_member(organization_id));

CREATE POLICY "Users can delete their org tasks" 
  ON public.tasks_and_notes 
  FOR DELETE 
  USING (is_org_member(organization_id));

-- Enable RLS on payroll_payments
ALTER TABLE public.payroll_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payroll_payments
CREATE POLICY "Org admins can manage payroll payments" 
  ON public.payroll_payments 
  FOR ALL 
  USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

-- Create indexes for performance
CREATE INDEX idx_tasks_org_type ON public.tasks_and_notes(organization_id, type);
CREATE INDEX idx_payroll_payments_week ON public.payroll_payments(organization_id, week_start);
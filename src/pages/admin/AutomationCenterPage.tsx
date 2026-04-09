import { AdminLayout } from '@/components/admin/AdminLayout';
import { SubscriptionGate } from '@/components/admin/SubscriptionGate';
import { Seo } from '@/components/Seo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Zap, Star, Clock, RotateCcw, Repeat, UserX,
  HelpCircle, Home, Calendar, ClipboardList, Users, Target,
  MessageSquare, Briefcase, UserCircle, CheckSquare, Package, DollarSign,
  Receipt, BarChart3, Sparkles, CreditCard, Tag, MapPin, Globe, Brain,
  Activity, Lightbulb, Bot, PhoneMissed,
} from 'lucide-react';
import { AutomationHealthMonitor } from '@/components/admin/automation/AutomationHealthMonitor';
import { CRMSuggestionsPanel } from '@/components/admin/automation/CRMSuggestionsPanel';
import { ActiveAutomationRow } from '@/components/admin/automation/ActiveAutomationRow';
import { ReminderScheduleSection } from '@/components/admin/automation/ReminderScheduleSection';
import { ComingSoonGrid } from '@/components/admin/automation/ComingSoonGrid';
import { AutomationHistoryTable } from '@/components/admin/automation/AutomationHistoryTable';

const automationMeta: Record<string, {
  icon: typeof Zap;
  description: string;
  color: string;
}> = {
  review_request: {
    icon: Star,
    description: 'Fires 30 min after booking marked complete — sends review request SMS',
    color: 'text-amber-500',
  },
  appointment_reminder: {
    icon: Clock,
    description: 'Fires before every booking based on your reminder schedule',
    color: 'text-blue-500',
  },
  rebooking_reminder: {
    icon: RotateCcw,
    description: 'Fires 28 days after last completed job with no future booking',
    color: 'text-green-500',
  },
  winback_60day: {
    icon: UserX,
    description: 'Fires after 60 days of no booking — sends win-back message',
    color: 'text-orange-500',
  },
  recurring_upsell: {
    icon: Repeat,
    description: 'Offers recurring service plan 2 hours after first completed job',
    color: 'text-purple-500',
  },
  missed_call_textback: {
    icon: PhoneMissed,
    description: 'Instantly texts the caller back when a call is missed',
    color: 'text-red-500',
  },
  ai_sms_reply: {
    icon: Bot,
    description: 'AI reads your past messages and replies in your tone 24/7',
    color: 'text-violet-500',
  },
};

const formatName = (type: string) =>
  type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace('60day', '(60 Days)');

const sidebarGuide = [
  { icon: Home, name: 'Dashboard', description: 'Your business overview — today\'s stats, upcoming bookings, and key metrics at a glance.' },
  { icon: Brain, name: 'AI Intelligence', description: 'AI-powered insights including lead scoring, churn prediction, and revenue forecasting.' },
  { icon: Calendar, name: 'Scheduler', description: 'Drag-and-drop calendar to manage and assign bookings across your team.' },
  { icon: ClipboardList, name: 'Bookings', description: 'View, create, and manage all one-time bookings with full status tracking.' },
  { icon: Repeat, name: 'Recurring', description: 'Manage recurring/subscription bookings that automatically repeat on schedule.' },
  { icon: Users, name: 'Customers', description: 'Your full customer database — contact info, booking history, and loyalty status.' },
  { icon: Globe, name: 'Client Portal', description: 'Manage client portal accounts so customers can self-serve bookings and view history.' },
  { icon: Receipt, name: 'Invoices', description: 'Create, send, and track invoices with automated payment reminders.' },
  { icon: MessageSquare, name: 'Messages', description: 'View all SMS conversations with customers sent through your OpenPhone number.' },
  { icon: CheckSquare, name: 'Tasks', description: 'Internal task manager for daily to-dos, notes, and team coordination.' },
  { icon: Target, name: 'Leads', description: 'Track and manage new leads from inquiries to converted customers.' },
  { icon: MapPin, name: 'Operations', description: 'Track daily operations — job statuses, team locations, and route planning.' },
  { icon: Zap, name: 'Campaigns', description: 'Create and send SMS marketing campaigns to targeted customer segments.' },
  { icon: MessageSquare, name: 'Feedback', description: 'Track client complaints, feedback, and resolution status.' },
  { icon: Briefcase, name: 'Services', description: 'Configure your service offerings, pricing, and duration settings.' },
  { icon: UserCircle, name: 'Staff', description: 'Manage your team — profiles, assignments, availability, and performance.' },
  { icon: CheckSquare, name: 'Checklists', description: 'Create job checklists that staff follow during each appointment for quality control.' },
  { icon: Package, name: 'Inventory', description: 'Track supplies, equipment, and reorder levels.' },
  { icon: Tag, name: 'Discounts', description: 'Create and manage discount codes for promotions and special offers.' },
  { icon: DollarSign, name: 'Payroll', description: 'Track staff wages, hours worked, and process payroll payments.' },
  { icon: Receipt, name: 'Expenses', description: 'Log and categorize business expenses for P&L tracking.' },
  { icon: Receipt, name: 'Finance', description: 'Financial overview — revenue trends, profit margins, and cash flow analysis.' },
  { icon: BarChart3, name: 'Reports', description: 'Detailed business reports including revenue, staff productivity, and customer analytics.' },
  { icon: Sparkles, name: 'Subscription', description: 'Manage your platform subscription plan and billing.' },
  { icon: CreditCard, name: 'Payment Setup', description: 'Configure Stripe integration for accepting customer payments and deposits.' },
  { icon: HelpCircle, name: 'Help', description: 'Tutorial videos and help resources to get the most out of the platform.' },
];

export default function AutomationCenterPage() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['organization-automations', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('organization_automations')
        .select('*')
        .eq('organization_id', orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('organization_automations')
        .update({ is_enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-automations'] });
      toast.success('Automation updated');
    },
    onError: () => toast.error('Failed to update automation'),
  });

  // Only show automations that have meta defined
  const activeAutomations = automations.filter(a => automationMeta[a.automation_type]);

  return (
    <AdminLayout title="Automation Center">
      <Seo title="Automation Center" description="Manage your automated workflows and learn about platform features." />
      <SubscriptionGate feature="Automation Center">
        <div className="space-y-6">
          <Tabs defaultValue="automations" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="automations" className="gap-2"><Zap className="w-4 h-4" /> Automations</TabsTrigger>
              <TabsTrigger value="health" className="gap-2"><Activity className="w-4 h-4" /> Health Monitor</TabsTrigger>
              <TabsTrigger value="suggestions" className="gap-2"><Lightbulb className="w-4 h-4" /> Suggestions</TabsTrigger>
              <TabsTrigger value="guide" className="gap-2"><HelpCircle className="w-4 h-4" /> Feature Guide</TabsTrigger>
            </TabsList>

            <TabsContent value="automations" className="space-y-8">
              {/* SECTION 1: Active Automations */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Active Automations</h2>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border rounded-lg p-4 animate-pulse bg-muted/30 h-24" />
                    ))}
                  </div>
                ) : activeAutomations.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No automations configured yet.</p>
                ) : (
                  <div className="space-y-3">
                    {activeAutomations.map((auto) => {
                      const meta = automationMeta[auto.automation_type];
                      return (
                        <ActiveAutomationRow
                          key={auto.id}
                          id={auto.id}
                          name={formatName(auto.automation_type)}
                          description={meta.description}
                          icon={meta.icon}
                          iconColor={meta.color}
                          isEnabled={auto.is_enabled}
                          lastFiredAt={(auto as any).last_fired_at}
                          fireCount={(auto as any).fire_count ?? 0}
                          onToggle={(id, enabled) => toggleMutation.mutate({ id, is_enabled: enabled })}
                        >
                          {auto.automation_type === 'appointment_reminder' && orgId && (
                            <ReminderScheduleSection organizationId={orgId} />
                          )}
                        </ActiveAutomationRow>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 2: Coming Soon */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Available Automations</h2>
                  <p className="text-sm text-muted-foreground">Coming soon — these automations are not yet enabled for your account.</p>
                </div>
                <ComingSoonGrid />
              </div>

              {/* SECTION 3: Automation History */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Automation History</h2>
                {orgId && <AutomationHistoryTable organizationId={orgId} />}
              </div>
            </TabsContent>

            <TabsContent value="health" className="space-y-4">
              <AutomationHealthMonitor />
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <CRMSuggestionsPanel />
            </TabsContent>

            <TabsContent value="guide" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Feature Guide</CardTitle>
                  <CardDescription>Learn what each section of the platform does to get the most out of your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {sidebarGuide.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.name} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                          <div className="p-2 rounded-md bg-muted flex-shrink-0">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SubscriptionGate>
    </AdminLayout>
  );
}

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Brain, TrendingUp, AlertTriangle, Flame, Target,
  Send, Sparkles, Calendar, Users, ArrowUpRight,
  RefreshCw, MessageSquare, BarChart3, ShieldAlert,
  FileText, Car, Wrench, Package
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from 'date-fns';

// ─── Count-up hook ───
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    let start = 0;
    const step = Math.max(1, Math.ceil(target / (duration / 30)));
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(id); }
      else setValue(start);
    }, 30);
    return () => clearInterval(id);
  }, [target, duration]);
  return value;
}

// ─── Styles ───
const DARK_BG = '#0D0F14';
const CARD_BG = '#141720';
const BORDER = 'rgba(255,255,255,0.06)';
const TEAL = '#00E5C3';
const AMBER = '#FFB547';
const RED = '#FF4B6E';
const BLUE = '#4A9EFF';
const GOLD = '#D4AF37';

const cardStyle: React.CSSProperties = { background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12 };
const monoFont = "'DM Mono', monospace";
const labelFont = "'Outfit', sans-serif";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AIAnalysisCenter() {
  const { organization } = useOrganization();
  const orgId = organization?.id;
  const [activeTab, setActiveTab] = useState('overview');

  // ─── Date ranges ───
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();
  const prevMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
  const prevMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();

  // ─── Revenue ───
  const { data: revenueData } = useQuery({
    queryKey: ['ai-revenue', orgId],
    queryFn: async () => {
      if (!orgId) return { current: 0, previous: 0 };
      const [cur, prev] = await Promise.all([
        supabase.from('bookings').select('total_amount').eq('organization_id', orgId).in('status', ['confirmed', 'completed']).gte('scheduled_at', monthStart).lte('scheduled_at', monthEnd),
        supabase.from('bookings').select('total_amount').eq('organization_id', orgId).in('status', ['confirmed', 'completed']).gte('scheduled_at', prevMonthStart).lte('scheduled_at', prevMonthEnd),
      ]);
      const current = (cur.data || []).reduce((s, b) => s + (b.total_amount || 0), 0);
      const previous = (prev.data || []).reduce((s, b) => s + (b.total_amount || 0), 0);
      return { current, previous };
    },
    enabled: !!orgId,
  });

  // ─── Revenue by package (service) ───
  const { data: packageRevenue = [] } = useQuery({
    queryKey: ['ai-package-revenue', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: bookings } = await supabase.from('bookings').select('total_amount, service_id').eq('organization_id', orgId).eq('status', 'completed').gte('scheduled_at', monthStart).lte('scheduled_at', monthEnd);
      const { data: services } = await supabase.from('services').select('id, name').eq('organization_id', orgId);
      if (!bookings?.length || !services?.length) return [];
      const svcMap = Object.fromEntries(services.map(s => [s.id, s.name]));
      const agg: Record<string, { name: string; jobs: number; revenue: number }> = {};
      bookings.forEach(b => {
        const name = svcMap[b.service_id || ''] || 'Other';
        if (!agg[name]) agg[name] = { name, jobs: 0, revenue: 0 };
        agg[name].jobs++;
        agg[name].revenue += b.total_amount || 0;
      });
      return Object.values(agg).sort((a, b) => b.revenue - a.revenue);
    },
    enabled: !!orgId,
  });

  // ─── Revenue by vehicle type ───
  const { data: vehicleRevenue = [] } = useQuery({
    queryKey: ['ai-vehicle-revenue', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: bookings } = await supabase.from('bookings').select('total_amount, vehicle_id').eq('organization_id', orgId).eq('status', 'completed').gte('scheduled_at', monthStart).not('vehicle_id', 'is', null);
      if (!bookings?.length) return [];
      const vehicleIds = [...new Set(bookings.map(b => b.vehicle_id).filter(Boolean))];
      const { data: vehicles } = await supabase.from('vehicles').select('id, vehicle_type').in('id', vehicleIds as string[]);
      if (!vehicles?.length) return [];
      const vMap = Object.fromEntries((vehicles as any[]).map(v => [v.id, v.vehicle_type || 'Unknown']));
      const agg: Record<string, { type: string; jobs: number; revenue: number }> = {};
      bookings.forEach(b => {
        const type = vMap[b.vehicle_id || ''] || 'Unknown';
        if (!agg[type]) agg[type] = { type, jobs: 0, revenue: 0 };
        agg[type].jobs++;
        agg[type].revenue += b.total_amount || 0;
      });
      return Object.values(agg).sort((a, b) => b.revenue - a.revenue);
    },
    enabled: !!orgId,
  });

  // ─── Staff / technician performance ───
  const { data: techPerformance = [] } = useQuery({
    queryKey: ['ai-tech-performance', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: bookings } = await supabase.from('bookings').select('staff_id, total_amount').eq('organization_id', orgId).eq('status', 'completed').gte('scheduled_at', monthStart);
      const { data: staff } = await supabase.from('staff').select('id, name').eq('organization_id', orgId);
      if (!bookings?.length || !staff?.length) return [];
      const sMap = Object.fromEntries(staff.map(s => [s.id, s.name]));
      const agg: Record<string, { name: string; jobs: number; revenue: number }> = {};
      bookings.forEach(b => {
        const name = sMap[b.staff_id || ''] || 'Unassigned';
        if (name === 'Unassigned') return;
        if (!agg[name]) agg[name] = { name, jobs: 0, revenue: 0 };
        agg[name].jobs++;
        agg[name].revenue += b.total_amount || 0;
      });
      return Object.values(agg).sort((a, b) => b.revenue - a.revenue);
    },
    enabled: !!orgId,
  });

  // ─── Low stock inventory ───
  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['ai-low-stock', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from('inventory_items').select('name, quantity, min_quantity, unit').eq('organization_id', orgId);
      return (data || []).filter((i: any) => (i.quantity || 0) <= (i.min_quantity || 0)).map((i: any) => ({ product_name: i.name, quantity_on_hand: i.quantity, reorder_threshold: i.min_quantity, unit: i.unit || 'units' }));
    },
    enabled: !!orgId,
  });

  // ─── Customer stats ───
  const { data: customerStats } = useQuery({
    queryKey: ['ai-customer-stats', orgId],
    queryFn: async () => {
      if (!orgId) return { total: 0, newThisMonth: 0, newLastMonth: 0 };
      const { data: all } = await supabase.from('customers').select('id, created_at').eq('organization_id', orgId);
      const total = all?.length || 0;
      const newThisMonth = (all || []).filter(c => c.created_at >= monthStart && c.created_at <= monthEnd).length;
      const newLastMonth = (all || []).filter(c => c.created_at >= prevMonthStart && c.created_at <= prevMonthEnd).length;
      return { total, newThisMonth, newLastMonth };
    },
    enabled: !!orgId,
  });

  // ─── Jobs completed this month vs last ───
  const { data: jobStats } = useQuery({
    queryKey: ['ai-job-stats', orgId],
    queryFn: async () => {
      if (!orgId) return { current: 0, previous: 0, cancelled: 0 };
      const [cur, prev, cancelled] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'completed').gte('scheduled_at', monthStart).lte('scheduled_at', monthEnd),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'completed').gte('scheduled_at', prevMonthStart).lte('scheduled_at', prevMonthEnd),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'cancelled').gte('scheduled_at', monthStart).lte('scheduled_at', monthEnd),
      ]);
      return { current: cur.count || 0, previous: prev.count || 0, cancelled: cancelled.count || 0 };
    },
    enabled: !!orgId,
  });

  // ─── Hot leads ───
  const { data: hotLeads = [] } = useQuery({
    queryKey: ['ai-hot-leads', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from('leads').select('*').eq('organization_id', orgId).or(`status.eq.hot,updated_at.lt.${threeDaysAgo}`).order('updated_at', { ascending: true });
      return data || [];
    },
    enabled: !!orgId,
  });

  // ─── Lead stats ───
  const { data: leadStats } = useQuery({
    queryKey: ['ai-lead-stats', orgId],
    queryFn: async () => {
      if (!orgId) return { total: 0, converted: 0, bySource: {} as Record<string, number> };
      const { data } = await supabase.from('leads').select('status, source, created_at').eq('organization_id', orgId).gte('created_at', monthStart);
      const total = data?.length || 0;
      const converted = (data || []).filter(l => l.status === 'converted' || l.status === 'won').length;
      const bySource: Record<string, number> = {};
      (data || []).forEach(l => { bySource[l.source || 'Unknown'] = (bySource[l.source || 'Unknown'] || 0) + 1; });
      return { total, converted, bySource };
    },
    enabled: !!orgId,
  });

  // ─── Churn risk (60+ days) ───
  const { data: churnCustomers = [] } = useQuery({
    queryKey: ['ai-churn', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: customers } = await supabase.from('customers').select('id, first_name, last_name, email').eq('organization_id', orgId);
      if (!customers?.length) return [];
      const results: any[] = [];
      for (const c of customers) {
        const { data: lastBooking } = await supabase.from('bookings').select('scheduled_at, service_id').eq('customer_id', c.id).eq('organization_id', orgId).order('scheduled_at', { ascending: false }).limit(1);
        if (lastBooking?.length) {
          const days = differenceInDays(now, new Date(lastBooking[0].scheduled_at));
          if (days > 30) {
            const { data: svc } = lastBooking[0].service_id ? await supabase.from('services').select('name').eq('id', lastBooking[0].service_id).single() : { data: null };
            results.push({ ...c, daysSince: days, serviceName: svc?.name || 'Detail Service' });
          }
        }
      }
      return results.sort((a, b) => b.daysSince - a.daysSince).slice(0, 10);
    },
    enabled: !!orgId,
  });

  // ─── Weekly booking distribution ───
  const { data: weeklyData = {} as Record<string, number> } = useQuery({
    queryKey: ['ai-weekly', orgId, weekStart],
    queryFn: async () => {
      if (!orgId) return {};
      const { data } = await supabase.from('bookings').select('scheduled_at').eq('organization_id', orgId).in('status', ['confirmed', 'completed']).gte('scheduled_at', weekStart).lte('scheduled_at', weekEnd);
      const counts: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      (data || []).forEach(b => {
        const day = format(new Date(b.scheduled_at), 'EEE');
        if (day in counts) counts[day]++;
      });
      return counts;
    },
    enabled: !!orgId,
  });

  // ─── Derived values ───
  const bestDay = useMemo(() => {
    const entries = Object.entries(weeklyData);
    if (!entries.length) return 'N/A';
    return entries.reduce((a, b) => (b[1] > a[1] ? b : a), entries[0])[0];
  }, [weeklyData]);

  const revenue = revenueData?.current || 0;
  const prevRevenue = revenueData?.previous || 0;
  const revenueChange = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : 0;
  const hotLeadsCount = hotLeads.length;
  const churnCount = churnCustomers.length;
  const conversionRate = leadStats ? (leadStats.total > 0 ? Math.round((leadStats.converted / leadStats.total) * 100) : 0) : 0;
  const avgTicket = jobStats && jobStats.current > 0 ? Math.round(revenue / jobStats.current) : 0;

  // Animated values
  const animRevenue = useCountUp(Math.round(revenue));
  const animHotLeads = useCountUp(hotLeadsCount);
  const animChurn = useCountUp(churnCount);
  const animConversion = useCountUp(conversionRate);

  // ─── Comprehensive business snapshot for AI ───
  const businessSnapshot = useMemo(() => ({
    revenue: Math.round(revenue),
    prevRevenue: Math.round(prevRevenue),
    revenueChange,
    avgTicket,
    hotLeads: hotLeadsCount,
    churnCount,
    conversionRate,
    bestDay,
    weeklyData,
    packageRevenue: packageRevenue.slice(0, 8),
    vehicleRevenue: vehicleRevenue.slice(0, 6),
    techPerformance: techPerformance.slice(0, 6),
    lowStockItems: lowStockItems.slice(0, 10),
    customerStats: customerStats || { total: 0, newThisMonth: 0, newLastMonth: 0 },
    jobStats: jobStats || { current: 0, previous: 0, cancelled: 0 },
    leadStats: leadStats || { total: 0, converted: 0, bySource: {} },
  }), [revenue, prevRevenue, revenueChange, avgTicket, hotLeadsCount, churnCount, conversionRate, bestDay, weeklyData, packageRevenue, vehicleRevenue, techPerformance, lowStockItems, customerStats, jobStats, leadStats]);

  // ─── AI Insights ───
  const [insights, setInsights] = useState<any[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const fetchInsights = useCallback(async () => {
    if (!orgId) return;
    setInsightsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis-center', {
        body: { type: 'insights', businessSnapshot },
      });
      if (error) throw error;
      setInsights(data?.insights || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate insights');
    } finally {
      setInsightsLoading(false);
    }
  }, [orgId, businessSnapshot]);

  useEffect(() => {
    if (revenue > 0 || hotLeadsCount > 0) fetchInsights();
  }, [orgId]);

  // ─── Scheduling recommendation ───
  const [schedRec, setSchedRec] = useState('');
  const [schedLoading, setSchedLoading] = useState(false);
  const fetchScheduleRec = useCallback(async () => {
    if (!orgId) return;
    setSchedLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis-center', {
        body: { type: 'scheduling', businessSnapshot },
      });
      if (error) throw error;
      setSchedRec(data?.recommendation || '');
    } catch { setSchedRec('Unable to generate recommendation.'); }
    finally { setSchedLoading(false); }
  }, [orgId, businessSnapshot]);

  useEffect(() => {
    if (activeTab === 'scheduling' && !schedRec) fetchScheduleRec();
  }, [activeTab]);

  // ─── Weekly / monthly summary ───
  const [summaryLoading, setSummaryLoading] = useState(false);
  const generateSummary = useCallback(async (period: 'weekly' | 'monthly') => {
    setSummaryLoading(true);
    setActiveTab('ask-ai');
    const prompt = period === 'weekly'
      ? `Generate a comprehensive weekly business summary for We Detail NC. Include revenue, jobs completed, top packages, technician performance, lead activity, and inventory status. Use the live data provided.`
      : `Generate a comprehensive monthly business report for We Detail NC. Include total revenue vs last month, jobs completed, average ticket, top packages by revenue, vehicle type breakdown, technician rankings, customer acquisition, lead conversion, churn risks, and inventory alerts. Provide 3–5 actionable recommendations.`;
    await sendChat(prompt);
    setSummaryLoading(false);
  }, []);

  // ─── Ask AI chat ───
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef(chatMessages);
  chatMessagesRef.current = chatMessages;

  const sendChat = useCallback(async (input: string) => {
    if (!input.trim() || !orgId) return;
    const userMsg = { role: 'user' as const, content: input };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-analysis-center`;
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: 'chat',
          messages: [...chatMessagesRef.current, userMsg],
          businessSnapshot,
        }),
      });

      if (resp.status === 429) { toast.error('Rate limit exceeded. Try again later.'); setChatLoading(false); return; }
      if (resp.status === 402) { toast.error('AI credits exhausted. Please add credits.'); setChatLoading(false); return; }
      if (!resp.ok || !resp.body) {
        const errorText = await resp.text().catch(() => '');
        console.error('AI chat error:', resp.status, errorText);
        throw new Error(`AI request failed (${resp.status})`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantSoFar = '';

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        const content = assistantSoFar;
        setChatMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
          return [...prev, { role: 'assistant', content }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      console.error('Chat error:', e);
      toast.error(e.message || 'Chat error');
    } finally {
      setChatLoading(false);
    }
  }, [orgId, businessSnapshot]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // ─── Quick questions — detailing-specific ───
  const quickQuestionCategories = [
    {
      label: '💰 Revenue',
      questions: [
        'What is my most profitable service package this month?',
        'Which vehicle types generate the most revenue?',
        'What is my average ticket size vs last month?',
        'What is my monthly recurring revenue from Maintenance Plan subscribers?',
      ],
    },
    {
      label: '👥 Customers',
      questions: [
        'Who are my top 10 highest value customers?',
        'Which customers haven\'t booked in 60+ days?',
        'What is my average customer lifetime value?',
        'How many new customers this month vs last month?',
      ],
    },
    {
      label: '🔧 Technicians',
      questions: [
        'Which technician completed the most jobs this period?',
        'Which technician generated the most revenue?',
        'Compare technician performance side by side.',
      ],
    },
    {
      label: '📊 Leads',
      questions: [
        'How many leads came in this month and from which sources?',
        'What is my lead-to-booking conversion rate?',
        'Which lead source generates the highest quality bookings?',
      ],
    },
    {
      label: '🚗 Operations',
      questions: [
        'How many jobs did I complete this month vs last month?',
        'What days of the week are my busiest?',
        'How many jobs were cancelled this month?',
        'What is my average job duration per package?',
      ],
    },
    {
      label: '📦 Inventory',
      questions: [
        'Which products need to be reordered this week?',
        'What is my average product cost per job?',
        'Which products am I using the fastest?',
      ],
    },
    {
      label: '📈 Growth',
      questions: [
        'Give me 5 actionable recommendations to grow revenue.',
        'Which customers should I target for upselling to Ceramic Coating?',
        'Suggest a midweek promotion to fill empty Tuesday/Wednesday slots.',
      ],
    },
  ];

  const [activeQuestionCategory, setActiveQuestionCategory] = useState(0);

  const priorityStyles: Record<string, { bg: string; text: string; border: string }> = {
    Urgent: { bg: `${RED}18`, text: RED, border: `${RED}40` },
    Watch: { bg: `${AMBER}18`, text: AMBER, border: `${AMBER}40` },
    Opportunity: { bg: `${TEAL}18`, text: TEAL, border: `${TEAL}40` },
    Pricing: { bg: `${BLUE}18`, text: BLUE, border: `${BLUE}40` },
    Growth: { bg: `${GOLD}18`, text: GOLD, border: `${GOLD}40` },
    Inventory: { bg: `${AMBER}18`, text: AMBER, border: `${AMBER}40` },
  };

  const maxBookings = Math.max(...Object.values(weeklyData), 1);

  return (
    <div style={{ background: DARK_BG, minHeight: '100vh', color: '#fff', fontFamily: labelFont }} className="-m-6 p-6">
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ─── KPI Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Monthly Revenue', value: `$${animRevenue.toLocaleString()}`, sub: revenueChange >= 0 ? `+${revenueChange}% vs last month` : `${revenueChange}% vs last month`, color: TEAL, icon: TrendingUp },
          { label: 'Jobs Completed', value: (jobStats?.current || 0).toString(), sub: `${jobStats?.previous || 0} last month · Avg $${avgTicket}`, color: BLUE, icon: Car },
          { label: 'Churn Risk (60d+)', value: animChurn.toString(), sub: churnCount > 0 ? `${churnCustomers.filter(c => c.daysSince > 60).length} critical (60+ days)` : 'All customers active', color: RED, icon: ShieldAlert },
          { label: 'Lead Conversion', value: `${animConversion}%`, sub: `${leadStats?.converted || 0} of ${leadStats?.total || 0} leads · ${Object.keys(leadStats?.bySource || {}).length} sources`, color: AMBER, icon: Target },
        ].map((kpi, i) => (
          <div key={i} style={cardStyle} className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div style={{ background: `${kpi.color}18`, borderRadius: 8, padding: 6 }}>
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
              <span style={{ fontFamily: labelFont, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{kpi.label}</span>
            </div>
            <p style={{ fontFamily: monoFont, fontSize: 28, fontWeight: 500, color: '#fff', lineHeight: 1 }}>{kpi.value}</p>
            <p style={{ fontFamily: labelFont, fontSize: 12, color: kpi.color, marginTop: 6 }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Quick action bar ─── */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          size="sm"
          onClick={fetchInsights}
          disabled={insightsLoading}
          style={{ background: `${TEAL}15`, color: TEAL, border: `1px solid ${TEAL}30`, fontFamily: labelFont }}
          className="hover:opacity-80"
        >
          <RefreshCw size={14} className={`mr-1.5 ${insightsLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
        <Button
          size="sm"
          onClick={() => generateSummary('weekly')}
          disabled={summaryLoading || chatLoading}
          style={{ background: `${BLUE}15`, color: BLUE, border: `1px solid ${BLUE}30`, fontFamily: labelFont }}
          className="hover:opacity-80"
        >
          <FileText size={14} className="mr-1.5" />
          Weekly Summary
        </Button>
        <Button
          size="sm"
          onClick={() => generateSummary('monthly')}
          disabled={summaryLoading || chatLoading}
          style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}30`, fontFamily: labelFont }}
          className="hover:opacity-80"
        >
          <BarChart3 size={14} className="mr-1.5" />
          Monthly Report
        </Button>
      </div>

      {/* ─── Tabs ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-white/5 rounded-none w-full justify-start gap-1 px-0 mb-6 flex-wrap">
          {[
            { value: 'overview', label: 'Overview', icon: Brain },
            { value: 'leads', label: 'Leads', icon: Flame },
            { value: 'retention', label: 'Retention', icon: Users },
            { value: 'scheduling', label: 'Scheduling', icon: Calendar },
            { value: 'ask-ai', label: 'Ask AI', icon: MessageSquare },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-white/5 data-[state=active]:text-white text-white/40 rounded-lg px-4 py-2 gap-2 border-0"
              style={{ fontFamily: labelFont }}
            >
              <tab.icon size={15} />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── Tab 1: Overview ─── */}
        <TabsContent value="overview">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: labelFont, fontSize: 16, fontWeight: 600 }}>AI-Generated Insights</h3>
            <Button size="sm" variant="ghost" onClick={fetchInsights} disabled={insightsLoading} className="text-white/50 hover:text-white gap-2">
              <RefreshCw size={14} className={insightsLoading ? 'animate-spin' : ''} />
              {insightsLoading ? 'Analyzing...' : 'Refresh'}
            </Button>
          </div>

          {/* Low stock alert */}
          {lowStockItems.length > 0 && (
            <div style={{ ...cardStyle, borderColor: `${AMBER}40`, marginBottom: 16 }} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package size={16} style={{ color: AMBER }} />
                <span style={{ fontFamily: labelFont, fontSize: 13, fontWeight: 600, color: AMBER }}>Low Stock Alert</span>
                <Badge variant="outline" className="text-xs" style={{ borderColor: `${AMBER}40`, color: AMBER }}>{lowStockItems.length} items</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.slice(0, 5).map((item, i) => (
                  <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 6 }}>
                    {item.product_name}: {item.quantity_on_hand} {item.unit}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Package revenue mini table */}
          {packageRevenue.length > 0 && (
            <div style={cardStyle} className="p-4 mb-4">
              <h4 style={{ fontFamily: labelFont, fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'rgba(255,255,255,0.7)' }}>📦 Revenue by Package — This Month</h4>
              <div className="space-y-2">
                {packageRevenue.slice(0, 6).map((pkg, i) => {
                  const totalPkgRev = packageRevenue.reduce((s, p) => s + p.revenue, 0);
                  const pct = totalPkgRev > 0 ? Math.round((pkg.revenue / totalPkgRev) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{pkg.name}</span>
                      <div className="flex items-center gap-4">
                        <span style={{ fontFamily: monoFont, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{pkg.jobs} jobs</span>
                        <span style={{ fontFamily: monoFont, fontSize: 13, color: TEAL }}>${pkg.revenue.toLocaleString()}</span>
                        <span style={{ fontFamily: monoFont, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {insights.length === 0 && !insightsLoading && (
            <div style={cardStyle} className="p-8 text-center">
              <Sparkles size={32} style={{ color: TEAL, margin: '0 auto 12px' }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Click Refresh to generate AI insights from your business data</p>
            </div>
          )}
          <div className="space-y-3">
            {insights.map((ins, i) => {
              const s = priorityStyles[ins.priority] || priorityStyles.Watch;
              return (
                <div key={i} style={{ ...cardStyle, borderColor: s.border }} className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ background: s.bg, color: s.text, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, fontFamily: labelFont }}>{ins.priority}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: labelFont }}>{ins.confidence}</span>
                    </div>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{ins.insight}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { setActiveTab('ask-ai'); setChatInput(ins.promptText || ''); }}
                    style={{ background: `${s.text}20`, color: s.text, border: `1px solid ${s.border}`, fontSize: 12, fontFamily: labelFont }}
                    className="shrink-0 hover:opacity-80"
                  >
                    {ins.action} <ArrowUpRight size={12} className="ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── Tab 2: Leads ─── */}
        <TabsContent value="leads">
          <h3 style={{ fontFamily: labelFont, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Hot & Stale Leads</h3>

          {/* Lead source summary */}
          {leadStats && Object.keys(leadStats.bySource).length > 0 && (
            <div style={cardStyle} className="p-4 mb-4">
              <h4 style={{ fontFamily: labelFont, fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>Lead Sources This Month</h4>
              <div className="flex flex-wrap gap-3">
                {Object.entries(leadStats.bySource).sort((a, b) => b[1] - a[1]).map(([source, count]) => (
                  <div key={source} className="flex items-center gap-2">
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{source}:</span>
                    <span style={{ fontFamily: monoFont, fontSize: 13, color: BLUE }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hotLeads.length === 0 ? (
            <div style={cardStyle} className="p-8 text-center">
              <Flame size={32} style={{ color: AMBER, margin: '0 auto 12px' }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>No hot or stale leads found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hotLeads.slice(0, 15).map(lead => {
                const daysSince = differenceInDays(now, new Date(lead.updated_at));
                const typeLabel = lead.service_interest || 'Mobile Detail';
                return (
                  <div key={lead.id} style={cardStyle} className="p-4 flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500 }}>{lead.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: labelFont }}>{typeLabel}</span>
                        <span style={{ fontSize: 11, fontFamily: monoFont, color: daysSince > 5 ? RED : AMBER }}>{daysSince}d since contact</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setActiveTab('ask-ai');
                        setChatInput(`Draft a follow-up message for ${lead.name}, a lead interested in ${typeLabel} who hasn't been contacted in ${daysSince} days. Mention Remain Clean's mobile detailing service in South Florida and include a booking CTA.`);
                      }}
                      style={{ background: `${TEAL}18`, color: TEAL, border: `1px solid ${TEAL}30`, fontSize: 12, fontFamily: labelFont }}
                      className="hover:opacity-80"
                    >
                      Draft message <ArrowUpRight size={12} className="ml-1" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Tab 3: Retention ─── */}
        <TabsContent value="retention">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: labelFont, fontSize: 16, fontWeight: 600 }}>Churn Risk Customers</h3>
            {customerStats && (
              <div className="flex gap-4">
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Total: <span style={{ color: TEAL, fontFamily: monoFont }}>{customerStats.total}</span></span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>New this month: <span style={{ color: BLUE, fontFamily: monoFont }}>{customerStats.newThisMonth}</span></span>
              </div>
            )}
          </div>
          {churnCustomers.length === 0 ? (
            <div style={cardStyle} className="p-8 text-center">
              <Users size={32} style={{ color: TEAL, margin: '0 auto 12px' }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>All customers are active — no churn risk detected</p>
            </div>
          ) : (
            <div className="space-y-2">
              {churnCustomers.map(c => {
                const barColor = c.daysSince >= 60 ? RED : c.daysSince >= 45 ? AMBER : TEAL;
                const barWidth = Math.min((c.daysSince / 90) * 100, 100);
                return (
                  <div key={c.id} style={cardStyle} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500 }}>{c.first_name} {c.last_name}</p>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{c.serviceName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ fontFamily: monoFont, fontSize: 13, color: barColor }}>{c.daysSince}d</span>
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveTab('ask-ai');
                            setChatInput(`Draft a re-engagement message for ${c.first_name} ${c.last_name}, who last booked a ${c.serviceName} detail ${c.daysSince} days ago. Mention We Detail NC's mobile service and offer a small incentive to rebook.`);
                          }}
                          style={{ background: `${TEAL}18`, color: TEAL, border: `1px solid ${TEAL}30`, fontSize: 12, fontFamily: labelFont }}
                          className="hover:opacity-80"
                        >
                          Draft re-engagement <ArrowUpRight size={12} className="ml-1" />
                        </Button>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{ background: barColor, width: `${barWidth}%`, height: '100%', borderRadius: 4, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Tab 4: Scheduling ─── */}
        <TabsContent value="scheduling">
          <h3 style={{ fontFamily: labelFont, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            This Week's Jobs
            <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
              {format(startOfWeek(now, { weekStartsOn: 1 }), 'MMM d')} – {format(endOfWeek(now, { weekStartsOn: 1 }), 'MMM d')}
            </span>
          </h3>

          {/* Technician performance mini-table */}
          {techPerformance.length > 0 && (
            <div style={cardStyle} className="p-4 mb-4">
              <h4 style={{ fontFamily: labelFont, fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>🔧 Technician Performance — This Month</h4>
              <div className="space-y-2">
                {techPerformance.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{t.name}</span>
                    <div className="flex items-center gap-4">
                      <span style={{ fontFamily: monoFont, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{t.jobs} jobs</span>
                      <span style={{ fontFamily: monoFont, fontSize: 13, color: TEAL }}>${t.revenue.toLocaleString()}</span>
                      <span style={{ fontFamily: monoFont, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Avg ${t.jobs > 0 ? Math.round(t.revenue / t.jobs) : 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={cardStyle} className="p-5 mb-4">
            <div className="grid grid-cols-7 gap-3" style={{ height: 200 }}>
              {DAYS.map(day => {
                const count = weeklyData[day] || 0;
                const barHeight = count > 0 && maxBookings > 0 ? Math.max((count / maxBookings) * 100, 12) : 0;
                return (
                  <div key={day} className="flex flex-col items-center justify-end h-full gap-0">
                    <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      {count > 0 ? (
                        <div style={{
                          width: '55%',
                          height: `${barHeight}%`,
                          background: `linear-gradient(180deg, ${TEAL}, ${TEAL}88)`,
                          borderRadius: '6px 6px 2px 2px',
                          transition: 'height 0.6s ease',
                          minHeight: 16,
                        }} />
                      ) : (
                        <div style={{ width: '55%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }} />
                      )}
                    </div>
                    <span style={{ fontFamily: monoFont, fontSize: 14, fontWeight: 500, color: count > 0 ? '#fff' : 'rgba(255,255,255,0.25)', marginTop: 8 }}>{count}</span>
                    <span style={{ fontFamily: labelFont, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={cardStyle} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: TEAL }} />
                <span style={{ fontFamily: labelFont, fontSize: 13, fontWeight: 600 }}>AI Recommendation</span>
              </div>
              <Button size="sm" variant="ghost" onClick={fetchScheduleRec} disabled={schedLoading} className="text-white/40 hover:text-white">
                <RefreshCw size={12} className={schedLoading ? 'animate-spin' : ''} />
              </Button>
            </div>
            {schedLoading ? (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Generating recommendation...</p>
            ) : (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{schedRec || 'Click refresh to generate a scheduling recommendation.'}</p>
            )}
          </div>
        </TabsContent>

        {/* ─── Tab 5: Ask AI ─── */}
        <TabsContent value="ask-ai">
          <h3 style={{ fontFamily: labelFont, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Ask We Detail NC AI</h3>

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {quickQuestionCategories.map((cat, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setActiveQuestionCategory(i)}
                style={{
                  background: activeQuestionCategory === i ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeQuestionCategory === i ? 'rgba(255,255,255,0.2)' : BORDER}`,
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 12,
                  color: activeQuestionCategory === i ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontFamily: labelFont,
                  cursor: 'pointer',
                }}
                className="hover:bg-white/10 transition-colors"
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick question chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {quickQuestionCategories[activeQuestionCategory].questions.map((q, i) => (
              <button
                type="button"
                key={i}
                onClick={() => sendChat(q)}
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 20, padding: '6px 14px', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: labelFont, cursor: 'pointer' }}
                className="hover:bg-white/10 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          <div style={{ ...cardStyle, maxHeight: 400, overflowY: 'auto', marginBottom: 16 }} className="p-4">
            {chatMessages.length === 0 ? (
              <div className="text-center py-8">
                <Brain size={32} style={{ color: TEAL, margin: '0 auto 12px' }} />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Ask a question or tap a category above to start</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '10px 14px',
                        borderRadius: 12,
                        fontSize: 13,
                        lineHeight: 1.6,
                        background: msg.role === 'user' ? `${BLUE}20` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${msg.role === 'user' ? `${BLUE}30` : BORDER}`,
                        color: 'rgba(255,255,255,0.85)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat(chatInput)}
              placeholder="Ask about revenue, customers, technicians, leads, inventory..."
              style={{ background: CARD_BG, border: `1px solid ${BORDER}`, color: '#fff', fontFamily: labelFont }}
              className="flex-1"
            />
            <Button
              onClick={() => sendChat(chatInput)}
              disabled={chatLoading || !chatInput.trim()}
              style={{ background: TEAL, color: DARK_BG }}
              className="hover:opacity-90"
            >
              {chatLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

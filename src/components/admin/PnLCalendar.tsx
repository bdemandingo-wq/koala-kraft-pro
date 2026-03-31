import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useTestMode } from '@/contexts/TestModeContext';

interface DailyPnL {
  revenue: number;
  expenses: number;
  technicianPay: number;
  fees: number;
  net: number;
}

interface PnLCalendarProps {
  bookings: any[];
  expenses: any[];
  teamPaysByBooking: Map<string, number>;
}

const formatAmount = (amount: number, showSign = true): string => {
  const abs = Math.abs(amount);
  if (abs >= 1000) {
    return `${showSign ? (amount >= 0 ? '+' : '-') : (amount < 0 ? '-' : '')}$${(abs / 1000).toFixed(2)}K`;
  }
  return `${showSign ? (amount >= 0 ? '+' : '-') : (amount < 0 ? '-' : '')}$${abs.toFixed(2)}`;
};

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

type MetricMode = 'revenue' | 'profit';

export function PnLCalendar({ bookings, expenses, teamPaysByBooking }: PnLCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [metricMode, setMetricMode] = useState<MetricMode>('revenue');
  const { isTestMode } = useTestMode();

  // Calculate daily P&L from bookings and expenses
  const dailyPnL = useMemo(() => {
    const map = new Map<string, DailyPnL>();
    const seenBookingIds = new Set<string>();

    bookings.forEach((b: any) => {
      if (b.status === 'cancelled') return;
      if (b.payment_status === 'refunded') return;
      if (b.payment_status !== 'paid' && b.payment_status !== 'partial') return;
      if (seenBookingIds.has(b.id)) return;
      seenBookingIds.add(b.id);

      const dateKey = format(new Date(b.scheduled_at), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || { revenue: 0, expenses: 0, technicianPay: 0, fees: 0, net: 0 };

      const gross = Number(b.total_amount) || 0;
      const fee = (gross * 0.029) + 0.30;

      let technicianPay = 0;
      const teamPay = teamPaysByBooking.get(b.id);
      if (teamPay != null && teamPay > 0) {
        technicianPay = teamPay;
      } else if (b.cleaner_pay_expected != null && Number(b.cleaner_pay_expected) > 0) {
        technicianPay = Number(b.cleaner_pay_expected);
      } else if (b.cleaner_actual_payment != null && Number(b.cleaner_actual_payment) > 0) {
        technicianPay = Number(b.cleaner_actual_payment);
      } else if (b.cleaner_wage) {
        const wage = Number(b.cleaner_wage);
        const wageType = b.cleaner_wage_type || 'hourly';
        if (wageType === 'flat') technicianPay = wage;
        else if (wageType === 'percentage') technicianPay = (gross * wage) / 100;
        else technicianPay = wage * (b.cleaner_override_hours || (b.duration / 60));
      }

      existing.revenue += gross;
      existing.fees += fee;
      existing.technicianPay += technicianPay;
      existing.net = existing.revenue - existing.fees - existing.technicianPay - existing.expenses;
      map.set(dateKey, existing);
    });

    expenses.forEach((e: any) => {
      const dateKey = e.expense_date;
      if (!dateKey) return;
      const existing = map.get(dateKey) || { revenue: 0, expenses: 0, technicianPay: 0, fees: 0, net: 0 };
      existing.expenses += Number(e.amount) || 0;
      existing.net = existing.revenue - existing.fees - existing.technicianPay - existing.expenses;
      map.set(dateKey, existing);
    });

    return map;
  }, [bookings, expenses, teamPaysByBooking]);

  // Helper: get the displayed value for a day based on metric mode
  const getDayValue = (pnl: DailyPnL | undefined): number => {
    if (!pnl) return 0;
    if (metricMode === 'revenue') return pnl.revenue;
    // Profit = Client Pay − Technician Pay (no fees, no expenses)
    return pnl.revenue - pnl.technicianPay;
  };

  // Monthly totals for year view
  const monthlyTotals = useMemo(() => {
    const map = new Map<string, number>();
    dailyPnL.forEach((val, dateKey) => {
      const monthKey = dateKey.substring(0, 7);
      const dayValue = getDayValue(val);
      map.set(monthKey, (map.get(monthKey) || 0) + dayValue);
    });
    return map;
  }, [dailyPnL, metricMode]);

  // Generate calendar days (Monday start)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const navigateMonth = (dir: 'prev' | 'next') => {
    setCurrentMonth(prev => dir === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const currentYear = currentMonth.getFullYear();

  // Monthly total for header
  const monthTotal = useMemo(() => {
    let total = 0;
    const monthKey = format(currentMonth, 'yyyy-MM');
    dailyPnL.forEach((val, dateKey) => {
      if (dateKey.startsWith(monthKey)) total += getDayValue(val);
    });
    return total;
  }, [dailyPnL, currentMonth, metricMode]);

  const getValueColor = (value: number, hasData: boolean) => {
    if (!hasData) return 'text-muted-foreground/50';
    if (metricMode === 'revenue') return 'text-emerald-500';
    if (value < 0) return 'text-destructive';
    if (value === 0) return 'text-muted-foreground';
    return 'text-emerald-500';
  };

  const getCellBg = (value: number, hasData: boolean) => {
    if (!hasData) return 'border-transparent';
    if (metricMode === 'revenue') return 'bg-emerald-500/10 border-emerald-500/30';
    if (value < 0) return 'bg-destructive/10 border-destructive/30';
    if (value === 0) return 'border-border';
    return 'bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <Card className="bg-[hsl(var(--card))] border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg font-bold">P&L Calendar</CardTitle>
          <div className="flex items-center gap-2">
            {/* Revenue / Profit toggle */}
            <ToggleGroup
              type="single"
              value={metricMode}
              onValueChange={(v) => v && setMetricMode(v as MetricMode)}
              className="bg-muted rounded-lg p-0.5"
            >
              <ToggleGroupItem value="revenue" className="text-xs px-3 h-7 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
                Revenue
              </ToggleGroupItem>
              <ToggleGroupItem value="profit" className="text-xs px-3 h-7 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
                Profit
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Month / Year toggle */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as 'month' | 'year')}
              className="bg-muted rounded-lg p-0.5"
            >
              <ToggleGroupItem value="month" className="text-xs px-3 h-7 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
                Month
              </ToggleGroupItem>
              <ToggleGroupItem value="year" className="text-xs px-3 h-7 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
                Year
              </ToggleGroupItem>
            </ToggleGroup>

            <Select
              value={format(currentMonth, 'yyyy-MM')}
              onValueChange={(v) => setCurrentMonth(new Date(v + '-01'))}
            >
              <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const d = new Date(currentYear, i, 1);
                  return (
                    <SelectItem key={i} value={format(d, 'yyyy-MM')}>
                      {format(d, 'yyyy-MM')}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Month navigation */}
        {viewMode === 'month' && (
          <div className="flex items-center justify-between mt-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <span className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
              {!isTestMode && (
                <span className={cn(
                  "ml-2 text-sm font-bold",
                  getValueColor(monthTotal, monthTotal !== 0)
                )}>
                  {formatAmount(monthTotal, false)}
                </span>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {viewMode === 'month' ? (
          <>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const pnl = dailyPnL.get(dateKey);
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const dayValue = getDayValue(pnl);
                const hasData = pnl != null && pnl.revenue > 0;

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-md min-h-[52px] sm:min-h-[64px] border transition-colors',
                      !inMonth && 'opacity-30',
                      today && 'ring-1 ring-primary',
                      getCellBg(dayValue, hasData)
                    )}
                  >
                    <span className={cn(
                      'text-xs font-medium',
                      today && 'text-primary font-bold',
                      !inMonth && 'text-muted-foreground'
                    )}>
                      {today ? 'Today' : format(day, 'd')}
                    </span>
                    {hasData && !isTestMode && (
                      <span className={cn(
                        "text-[11px] sm:text-xs font-bold mt-0.5",
                        getValueColor(dayValue, true)
                      )}>
                        {formatAmount(dayValue, false)}
                      </span>
                    )}
                    {hasData && isTestMode && (
                      <span className="text-[11px] text-muted-foreground mt-0.5">$--</span>
                    )}
                    {!hasData && inMonth && (
                      <span className="text-[10px] text-muted-foreground/50 mt-0.5">--</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Year view */
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {Array.from({ length: 12 }, (_, i) => {
              const monthDate = new Date(currentYear, i, 1);
              const monthKey = format(monthDate, 'yyyy-MM');
              const value = monthlyTotals.get(monthKey) || 0;
              const hasData = value !== 0;

              return (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentMonth(monthDate);
                    setViewMode('month');
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg p-3 border transition-all hover:shadow-sm',
                    getCellBg(value, hasData),
                    hasData && value > 0 && 'hover:bg-emerald-500/20',
                    !hasData && 'border-border hover:bg-muted/50'
                  )}
                >
                  <span className="text-sm font-medium">{format(monthDate, 'MMM')}</span>
                  {!isTestMode ? (
                    <span className={cn(
                      'text-sm font-bold mt-1',
                      getValueColor(value, hasData)
                    )}>
                      {hasData ? formatAmount(value, false) : '--'}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground mt-1">$--</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

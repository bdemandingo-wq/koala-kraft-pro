import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  organizationId: string;
}

const SCHEDULE_LABELS: Record<number, string> = {
  120: '5 Days Before',
  72: '3 Days Before',
  24: '24 Hours Before',
  1: '1 Hour Before',
};

export function ReminderScheduleSection({ organizationId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { data: intervals = [] } = useQuery({
    queryKey: ['reminder-intervals', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointment_reminder_intervals')
        .select('*')
        .eq('organization_id', organizationId)
        .order('hours_before', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && expanded,
  });

  const [localIntervals, setLocalIntervals] = useState<typeof intervals>([]);

  // Sync local state when data loads
  const displayIntervals = localIntervals.length > 0 ? localIntervals : intervals;

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const interval of displayIntervals) {
        const { error } = await supabase
          .from('appointment_reminder_intervals')
          .update({
            send_to_client: interval.send_to_client,
            send_to_cleaner: interval.send_to_cleaner,
          })
          .eq('id', interval.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-intervals'] });
      toast.success('Reminder schedule saved');
    },
    onError: () => toast.error('Failed to save schedule'),
  });

  const updateLocal = (id: string, field: 'send_to_client' | 'send_to_cleaner', value: boolean) => {
    const base = displayIntervals.length > 0 ? displayIntervals : intervals;
    setLocalIntervals(base.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  // Reset local state when intervals change
  if (intervals.length > 0 && localIntervals.length === 0) {
    // Will populate on next render cycle via displayIntervals
  }

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        className="text-xs gap-1 h-7 px-2"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Hide Schedule' : 'Show Schedule'}
      </Button>

      {expanded && (
        <Card className="mt-2 border-dashed">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Reminder Schedule</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {displayIntervals.map((interval) => (
              <div key={interval.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {SCHEDULE_LABELS[Number(interval.hours_before)] || interval.label}
                </span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs">
                    <Switch
                      checked={interval.send_to_client}
                      onCheckedChange={(v) => updateLocal(interval.id, 'send_to_client', v)}
                      className="scale-75"
                    />
                    Client
                  </label>
                  <label className="flex items-center gap-1.5 text-xs">
                    <Switch
                      checked={interval.send_to_cleaner}
                      onCheckedChange={(v) => updateLocal(interval.id, 'send_to_cleaner', v)}
                      className="scale-75"
                    />
                    Tech
                  </label>
                </div>
              </div>
            ))}
            <Button
              size="sm"
              className="w-full mt-2"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Reminder Schedule'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

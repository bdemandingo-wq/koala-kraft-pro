import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  organizationId: string;
}

export function AutomationHistoryTable({ organizationId }: Props) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['automation-history', organizationId],
    queryFn: async () => {
      // Query review SMS queue as the main automation log
      const { data, error } = await supabase
        .from('automated_review_sms_queue')
        .select('id, booking_id, customer_id, send_at, sent, sent_at, error, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;

      // Also get rebooking reminders
      const { data: rebookings } = await supabase
        .from('rebooking_reminder_queue')
        .select('id, customer_id, send_at, sent, sent_at, cancelled, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Also get booking reminder log
      const { data: reminders } = await supabase
        .from('booking_reminder_log')
        .select('id, booking_id, recipient_phone, reminder_type, sent_at, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10);

      type HistoryItem = {
        id: string;
        date: string;
        type: string;
        recipient: string;
        message: string;
        status: 'delivered' | 'failed' | 'pending';
      };

      const items: HistoryItem[] = [];

      (data || []).forEach((r) => {
        items.push({
          id: r.id,
          date: r.created_at,
          type: 'Review Request',
          recipient: r.customer_id?.slice(0, 8) || '—',
          message: 'Review request SMS',
          status: r.sent ? 'delivered' : r.error ? 'failed' : 'pending',
        });
      });

      (rebookings || []).forEach((r) => {
        items.push({
          id: r.id,
          date: r.created_at,
          type: 'Rebooking Reminder',
          recipient: r.customer_id?.slice(0, 8) || '—',
          message: 'Rebooking reminder SMS',
          status: r.sent ? 'delivered' : r.cancelled ? 'failed' : 'pending',
        });
      });

      (reminders || []).forEach((r) => {
        items.push({
          id: r.id,
          date: r.created_at,
          type: 'Appointment Reminder',
          recipient: r.recipient_phone || '—',
          message: r.reminder_type || 'Reminder',
          status: 'delivered',
        });
      });

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return items.slice(0, 20);
    },
    enabled: !!organizationId,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No automation history yet. Events will appear here as automations fire.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Automation</TableHead>
          <TableHead>Recipient</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="whitespace-nowrap">
              {format(new Date(item.date), 'MMM d, h:mm a')}
            </TableCell>
            <TableCell>{item.type}</TableCell>
            <TableCell className="font-mono text-xs">{item.recipient}</TableCell>
            <TableCell>{item.message}</TableCell>
            <TableCell>
              <Badge
                variant={item.status === 'delivered' ? 'default' : item.status === 'failed' ? 'destructive' : 'secondary'}
                className="text-[10px]"
              >
                {item.status === 'delivered' ? 'Delivered' : item.status === 'failed' ? 'Failed' : 'Pending'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

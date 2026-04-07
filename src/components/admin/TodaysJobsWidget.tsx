import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Clock, MapPin, Navigation, Car, Loader2, Camera, CheckCircle2, Play, ArrowRight } from 'lucide-react';
import { useMapsNavigation } from '@/hooks/useMapsNavigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { BookingWithDetails } from '@/hooks/useBookings';
import { isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface TodaysJobsWidgetProps {
  bookings: BookingWithDetails[];
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'outline' },
  confirmed: { label: 'Scheduled', variant: 'secondary' },
  en_route: { label: 'En Route', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export function TodaysJobsWidget({ bookings }: TodaysJobsWidgetProps) {
  const { openDirections } = useMapsNavigation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const todaysJobs = useMemo(() => {
    return bookings
      .filter(b => isToday(new Date(b.scheduled_at)) && b.status !== 'cancelled')
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [bookings]);

  const updateStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId);
    try {
      const updates: Record<string, any> = { status: newStatus };
      if (newStatus === 'in_progress') {
        updates.cleaner_checkin_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updates.cleaner_checkout_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success(`Job ${newStatus === 'en_route' ? 'marked en route' : newStatus === 'in_progress' ? 'started' : 'completed'}!`);
    } catch {
      toast.error('Failed to update job status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getFullAddress = (b: BookingWithDetails) => {
    return [b.address, b.city, b.state, b.zip_code].filter(Boolean).join(', ');
  };

  if (todaysJobs.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Today's Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No jobs scheduled for today. Enjoy your day off! 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Today's Jobs
          <Badge variant="secondary" className="text-xs">{todaysJobs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {todaysJobs.map((job) => {
          const status = statusConfig[job.status] || statusConfig.pending;
          const fullAddress = getFullAddress(job);
          const isUpdating = updatingId === job.id;

          return (
            <div key={job.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">
                    {format(new Date(job.scheduled_at), 'h:mm a')}
                  </span>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{job.duration} min</span>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>

              {/* Customer & Service */}
              <div>
                <p className="font-medium text-sm">
                  {job.customer ? `${job.customer.first_name} ${job.customer.last_name}` : `Job #${job.booking_number}`}
                </p>
                {job.service && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" />
                    {job.service.name}
                  </p>
                )}
              </div>

              {/* Address + Navigate */}
              {fullAddress && (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {fullAddress}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-7 text-xs"
                    onClick={() => openDirections({ address: fullAddress })}
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Navigate
                  </Button>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {(job.status === 'confirmed' || job.status === 'pending') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    disabled={isUpdating}
                    onClick={() => updateStatus(job.id, 'en_route')}
                  >
                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ArrowRight className="h-3 w-3 mr-1" />}
                    I'm En Route
                  </Button>
                )}
                {job.status === 'en_route' && (
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    disabled={isUpdating}
                    onClick={() => updateStatus(job.id, 'in_progress')}
                  >
                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                    Job Started
                  </Button>
                )}
                {job.status === 'in_progress' && (
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    disabled={isUpdating}
                    onClick={() => updateStatus(job.id, 'completed')}
                  >
                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                    Job Complete
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => navigate(`/dashboard/booking-photos?bookingId=${job.id}`)}
                >
                  <Camera className="h-3 w-3 mr-1" />
                  Before/After
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

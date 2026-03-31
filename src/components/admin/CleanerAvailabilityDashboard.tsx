import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isAfter, isBefore, parse } from 'date-fns';
import { BookingWithDetails } from '@/hooks/useBookings';
import { cn } from '@/lib/utils';

interface TechnicianAvailabilityDashboardProps {
  bookings: BookingWithDetails[];
  staff: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
    is_active: boolean;
    default_hours?: number | null;
  }>;
  workingHours: Array<{
    id: string;
    staff_id: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }>;
}

const timeSlots = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TechnicianAvailabilityDashboard({ bookings, staff, workingHours }: TechnicianAvailabilityDashboardProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  
  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const activeStaff = staff.filter(s => s.is_active);

  const getTechnicianAvailability = useMemo(() => {
    return (technicianId: string, date: Date) => {
      const dayOfWeek = date.getDay();
      
      // Get working hours for this technician on this day
      const hours = workingHours.find(
        wh => wh.staff_id === technicianId && wh.day_of_week === dayOfWeek
      );
      
      // Get bookings for this technician on this day
      const dayBookings = bookings.filter(b => {
        if (b.staff?.id !== technicianId) return false;
        const bookingDate = new Date(b.scheduled_at);
        return isSameDay(bookingDate, date) && !['cancelled', 'no_show'].includes(b.status);
      });

      return {
        isWorkingDay: hours?.is_available ?? false,
        startTime: hours?.start_time || '09:00',
        endTime: hours?.end_time || '17:00',
        bookings: dayBookings,
        bookedHours: dayBookings.reduce((sum, b) => {
          const staffMember = staff.find(s => s.id === technicianId);
          const hours = staffMember?.default_hours || (b.duration / 60) || 2;
          return sum + hours;
        }, 0),
      };
    };
  }, [bookings, workingHours]);

  const technicianStats = useMemo(() => {
    return activeStaff.map(technician => {
      let availableSlots = 0;
      let bookedSlots = 0;

      weekDays.forEach(day => {
        const availability = getTechnicianAvailability(technician.id, day);
        if (availability.isWorkingDay) {
          // Rough estimate: 8 hours available per working day
          const workHours = 8;
          availableSlots += workHours;
          bookedSlots += availability.bookedHours;
        }
      });

      return {
        ...technician,
        availableSlots,
        bookedSlots,
        utilizationRate: availableSlots > 0 ? (bookedSlots / availableSlots) * 100 : 0,
      };
    });
  }, [activeStaff, weekDays, getTechnicianAvailability]);

  const filteredStaff = selectedTechnician 
    ? technicianStats.filter(c => c.id === selectedTechnician)
    : technicianStats;

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(prev => prev - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium min-w-[200px] text-center">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(prev => prev + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Technician Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedTechnician === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedTechnician(null)}
        >
          All Technicians
        </Button>
        {activeStaff.map(technician => (
          <Button
            key={technician.id}
            variant={selectedTechnician === technician.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTechnician(technician.id)}
            className="gap-2"
          >
            <Avatar className="w-5 h-5">
              <AvatarImage src={technician.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">
                {technician.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {technician.name}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {technicianStats.map(technician => (
          <Card 
            key={technician.id} 
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50",
              selectedTechnician === technician.id && "border-primary ring-2 ring-primary/20"
            )}
            onClick={() => setSelectedTechnician(technician.id === selectedTechnician ? null : technician.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={technician.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {technician.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{technician.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {technician.bookedSlots.toFixed(1)}h booked
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden mr-3">
                  <div 
                    className={cn(
                      "h-full transition-all",
                      technician.utilizationRate >= 80 ? "bg-emerald-500" :
                      technician.utilizationRate >= 50 ? "bg-blue-500" :
                      technician.utilizationRate >= 25 ? "bg-amber-500" : "bg-rose-500"
                    )}
                    style={{ width: `${Math.min(technician.utilizationRate, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{technician.utilizationRate.toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Weekly Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="text-sm font-medium text-muted-foreground p-2">Technician</div>
                {weekDays.map((day, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "text-center p-2 rounded-lg",
                      isSameDay(day, new Date()) && "bg-primary/10"
                    )}
                  >
                    <p className="text-xs text-muted-foreground">{dayNames[day.getDay()]}</p>
                    <p className={cn(
                      "font-medium",
                      isSameDay(day, new Date()) && "text-primary"
                    )}>{format(day, 'd')}</p>
                  </div>
                ))}
              </div>

              {/* Technician Rows */}
              {filteredStaff.map(technician => (
                <div key={technician.id} className="grid grid-cols-8 gap-2 mb-2">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={technician.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {technician.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">{technician.name}</span>
                  </div>
                  {weekDays.map((day, idx) => {
                    const availability = getTechnicianAvailability(technician.id, day);
                    const isPast = isBefore(day, new Date()) && !isSameDay(day, new Date());
                    
                    return (
                      <div 
                        key={idx}
                        className={cn(
                          "p-2 rounded-lg text-center text-sm",
                          isPast && "opacity-50",
                          !availability.isWorkingDay && "bg-muted/50",
                          availability.isWorkingDay && availability.bookings.length === 0 && "bg-emerald-50 dark:bg-emerald-900/20",
                          availability.isWorkingDay && availability.bookings.length > 0 && "bg-blue-50 dark:bg-blue-900/20"
                        )}
                      >
                        {!availability.isWorkingDay ? (
                          <span className="text-muted-foreground text-xs">Off</span>
                        ) : availability.bookings.length > 0 ? (
                          <div>
                            <Badge variant="secondary" className="text-xs mb-1">
                              {availability.bookings.length} job{availability.bookings.length > 1 ? 's' : ''}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {availability.bookedHours.toFixed(1)}h
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Check className="w-4 h-4 text-emerald-600 mb-1" />
                            <span className="text-xs text-emerald-600">Available</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {filteredStaff.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No active technicians found
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

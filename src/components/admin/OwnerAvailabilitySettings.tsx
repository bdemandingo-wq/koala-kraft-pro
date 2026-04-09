import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const label = `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
    const value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
    TIME_OPTIONS.push(value);
  }
}

function formatTime(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr);
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${hour12}:${mStr} ${ampm}`;
}

interface DaySchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day_of_week: 0, start_time: '09:00:00', end_time: '18:00:00', is_available: false },
  { day_of_week: 1, start_time: '08:00:00', end_time: '18:00:00', is_available: true },
  { day_of_week: 2, start_time: '08:00:00', end_time: '18:00:00', is_available: true },
  { day_of_week: 3, start_time: '08:00:00', end_time: '18:00:00', is_available: true },
  { day_of_week: 4, start_time: '08:00:00', end_time: '18:00:00', is_available: true },
  { day_of_week: 5, start_time: '08:00:00', end_time: '18:00:00', is_available: true },
  { day_of_week: 6, start_time: '09:00:00', end_time: '17:00:00', is_available: false },
];

export function OwnerAvailabilitySettings() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [staffId, setStaffId] = useState<string | null>(null);

  // Step 1: Get or create staff member
  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ['owner-staff', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      // Try to find existing staff
      const { data, error } = await supabase
        .from('staff')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) return data;

      // No staff exists — create one
      const name = `${organization.name || 'Business'} (Owner)`;
      const { data: created, error: createErr } = await supabase
        .from('staff')
        .insert({
          organization_id: organization.id,
          name,
          is_active: true,
          default_hours: 5,
        })
        .select('id')
        .single();

      if (createErr) throw createErr;
      return created;
    },
    enabled: !!organization?.id,
  });

  useEffect(() => {
    if (staff?.id) setStaffId(staff.id);
  }, [staff]);

  // Step 2: Fetch working hours
  const { data: workingHours, isLoading: hoursLoading } = useQuery({
    queryKey: ['working-hours', staffId],
    queryFn: async () => {
      if (!staffId) return null;

      const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .eq('staff_id', staffId)
        .order('day_of_week');

      if (error) throw error;

      // If no rows, insert defaults
      if (!data || data.length === 0) {
        const rows = DEFAULT_SCHEDULE.map((d) => ({
          staff_id: staffId,
          day_of_week: d.day_of_week,
          start_time: d.start_time,
          end_time: d.end_time,
          is_available: d.is_available,
        }));

        const { error: insertErr } = await supabase.from('working_hours').insert(rows);
        if (insertErr) throw insertErr;

        // Re-fetch
        const { data: refetched } = await supabase
          .from('working_hours')
          .select('*')
          .eq('staff_id', staffId)
          .order('day_of_week');

        return refetched;
      }

      return data;
    },
    enabled: !!staffId,
  });

  useEffect(() => {
    if (workingHours && workingHours.length > 0) {
      const mapped = DAY_NAMES.map((_, i) => {
        const row = workingHours.find((r: any) => r.day_of_week === i);
        return row
          ? {
              day_of_week: i,
              start_time: row.start_time || '08:00:00',
              end_time: row.end_time || '18:00:00',
              is_available: row.is_available ?? true,
            }
          : DEFAULT_SCHEDULE[i];
      });
      setSchedule(mapped);
    }
  }, [workingHours]);

  const updateDay = (dayIndex: number, field: keyof DaySchedule, value: any) => {
    setSchedule((prev) =>
      prev.map((d) => (d.day_of_week === dayIndex ? { ...d, [field]: value } : d))
    );
  };

  const handleSave = async () => {
    if (!staffId) return;
    setSaving(true);
    try {
      // Delete existing and re-insert (simpler than upserting 7 rows)
      await supabase.from('working_hours').delete().eq('staff_id', staffId);

      const rows = schedule.map((d) => ({
        staff_id: staffId,
        day_of_week: d.day_of_week,
        start_time: d.start_time,
        end_time: d.end_time,
        is_available: d.is_available,
      }));

      const { error } = await supabase.from('working_hours').insert(rows);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['working-hours', staffId] });
      toast.success('Availability saved successfully');
    } catch (err: any) {
      console.error('Error saving availability:', err);
      toast.error(err.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const isLoading = staffLoading || hoursLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Loading availability...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Your Availability
        </CardTitle>
        <CardDescription>
          Set your weekly working hours so customers can book online
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {schedule.map((day) => (
            <div
              key={day.day_of_week}
              className={`flex items-center gap-4 p-3 rounded-lg border ${
                day.is_available ? 'bg-card' : 'bg-muted/50'
              }`}
            >
              <div className="w-24 shrink-0">
                <Label className={`font-medium ${!day.is_available ? 'text-muted-foreground' : ''}`}>
                  {DAY_NAMES[day.day_of_week]}
                </Label>
              </div>

              <Switch
                checked={day.is_available}
                onCheckedChange={(checked) => updateDay(day.day_of_week, 'is_available', checked)}
              />

              {day.is_available ? (
                <div className="flex items-center gap-2 flex-1">
                  <Select
                    value={day.start_time}
                    onValueChange={(v) => updateDay(day.day_of_week, 'start_time', v)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {formatTime(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground text-sm">to</span>
                  <Select
                    value={day.end_time}
                    onValueChange={(v) => updateDay(day.day_of_week, 'end_time', v)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {formatTime(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Closed</span>
              )}
            </div>
          ))}
        </div>

        <Button className="gap-2 w-full sm:w-auto" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Availability
        </Button>
      </CardContent>
    </Card>
  );
}

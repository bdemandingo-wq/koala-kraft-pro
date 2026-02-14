import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrgId } from '@/hooks/useOrgId';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

interface CustomFrequency {
  id: string;
  name: string;
  interval_days: number;
  is_active: boolean;
}

export function CustomFrequenciesManager() {
  const { organizationId } = useOrgId();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newDays, setNewDays] = useState('');

  const { data: frequencies = [], isLoading } = useQuery({
    queryKey: ['custom-frequencies', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('custom_frequencies')
        .select('*')
        .eq('organization_id', organizationId)
        .order('interval_days', { ascending: true });
      if (error) throw error;
      return data as CustomFrequency[];
    },
    enabled: !!organizationId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId || !newName.trim() || !newDays) return;
      const days = parseInt(newDays);
      if (days <= 0) throw new Error('Days must be positive');
      const { error } = await supabase.from('custom_frequencies').insert({
        organization_id: organizationId,
        name: newName.trim(),
        interval_days: days,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-frequencies'] });
      setNewName('');
      setNewDays('');
      toast.success('Custom frequency added');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('custom_frequencies')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-frequencies'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_frequencies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-frequencies'] });
      toast.success('Frequency deleted');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5" />
          Custom Frequencies
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create custom recurring intervals beyond the standard weekly/bi-weekly/monthly options. These will appear in the booking form frequency dropdown.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label className="text-sm">Name</Label>
            <Input
              placeholder="e.g. Every 3 Days"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="w-28">
            <Label className="text-sm">Interval (days)</Label>
            <Input
              type="number"
              min="1"
              placeholder="e.g. 3"
              value={newDays}
              onChange={(e) => setNewDays(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button
            size="sm"
            onClick={() => addMutation.mutate()}
            disabled={!newName.trim() || !newDays || addMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : frequencies.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No custom frequencies yet. Add one above.
          </p>
        ) : (
          <div className="space-y-2">
            {frequencies.map((freq) => (
              <div
                key={freq.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={freq.is_active}
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({ id: freq.id, is_active: checked })
                    }
                  />
                  <div>
                    <span className="font-medium text-sm">{freq.name}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      Every {freq.interval_days} day{freq.interval_days !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(freq.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

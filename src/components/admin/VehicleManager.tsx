import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Plus, Edit, Trash2, Car, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const VEHICLE_TYPES = ['Sedan', 'Coupe', 'SUV / Crossover', 'Truck', 'Minivan', 'Sports Car', 'Luxury / Exotic', 'RV / Motorhome'];
const VEHICLE_CONDITIONS = ['Well Maintained', 'Light Dirt/Wear', 'Moderate — Needs Attention', 'Heavy — Neglected'];

interface Vehicle {
  id: string;
  customer_id: string;
  organization_id: string;
  year: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
  vehicle_type: string | null;
  condition: string | null;
  notes: string | null;
  created_at: string;
}

interface VehicleFormData {
  year: string;
  make: string;
  model: string;
  color: string;
  vehicle_type: string;
  condition: string;
  notes: string;
}

const emptyForm: VehicleFormData = { year: '', make: '', model: '', color: '', vehicle_type: '', condition: '', notes: '' };

interface VehicleManagerProps {
  customerId: string;
}

export function VehicleManager({ customerId }: VehicleManagerProps) {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const queryKey = ['vehicles', customerId, organization?.id];

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', customerId)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!organization?.id && !!customerId,
  });

  const openAdd = () => {
    setEditingVehicle(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm({
      year: v.year || '',
      make: v.make || '',
      model: v.model || '',
      color: v.color || '',
      vehicle_type: v.vehicle_type || '',
      condition: v.condition || '',
      notes: v.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make) { toast.error('Vehicle make is required'); return; }
    if (!organization?.id) return;
    setSubmitting(true);
    try {
      const payload = {
        customer_id: customerId,
        organization_id: organization.id,
        year: form.year || null,
        make: form.make || null,
        model: form.model || null,
        color: form.color || null,
        vehicle_type: form.vehicle_type || null,
        condition: form.condition || null,
        notes: form.notes || null,
      };
      if (editingVehicle) {
        const { error } = await supabase.from('vehicles').update(payload).eq('id', editingVehicle.id);
        if (error) throw error;
        toast.success('Vehicle updated');
      } else {
        const { error } = await supabase.from('vehicles').insert(payload);
        if (error) throw error;
        toast.success('Vehicle added');
      }
      queryClient.invalidateQueries({ queryKey });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('Vehicle deleted');
      queryClient.invalidateQueries({ queryKey });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-muted-foreground" />
          <Label className="font-medium text-base">Vehicles</Label>
          <Badge variant="secondary" className="text-xs">{vehicles.length}</Badge>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="w-3.5 h-3.5" /> Add Vehicle
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading vehicles...
        </div>
      ) : vehicles.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No vehicles saved yet.</p>
      ) : (
        <div className="space-y-2">
          {vehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              expanded={expandedId === v.id}
              onToggle={() => setExpandedId(prev => prev === v.id ? null : v.id)}
              onEdit={() => openEdit(v)}
              onDelete={() => setDeleteId(v.id)}
              organizationId={organization?.id || ''}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Year</Label>
                <Input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2024" />
              </div>
              <div className="space-y-2">
                <Label>Make *</Label>
                <Input value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} placeholder="Toyota" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Model</Label>
                <Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="Camry" />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="Black" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Select value={form.vehicle_type} onValueChange={v => setForm(f => ({ ...f, vehicle_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special notes about this vehicle..." rows={2} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This will unlink the vehicle from all bookings.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function VehicleCard({ vehicle, expanded, onToggle, onEdit, onDelete, organizationId }: {
  vehicle: Vehicle;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  organizationId: string;
}) {
  const { data: bookings = [] } = useQuery({
    queryKey: ['vehicle-bookings', vehicle.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_number, scheduled_at, total_amount, status, services:service_id(name)')
        .eq('vehicle_id', vehicle.id)
        .eq('organization_id', organizationId)
        .order('scheduled_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: expanded && !!organizationId,
  });

  const label = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Untitled Vehicle';

  return (
    <Card className="border-border/50">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <Collapsible open={expanded} onOpenChange={onToggle}>
            <CollapsibleTrigger className="flex items-center gap-2 text-left">
              <Car className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">{label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {vehicle.color && <Badge variant="outline" className="text-[10px]">{vehicle.color}</Badge>}
                  {vehicle.vehicle_type && <Badge variant="secondary" className="text-[10px]">{vehicle.vehicle_type}</Badge>}
                  {vehicle.condition && <Badge variant="secondary" className="text-[10px]">{vehicle.condition}</Badge>}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ml-2 ${expanded ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </Collapsible>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Edit className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 px-4 pb-3">
          {vehicle.notes && <p className="text-xs text-muted-foreground mb-2">{vehicle.notes}</p>}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Service History</p>
          {bookings.length === 0 ? (
            <p className="text-xs text-muted-foreground">No bookings linked to this vehicle yet.</p>
          ) : (
            <div className="space-y-1.5">
              {bookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                  <div>
                    <span className="font-medium">#{b.booking_number}</span>
                    <span className="ml-2 text-muted-foreground">{(b.services as any)?.name || 'Service'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{format(new Date(b.scheduled_at), 'MMM d, yyyy')}</span>
                    <span className="font-medium">${b.total_amount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Exported for use in booking forms
export function VehicleSelectDropdown({ customerId, organizationId, value, onChange, onAddNew }: {
  customerId: string;
  organizationId: string;
  value: string;
  onChange: (vehicleId: string) => void;
  onAddNew: () => void;
}) {
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', customerId, organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!customerId && !!organizationId,
  });

  const selectedVehicle = vehicles.find(v => v.id === value);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Car className="w-3.5 h-3.5" /> Select Vehicle
      </Label>
      <Select value={value} onValueChange={(v) => {
        if (v === '__add_new__') { onAddNew(); return; }
        onChange(v);
      }}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a vehicle..." />
        </SelectTrigger>
        <SelectContent>
          {vehicles.map(v => (
            <SelectItem key={v.id} value={v.id}>
              {[v.year, v.make, v.model].filter(Boolean).join(' ')}{v.color ? ` (${v.color})` : ''}
            </SelectItem>
          ))}
          <SelectItem value="__add_new__" className="text-primary font-medium">
            + Add New Vehicle
          </SelectItem>
        </SelectContent>
      </Select>
      {selectedVehicle && (
        <div className="p-2 rounded bg-muted/30 text-xs space-y-0.5">
          <p className="font-medium">{[selectedVehicle.year, selectedVehicle.make, selectedVehicle.model].filter(Boolean).join(' ')}</p>
          <div className="flex gap-2 text-muted-foreground">
            {selectedVehicle.color && <span>{selectedVehicle.color}</span>}
            {selectedVehicle.vehicle_type && <span>• {selectedVehicle.vehicle_type}</span>}
            {selectedVehicle.condition && <span>• {selectedVehicle.condition}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

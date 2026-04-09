import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useServicePricing, ServicePricingData } from '@/hooks/useServicePricing';
import { Save, Pencil, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
}

export function ServicePricingEditor() {
  const { organization } = useOrganization();
  const { getServicePricing, saveServicePricing, loading: pricingLoading, refetch } = useServicePricing();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [currentPricing, setCurrentPricing] = useState<ServicePricingData | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState<{ type: string; index: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAddExtraOpen, setIsAddExtraOpen] = useState(false);
  const [newExtra, setNewExtra] = useState({ name: '', price: '' });

  // Fetch services from database
  useEffect(() => {
    async function fetchServices() {
      if (!organization?.id) return;
      
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching services:', error);
        return;
      }
      
      setServices(data || []);
      if (data && data.length > 0 && !selectedServiceId) {
        setSelectedServiceId(data[0].id);
      }
    }
    
    fetchServices();
  }, [organization?.id]);

  // Load pricing when service changes
  useEffect(() => {
    if (selectedServiceId) {
      const pricing = getServicePricing(selectedServiceId);
      setCurrentPricing(pricing);
    }
  }, [selectedServiceId, getServicePricing, pricingLoading]);

  const handleSave = async () => {
    if (!selectedServiceId || !currentPricing) return;
    
    setSaving(true);
    const success = await saveServicePricing(selectedServiceId, currentPricing);
    setSaving(false);
    
    if (success) {
      toast.success('Pricing saved successfully');
      refetch();
    } else {
      toast.error('Failed to save pricing');
    }
  };

  const handleExtraEdit = (index: number, field: 'name' | 'price', value: string | number) => {
    if (!currentPricing) return;
    const newExtras = [...currentPricing.extras];
    newExtras[index] = { ...newExtras[index], [field]: value };
    setCurrentPricing({ ...currentPricing, extras: newExtras });
    setEditingCell(null);
  };

  const handleDeleteExtra = (index: number) => {
    if (!currentPricing) return;
    const newExtras = currentPricing.extras.filter((_, i) => i !== index);
    setCurrentPricing({ ...currentPricing, extras: newExtras });
  };

  const handleAddExtra = () => {
    if (!currentPricing || !newExtra.name || !newExtra.price) return;
    const extra = {
      id: `custom_${Date.now()}`,
      name: newExtra.name,
      price: parseFloat(newExtra.price),
      note: '',
    };
    setCurrentPricing({ ...currentPricing, extras: [...currentPricing.extras, extra] });
    setNewExtra({ name: '', price: '' });
    setIsAddExtraOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, onSave: () => void) => {
    if (e.key === 'Enter') {
      onSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const selectedService = services.find(s => s.id === selectedServiceId);

  if (pricingLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Service-Specific Pricing</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a service to edit its unique pricing parameters. Changes are saved independently for each service.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label>Select Service Category</Label>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a service..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving || !selectedServiceId}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
          {selectedService && (
            <Badge variant="secondary" className="mt-3">
              Editing: {selectedService.name}
            </Badge>
          )}
        </CardContent>
      </Card>

      {selectedServiceId && currentPricing && (
        <>
          {/* Base Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Base Pricing</CardTitle>
              <p className="text-sm text-muted-foreground">Set the minimum price for this service</p>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Minimum Price ($)</Label>
                <Input
                  type="number"
                  value={currentPricing.minimum_price}
                  onChange={(e) => setCurrentPricing({ ...currentPricing, minimum_price: parseFloat(e.target.value) || 0 })}
                  className="w-32 mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Add-On Extras */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Add-On Extras</CardTitle>
                  <p className="text-sm text-muted-foreground">Click to edit prices</p>
                </div>
                <Dialog open={isAddExtraOpen} onOpenChange={setIsAddExtraOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Extra
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Extra</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={newExtra.name}
                          onChange={(e) => setNewExtra({ ...newExtra, name: e.target.value })}
                          placeholder="e.g., Engine Bay Clean"
                        />
                      </div>
                      <div>
                        <Label>Price ($)</Label>
                        <Input
                          type="number"
                          value={newExtra.price}
                          onChange={(e) => setNewExtra({ ...newExtra, price: e.target.value })}
                          placeholder="25"
                        />
                      </div>
                      <Button onClick={handleAddExtra} className="w-full">Add Extra</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {currentPricing.extras.map((extra, index) => (
                  <div 
                    key={extra.id}
                    className="p-4 rounded-lg border hover:bg-secondary/30 transition-colors relative group"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeleteExtra(index)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                    <p className="font-medium text-sm mb-1">{extra.name}</p>
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        setEditingCell({ type: 'extra', index });
                        setEditValue(extra.price.toString());
                      }}
                    >
                      {editingCell?.type === 'extra' && editingCell.index === index ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleExtraEdit(index, 'price', parseFloat(editValue) || 0)}
                          onKeyDown={(e) => handleKeyDown(e, () => handleExtraEdit(index, 'price', parseFloat(editValue) || 0))}
                          className="w-20 h-7 text-center"
                          autoFocus
                          type="number"
                        />
                      ) : (
                        <Badge variant="secondary" className="text-primary font-semibold">
                          ${extra.price}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

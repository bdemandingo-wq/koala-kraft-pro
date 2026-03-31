import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SubscriptionGate } from '@/components/admin/SubscriptionGate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Package, AlertTriangle, Trash2, Edit, RefreshCw, ExternalLink, CheckCircle, ShoppingCart,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

const DETAILING_CATEGORIES = [
  'Wash & Foam Products',
  'Degreasers & Iron Removers',
  'Clay Bars & Decontamination',
  'Polish & Compounds',
  'Wax & Sealants',
  'Ceramic Coating Products',
  'Interior Cleaners',
  'Leather & Vinyl Care',
  'Glass Cleaners',
  'Tire & Trim Products',
  'Microfibers & Applicator Pads',
  'Detailing Brushes & Tools',
  'Fragrance & Odor Eliminators',
  'PPE (gloves, masks)',
  'Miscellaneous',
];

const UNITS = ['oz', 'ml', 'gallons', 'units', 'sheets', 'pads'];

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  cost_per_unit: number;
  supplier: string | null;
  supplier_link: string | null;
  last_restocked_at: string | null;
}

export default function InventoryPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const queryClient = useQueryClient();
  const { organization } = useOrganization();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('organization_id', organization.id)
        .order('name');
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        category: d.category || 'Miscellaneous',
        quantity: d.quantity ?? 0,
        min_quantity: d.min_quantity ?? 0,
        unit: d.unit || 'units',
        cost_per_unit: d.cost_per_unit ?? 0,
        supplier: d.supplier,
        supplier_link: d.supplier_link,
        last_restocked_at: d.last_restocked_at,
      })) as InventoryItem[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      if (!organization?.id) throw new Error('No organization found');
      const { error } = await supabase.from('inventory_items').insert([{ name: data.name, description: data.description, category: data.category, quantity: data.quantity, min_quantity: data.min_quantity, unit: data.unit, cost_per_unit: data.cost_per_unit, supplier: data.supplier, supplier_link: data.supplier_link, organization_id: organization.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Product added');
      setDialogOpen(false);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<InventoryItem> & { id: string }) => {
      if (!organization?.id) throw new Error('No organization found');
      const { error } = await supabase.from('inventory_items').update(data).eq('id', id).eq('organization_id', organization.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Product updated');
      setDialogOpen(false);
      setEditingItem(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error('No organization found');
      const { error } = await supabase.from('inventory_items').delete().eq('id', id).eq('organization_id', organization.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Product deleted');
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleRestock = () => {
    if (!restockItem || !restockAmount) return;
    const newQuantity = restockItem.quantity + parseFloat(restockAmount);
    updateMutation.mutate({
      id: restockItem.id,
      quantity: newQuantity,
      last_restocked_at: new Date().toISOString(),
    } as any);
    setRestockDialogOpen(false);
    setRestockItem(null);
    setRestockAmount('');
  };

  const lowStockItems = items.filter(i => i.quantity <= i.min_quantity && i.min_quantity > 0);
  const outOfStockItems = items.filter(i => i.quantity <= 0);
  const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.cost_per_unit), 0);

  const filteredItems = filterCategory === 'all' ? items : items.filter(i => i.category === filterCategory);

  const getStatusBadge = (item: InventoryItem) => {
    if (item.quantity <= 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (item.quantity <= item.min_quantity && item.min_quantity > 0) return <Badge variant="secondary" className="border-amber-500 text-amber-700 dark:text-amber-400">Low Stock</Badge>;
    return <Badge variant="secondary" className="border-emerald-500 text-emerald-700 dark:text-emerald-400">In Stock</Badge>;
  };

  return (
    <AdminLayout
      title="Inventory & Supplies"
      subtitle={`${items.length} products tracked`}
      actions={
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      }
    >
      <SubscriptionGate feature="Inventory">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Products</span>
              </div>
              <p className="text-2xl font-bold mt-1">{items.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">Low Stock</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-amber-600">{lowStockItems.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Out of Stock</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-destructive">{outOfStockItems.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Inventory Value</span>
              </div>
              <p className="text-2xl font-bold mt-1">${totalValue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Low Stock Alert</span>
                  <div className="text-sm mt-1 space-y-0.5">
                    {lowStockItems.map(i => (
                      <p key={i.id}>{i.name} — only {i.quantity} {i.unit} remaining. Reorder now.</p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="reorder">
              Reorder {lowStockItems.length > 0 && <Badge variant="destructive" className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">{lowStockItems.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Filter:</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {DETAILING_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Reorder Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Cost/Unit</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : filteredItems.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No products found</TableCell></TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <p className="font-medium">{item.name}</p>
                            {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                          </TableCell>
                          <TableCell className="text-sm">{item.category}</TableCell>
                          <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{item.min_quantity}</TableCell>
                          <TableCell>{getStatusBadge(item)}</TableCell>
                          <TableCell className="text-right">${item.cost_per_unit.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="text-sm">{item.supplier || '-'}</span>
                              {item.supplier_link && (
                                <a href={item.supplier_link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3 text-primary" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setRestockItem(item); setRestockDialogOpen(true); }} title="Restock">
                                <RefreshCw className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingItem(item); setDialogOpen(true); }}>
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(item.id); }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reorder" className="space-y-4">
            <p className="text-sm text-muted-foreground">Products at or below reorder threshold.</p>
            {lowStockItems.length === 0 && outOfStockItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500" />
                  <p className="font-medium">All stocked up!</p>
                  <p className="text-sm">No products need reordering right now.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Current Qty</TableHead>
                        <TableHead className="text-right">Reorder Level</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Supplier Link</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...outOfStockItems, ...lowStockItems.filter(i => i.quantity > 0)].map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(item)}
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{item.quantity} {item.unit}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{item.min_quantity} {item.unit}</TableCell>
                          <TableCell>{item.supplier || '-'}</TableCell>
                          <TableCell>
                            {item.supplier_link ? (
                              <a href={item.supplier_link} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm flex items-center gap-1">
                                Order <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => { setRestockItem(item); setRestockDialogOpen(true); }}>
                                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Restocked
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <ProductDialog
          open={dialogOpen}
          onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingItem(null); }}
          item={editingItem}
          onSave={(data) => {
            if (editingItem) {
              updateMutation.mutate({ id: editingItem.id, ...data } as any);
            } else {
              createMutation.mutate(data);
            }
          }}
        />

        {/* Restock Dialog */}
        <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Restock: {restockItem?.name}</DialogTitle>
              <DialogDescription>Enter the quantity received.</DialogDescription>
            </DialogHeader>
            <div>
              <Label>Quantity Received</Label>
              <Input type="number" step="0.1" value={restockAmount} onChange={(e) => setRestockAmount(e.target.value)} placeholder="0" />
              <p className="text-sm text-muted-foreground mt-2">
                Current stock: {restockItem?.quantity} {restockItem?.unit}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRestockDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleRestock}>Mark as Restocked</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SubscriptionGate>
    </AdminLayout>
  );
}

function ProductDialog({
  open, onOpenChange, item, onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    name: '', description: '', category: 'Wash & Foam Products', quantity: '0',
    min_quantity: '5', unit: 'units', cost_per_unit: '0', supplier: '', supplier_link: '',
  });

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '', description: item.description || '',
        category: item.category || 'Miscellaneous', quantity: String(item.quantity ?? 0),
        min_quantity: String(item.min_quantity ?? 5), unit: item.unit || 'units',
        cost_per_unit: String(item.cost_per_unit ?? 0), supplier: item.supplier || '',
        supplier_link: item.supplier_link || '',
      });
    } else {
      setForm({ name: '', description: '', category: 'Wash & Foam Products', quantity: '0', min_quantity: '5', unit: 'units', cost_per_unit: '0', supplier: '', supplier_link: '' });
    }
  }, [item, open]);

  const handleSubmit = () => {
    if (!form.name) return;
    onSave({
      name: form.name, description: form.description || null,
      category: form.category, quantity: parseFloat(form.quantity),
      min_quantity: parseFloat(form.min_quantity), unit: form.unit,
      cost_per_unit: parseFloat(form.cost_per_unit),
      supplier: form.supplier || null, supplier_link: form.supplier_link || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit' : 'Add'} Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Product Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Meguiar's Ultimate Compound" />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DETAILING_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Quantity</Label>
              <Input type="number" step="0.1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <Label>Reorder Level</Label>
              <Input type="number" step="0.1" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} />
            </div>
            <div>
              <Label>Cost/Unit ($)</Label>
              <Input type="number" step="0.01" value={form.cost_per_unit} onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Supplier</Label>
            <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="e.g. Amazon, Detail King" />
          </div>
          <div>
            <Label>Supplier Link</Label>
            <Input value={form.supplier_link} onChange={(e) => setForm({ ...form, supplier_link: e.target.value })} placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{item ? 'Update' : 'Add Product'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

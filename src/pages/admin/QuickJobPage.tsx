import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  Video,
  Loader2,
  Trash2,
  CheckCircle,
  Car,
  User,
  DollarSign,
  Calendar,
  ImageIcon,
  Plus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const VEHICLE_TYPES = ['Sedan', 'Coupe', 'SUV/Crossover', 'Truck', 'Minivan', 'Sports Car', 'Luxury/Exotic', 'RV/Motorhome'];

interface FilePreview {
  file: File;
  preview: string;
  type: 'before' | 'after';
  fileType: 'photo' | 'video';
}

export default function QuickJobPage() {
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const photoBeforeRef = useRef<HTMLInputElement>(null);
  const photoAfterRef = useRef<HTMLInputElement>(null);
  const videoBeforeRef = useRef<HTMLInputElement>(null);
  const videoAfterRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<FilePreview[]>([]);

  // Form state
  const [customerMode, setCustomerMode] = useState<'new' | 'existing'>('new');
  const [customerId, setCustomerId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehicleType, setVehicleType] = useState('');

  const [serviceName, setServiceName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  // Fetch existing customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-quick', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone')
        .eq('organization_id', organization!.id)
        .order('first_name');
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Fetch existing services
  const { data: services = [] } = useQuery({
    queryKey: ['services-quick', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('services')
        .select('id, name')
        .eq('organization_id', organization!.id)
        .order('name');
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, mediaType: 'before' | 'after', fileType: 'photo' | 'video') => {
    const selected = Array.from(e.target.files || []);
    const newFiles: FilePreview[] = selected.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      type: mediaType,
      fileType,
    }));
    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!organization?.id) return;
    if (customerMode === 'new' && (!firstName || !lastName || !email)) {
      toast.error('Please fill in customer name and email');
      return;
    }
    if (customerMode === 'existing' && !customerId) {
      toast.error('Please select a customer');
      return;
    }

    setSaving(true);
    try {
      // 1. Create or use existing customer
      let finalCustomerId = customerId;
      if (customerMode === 'new') {
        const { data: customer, error: custErr } = await supabase
          .from('customers')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email,
            phone: phone || null,
            organization_id: organization.id,
          })
          .select('id')
          .single();
        if (custErr) throw custErr;
        finalCustomerId = customer.id;
      }

      // 2. Create vehicle if info provided
      let vehicleId: string | null = null;
      if (vehicleMake || vehicleModel || vehicleYear) {
        const { data: vehicle, error: vehErr } = await supabase
          .from('vehicles')
          .insert({
            customer_id: finalCustomerId,
            organization_id: organization.id,
            make: vehicleMake || null,
            model: vehicleModel || null,
            year: vehicleYear || null,
            color: vehicleColor || null,
            vehicle_type: vehicleType || null,
          })
          .select('id')
          .single();
        if (vehErr) throw vehErr;
        vehicleId = vehicle.id;
      }

      // 3. Find or skip service
      const matchedService = services.find(s => s.name === serviceName);

      // 4. Create booking
      const { data: booking, error: bookErr } = await supabase
        .from('bookings')
        .insert({
          organization_id: organization.id,
          customer_id: finalCustomerId,
          vehicle_id: vehicleId,
          service_id: matchedService?.id || null,
          scheduled_at: new Date(scheduledDate).toISOString(),
          duration: 60,
          total_amount: parseFloat(totalAmount) || 0,
          payment_status: paymentStatus,
          status: 'completed',
          notes: [serviceName && !matchedService ? `Service: ${serviceName}` : '', notes].filter(Boolean).join('\n'),
        })
        .select('id')
        .single();
      if (bookErr) throw bookErr;

      // 5. Upload photos/videos
      for (const fp of files) {
        if (fp.file.size > 100 * 1024 * 1024) {
          toast.error(`${fp.file.name} exceeds 100MB limit, skipping`);
          continue;
        }
        const ext = fp.file.name.split('.').pop();
        const bucket = fp.type === 'before' ? 'job-before-media' : 'job-after-media';
        const filePath = `${organization.id}/${booking.id}/${fp.type}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: upErr } = await supabase.storage.from(bucket).upload(filePath, fp.file);
        if (upErr) {
          console.error('Upload error:', upErr);
          toast.error(`Failed to upload ${fp.file.name}`);
          continue;
        }

        await supabase.from('job_media').insert({
          booking_id: booking.id,
          organization_id: organization.id,
          media_type: fp.type,
          file_type: fp.fileType,
          file_url: filePath,
          file_name: fp.file.name,
        });
      }

      toast.success('Job logged successfully!');
      navigate('/dashboard/booking-photos');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const beforeFiles = files.filter(f => f.type === 'before');
  const afterFiles = files.filter(f => f.type === 'after');

  return (
    <AdminLayout title="Quick Job" subtitle="Log a completed job with photos">
      <div className="max-w-2xl mx-auto space-y-6 pb-8">

        {/* Customer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" /> Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={customerMode === 'new' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCustomerMode('new')}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> New
              </Button>
              <Button
                variant={customerMode === 'existing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCustomerMode('existing')}
              >
                Existing
              </Button>
            </div>
            {customerMode === 'existing' ? (
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} — {c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First Name *</Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" type="email" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="w-4 h-4" /> Vehicle Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Year</Label>
                <Input value={vehicleYear} onChange={e => setVehicleYear(e.target.value)} placeholder="2024" />
              </div>
              <div>
                <Label>Make</Label>
                <Input value={vehicleMake} onChange={e => setVehicleMake(e.target.value)} placeholder="Toyota" />
              </div>
              <div>
                <Label>Model</Label>
                <Input value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} placeholder="Camry" />
              </div>
              <div>
                <Label>Color</Label>
                <Input value={vehicleColor} onChange={e => setVehicleColor(e.target.value)} placeholder="Black" />
              </div>
              <div className="col-span-2">
                <Label>Vehicle Type</Label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service & Payment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Service & Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Service</Label>
              {services.length > 0 ? (
                <Select value={serviceName} onValueChange={setServiceName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="e.g. Full Detail, Express Wash..." />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Total Amount ($)</Label>
                <Input
                  value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <Label>Payment Status</Label>
                <Select value={paymentStatus} onValueChange={(v: 'paid' | 'pending') => setPaymentStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any notes about the job..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Before Photos/Videos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-4 h-4" /> Before Photos & Videos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => photoBeforeRef.current?.click()}>
                <Camera className="w-3.5 h-3.5" /> Add Photos
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => videoBeforeRef.current?.click()}>
                <Video className="w-3.5 h-3.5" /> Add Videos
              </Button>
              <input ref={photoBeforeRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileSelect(e, 'before', 'photo')} />
              <input ref={videoBeforeRef} type="file" accept="video/*" multiple className="hidden" onChange={e => handleFileSelect(e, 'before', 'video')} />
            </div>
            {beforeFiles.length === 0 ? (
              <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center text-sm text-muted-foreground">
                <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-40" />
                No before media added
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {beforeFiles.map((fp, i) => {
                  const globalIndex = files.indexOf(fp);
                  return (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted border group">
                      {fp.fileType === 'photo' && fp.preview ? (
                        <img src={fp.preview} alt="Before" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(globalIndex)}
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                      <Badge className="absolute bottom-1 left-1 text-[10px]">Before</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* After Photos/Videos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> After Photos & Videos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => photoAfterRef.current?.click()}>
                <Camera className="w-3.5 h-3.5" /> Add Photos
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => videoAfterRef.current?.click()}>
                <Video className="w-3.5 h-3.5" /> Add Videos
              </Button>
              <input ref={photoAfterRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileSelect(e, 'after', 'photo')} />
              <input ref={videoAfterRef} type="file" accept="video/*" multiple className="hidden" onChange={e => handleFileSelect(e, 'after', 'video')} />
            </div>
            {afterFiles.length === 0 ? (
              <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center text-sm text-muted-foreground">
                <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-40" />
                No after media added
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {afterFiles.map((fp, i) => {
                  const globalIndex = files.indexOf(fp);
                  return (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted border group">
                      {fp.fileType === 'photo' && fp.preview ? (
                        <img src={fp.preview} alt="After" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(globalIndex)}
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                      <Badge className="absolute bottom-1 left-1 text-[10px] bg-green-600">After</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          className="w-full h-12 text-base gap-2"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving Job...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Save Job {files.length > 0 && `(${files.length} media files)`}
            </>
          )}
        </Button>
      </div>
    </AdminLayout>
  );
}

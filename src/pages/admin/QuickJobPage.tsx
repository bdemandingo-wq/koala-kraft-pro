import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrgId } from '@/hooks/useOrgId';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon, Camera, Video, X, Loader2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const VEHICLE_TYPES = [
  'Sedan', 'Coupe', 'SUV/Crossover', 'Truck', 'Minivan',
  'Sports Car', 'Luxury/Exotic', 'RV/Motorhome',
];

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'photo' | 'video';
}

export default function QuickJobPage() {
  const navigate = useNavigate();
  const { organizationId } = useOrgId();
  const [saving, setSaving] = useState(false);

  // Customer
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Vehicle
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [vehicleType, setVehicleType] = useState('');

  // Service & Payment
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customService, setCustomService] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [jobDate, setJobDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');

  // Media
  const [beforeFiles, setBeforeFiles] = useState<MediaFile[]>([]);
  const [afterFiles, setAfterFiles] = useState<MediaFile[]>([]);
  const beforePhotoRef = useRef<HTMLInputElement>(null);
  const beforeVideoRef = useRef<HTMLInputElement>(null);
  const afterPhotoRef = useRef<HTMLInputElement>(null);
  const afterVideoRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-quick-job', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone')
        .eq('organization_id', organizationId!)
        .order('first_name');
      return data || [];
    },
    enabled: !!organizationId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services-quick-job', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('services')
        .select('id, name, price')
        .eq('organization_id', organizationId!)
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
    enabled: !!organizationId,
  });

  const addFiles = (files: FileList | null, type: 'photo' | 'video', target: 'before' | 'after') => {
    if (!files) return;
    const newFiles: MediaFile[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      type,
    }));
    if (target === 'before') setBeforeFiles(prev => [...prev, ...newFiles]);
    else setAfterFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string, target: 'before' | 'after') => {
    const setter = target === 'before' ? setBeforeFiles : setAfterFiles;
    setter(prev => {
      const file = prev.find(f => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const handleSave = async () => {
    if (!organizationId) return;
    if (isNewCustomer && !firstName.trim()) {
      toast.error('Please enter a first name');
      return;
    }
    if (!isNewCustomer && !selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      toast.error('Please enter a valid total amount');
      return;
    }

    setSaving(true);
    try {
      // 1. Create or use existing customer
      let customerId = selectedCustomerId;
      if (isNewCustomer) {
        const { data: newCustomer, error: custErr } = await supabase
          .from('customers')
          .insert({
            organization_id: organizationId,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
          })
          .select('id')
          .single();
        if (custErr) throw custErr;
        customerId = newCustomer.id;
      }

      // 2. Create vehicle
      const { error: vehErr } = await supabase.from('vehicles').insert({
        organization_id: organizationId,
        customer_id: customerId,
        year: year.trim() || null,
        make: make.trim() || null,
        model: model.trim() || null,
        color: color.trim() || null,
        vehicle_type: vehicleType || null,
      });
      if (vehErr) throw vehErr;

      // 3. Create booking
      const { data: booking, error: bookErr } = await supabase
        .from('bookings')
        .insert({
          organization_id: organizationId,
          customer_id: customerId,
          service_id: selectedServiceId || null,
          scheduled_at: jobDate.toISOString(),
          duration: 60,
          status: 'completed' as any,
          payment_status: paymentStatus as any,
          total_amount: parseFloat(totalAmount),
          notes: [customService, notes].filter(Boolean).join(' — ') || null,
        })
        .select('id')
        .single();
      if (bookErr) throw bookErr;

      // 4. Upload media files
      const uploadMedia = async (files: MediaFile[], bucket: string, mediaType: string) => {
        for (const mf of files) {
          const ext = mf.file.name.split('.').pop();
          const path = `${organizationId}/${booking.id}/${mf.id}.${ext}`;
          const { error: upErr } = await supabase.storage.from(bucket).upload(path, mf.file);
          if (upErr) {
            console.error('Upload error:', upErr);
            continue;
          }
          await supabase.from('job_media').insert({
            booking_id: booking.id,
            organization_id: organizationId,
            file_name: mf.file.name,
            file_type: mf.file.type,
            file_url: path,
            media_type: mediaType,
          });
        }
      };

      await Promise.all([
        uploadMedia(beforeFiles, 'job-before-media', 'before'),
        uploadMedia(afterFiles, 'job-after-media', 'after'),
      ]);

      toast.success('Job saved successfully!');
      navigate('/dashboard/booking-photos');
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const MediaGrid = ({ files, target, photoRef, videoRef }: {
    files: MediaFile[];
    target: 'before' | 'after';
    photoRef: React.RefObject<HTMLInputElement>;
    videoRef: React.RefObject<HTMLInputElement>;
  }) => (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => photoRef.current?.click()}>
          <Camera className="mr-2 h-4 w-4" /> Add Photos
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => videoRef.current?.click()}>
          <Video className="mr-2 h-4 w-4" /> Add Videos
        </Button>
        <input ref={photoRef as any} type="file" accept="image/*" multiple hidden
          onChange={e => { addFiles(e.target.files, 'photo', target); e.target.value = ''; }} />
        <input ref={videoRef as any} type="file" accept="video/*" multiple hidden
          onChange={e => { addFiles(e.target.files, 'video', target); e.target.value = ''; }} />
      </div>
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {files.map(f => (
            <div key={f.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              {f.type === 'photo' ? (
                <img src={f.preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={f.preview} className="w-full h-full object-cover" />
              )}
              <Badge className={cn(
                "absolute top-1 left-1 text-[10px] px-1.5 py-0",
                target === 'before' ? 'bg-blue-600' : 'bg-green-600'
              )}>
                {target === 'before' ? 'Before' : 'After'}
              </Badge>
              <button
                type="button"
                onClick={() => removeFile(f.id, target)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-0.5"
              >
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout title="Quick Job">
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <PlusCircle className="h-6 w-6 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold">Quick Job</h1>
        </div>

        {/* Customer */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Customer</CardTitle>
              <div className="flex items-center gap-2 text-sm">
                <span className={cn(!isNewCustomer && 'text-muted-foreground')}>New</span>
                <Switch checked={!isNewCustomer} onCheckedChange={v => setIsNewCustomer(!v)} />
                <span className={cn(isNewCustomer && 'text-muted-foreground')}>Existing</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isNewCustomer ? (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First Name *</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" /></div>
                <div><Label>Last Name</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" /></div>
                <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" /></div>
                <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" /></div>
              </div>
            ) : (
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} {c.email ? `— ${c.email}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Vehicle Info</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><Label>Year</Label><Input value={year} onChange={e => setYear(e.target.value)} placeholder="2024" /></div>
              <div><Label>Make</Label><Input value={make} onChange={e => setMake(e.target.value)} placeholder="Toyota" /></div>
              <div><Label>Model</Label><Input value={model} onChange={e => setModel(e.target.value)} placeholder="Camry" /></div>
              <div><Label>Color</Label><Input value={color} onChange={e => setColor(e.target.value)} placeholder="Black" /></div>
            </div>
            <div className="mt-3">
              <Label>Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Service & Payment */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Service & Payment</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Service</Label>
                <Select value={selectedServiceId} onValueChange={v => { setSelectedServiceId(v); setCustomService(''); }}>
                  <SelectTrigger><SelectValue placeholder="Select service..." /></SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} — ${s.price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Or Custom Service</Label>
                <Input value={customService} onChange={e => { setCustomService(e.target.value); setSelectedServiceId(''); }} placeholder="e.g. Full Detail + Ceramic" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label>Total Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input className="pl-7" type="number" min="0" step="0.01" value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div>
                <Label>Payment Status</Label>
                <Select value={paymentStatus} onValueChange={v => setPaymentStatus(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-8 md:h-10">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(jobDate, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={jobDate} onSelect={d => d && setJobDate(d)} /></PopoverContent>
                </Popover>
              </div>
            </div>
            <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any job notes..." rows={2} /></div>
          </CardContent>
        </Card>

        {/* Before Photos & Videos */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Before Photos & Videos</CardTitle></CardHeader>
          <CardContent>
            <MediaGrid files={beforeFiles} target="before" photoRef={beforePhotoRef} videoRef={beforeVideoRef} />
          </CardContent>
        </Card>

        {/* After Photos & Videos */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">After Photos & Videos</CardTitle></CardHeader>
          <CardContent>
            <MediaGrid files={afterFiles} target="after" photoRef={afterPhotoRef} videoRef={afterVideoRef} />
          </CardContent>
        </Card>

        {/* Save */}
        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Job'}
        </Button>
      </div>
    </AdminLayout>
  );
}

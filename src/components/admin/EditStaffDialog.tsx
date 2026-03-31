import { useState, useEffect, useRef } from 'react';
import { useOrgId } from '@/hooks/useOrgId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { geocodeAddress } from '@/lib/distanceUtils';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Upload, FileText, Trash2, Download, Key, Eye, EyeOff, MapPin, Loader2, Car, Award, DollarSign } from 'lucide-react';
import { StaffDocumentManager } from '@/components/admin/StaffDocumentManager';
import { AdminPayoutStatus } from '@/components/admin/AdminPayoutStatus';
import { PACKAGE_DURATIONS } from '@/data/detailingPackages';

const STAFF_COLOR_OPTIONS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#22c55e', label: 'Green' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#f97316', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#a855f7', label: 'Violet' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#6366f1', label: 'Indigo' },
];

const CERTIFICATION_OPTIONS = [
  'Ceramic Coating Certified',
  'Paint Correction Certified',
  'PPF Installer',
  'Window Tint Certified',
  'IDA Certified Detailer',
];

const SPECIALTY_OPTIONS = [
  'Exterior',
  'Interior',
  'Paint Correction',
  'Ceramic Coating',
  'Engine Bay',
  'Headlight Restoration',
];

const PAY_TYPE_OPTIONS = [
  { value: 'per_job', label: 'Per Job (Flat Rate)' },
  { value: 'commission', label: 'Commission (%)' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'salary', label: 'Salary' },
];

const PACKAGE_NAMES = Object.keys(PACKAGE_DURATIONS);

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  hourly_rate: number | null;
  percentage_rate?: number | null;
  bio: string | null;
  is_active: boolean;
  tax_classification?: string | null;
  base_wage?: number | null;
  tax_document_url?: string | null;
  ssn_last4?: string | null;
  ein?: string | null;
  user_id?: string | null;
  calendar_color?: string | null;
  default_hours?: number | null;
  home_address?: string | null;
  home_latitude?: number | null;
  home_longitude?: number | null;
  certifications?: string[] | null;
  specialties?: string[] | null;
  vehicle_info?: string | null;
  license_plate?: string | null;
  pay_type?: string | null;
  package_pay_rates?: Record<string, number> | null;
  commission_rate?: number | null;
  bonus_trigger?: string | null;
  bonus_threshold?: number | null;
  bonus_amount?: number | null;
  bonus_type?: string | null;
}

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember | null;
}

export function EditStaffDialog({ open, onOpenChange, staff }: EditStaffDialogProps) {
  const queryClient = useQueryClient();
  const { organizationId } = useOrgId();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    hourly_rate: '',
    percentage_rate: '',
    default_hours: '5',
    bio: '',
    is_active: true,
    tax_classification: 'w2' as 'w2' | '1099',
    tax_document_url: '',
    ssn_last4: '',
    ein: '',
    calendar_color: '',
    home_address: '',
    home_latitude: null as number | null,
    home_longitude: null as number | null,
    certifications: [] as string[],
    specialties: [] as string[],
    vehicle_info: '',
    license_plate: '',
    pay_type: 'per_job',
    package_pay_rates: {} as Record<string, number>,
    commission_rate: '',
    bonus_trigger: '',
    bonus_threshold: '',
    bonus_amount: '',
    bonus_type: 'flat',
  });

  // Performance data
  const { data: performanceData } = useQuery({
    queryKey: ['staff-performance', staff?.id, organizationId],
    queryFn: async () => {
      if (!staff?.id || !organizationId) return null;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

      const [monthRes, yearRes, mediaRes] = await Promise.all([
        supabase.from('bookings').select('id, total_amount, scheduled_at, status').eq('organization_id', organizationId).eq('staff_id', staff.id).eq('status', 'completed').gte('scheduled_at', monthStart),
        supabase.from('bookings').select('id, total_amount, service_id, services:service_id(name)').eq('organization_id', organizationId).eq('staff_id', staff.id).eq('status', 'completed').gte('scheduled_at', yearStart),
        supabase.from('job_media').select('id').eq('organization_id', organizationId).eq('uploaded_by', staff.id),
      ]);

      const monthJobs = monthRes.data?.length || 0;
      const yearJobs = yearRes.data?.length || 0;
      const totalRevenue = (yearRes.data || []).reduce((s: number, b: any) => s + Number(b.total_amount || 0), 0);
      const mediaCount = mediaRes.data?.length || 0;

      // Most performed package
      const serviceCounts: Record<string, number> = {};
      for (const b of yearRes.data || []) {
        const name = (b as any).services?.name || 'Unknown';
        serviceCounts[name] = (serviceCounts[name] || 0) + 1;
      }
      const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      return { monthJobs, yearJobs, totalRevenue, mediaCount, topService };
    },
    enabled: !!staff?.id && !!organizationId && open,
  });

  useEffect(() => {
    if (staff) {
      const rates = (staff as any).package_pay_rates || {};
      setFormData({
        name: staff.name,
        email: staff.email,
        phone: staff.phone || '',
        hourly_rate: staff.hourly_rate?.toString() || '',
        percentage_rate: staff.percentage_rate?.toString() || '',
        default_hours: staff.default_hours?.toString() || '5',
        bio: staff.bio || '',
        is_active: staff.is_active,
        tax_classification: (staff.tax_classification as 'w2' | '1099') || 'w2',
        tax_document_url: staff.tax_document_url || '',
        ssn_last4: staff.ssn_last4 || '',
        ein: staff.ein || '',
        calendar_color: staff.calendar_color || '',
        home_address: staff.home_address || '',
        home_latitude: staff.home_latitude ?? null,
        home_longitude: staff.home_longitude ?? null,
        certifications: (staff as any).certifications || [],
        specialties: (staff as any).specialties || [],
        vehicle_info: (staff as any).vehicle_info || '',
        license_plate: (staff as any).license_plate || '',
        pay_type: (staff as any).pay_type || 'per_job',
        package_pay_rates: typeof rates === 'object' ? rates : {},
        commission_rate: (staff as any).commission_rate?.toString() || '',
        bonus_trigger: (staff as any).bonus_trigger || '',
        bonus_threshold: (staff as any).bonus_threshold?.toString() || '',
        bonus_amount: (staff as any).bonus_amount?.toString() || '',
        bonus_type: (staff as any).bonus_type || 'flat',
      });
      setActiveTab('profile');
    }
  }, [staff]);

  const toggleArrayItem = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;
    
    setIsLoading(true);

    try {
      let latitude = formData.home_latitude;
      let longitude = formData.home_longitude;
      
      const needsGeocoding = formData.home_address && (
        formData.home_address !== staff.home_address || 
        !formData.home_latitude || !formData.home_longitude
      );
      
      if (needsGeocoding) {
        setIsGeocodingAddress(true);
        const coords = await geocodeAddress(formData.home_address);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lng;
          toast.success(`Address geocoded successfully`);
        } else {
          toast.warning('Could not geocode address');
          latitude = null;
          longitude = null;
        }
        setIsGeocodingAddress(false);
      }

      const { error } = await supabase
        .from('staff')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
          percentage_rate: formData.percentage_rate ? parseFloat(formData.percentage_rate) : null,
          default_hours: formData.default_hours ? parseFloat(formData.default_hours) : 5,
          bio: formData.bio || null,
          is_active: formData.is_active,
          tax_classification: formData.tax_classification,
          tax_document_url: formData.tax_document_url || null,
          ssn_last4: formData.ssn_last4 || null,
          ein: formData.ein || null,
          calendar_color: formData.calendar_color || null,
          home_address: formData.home_address || null,
          home_latitude: latitude,
          home_longitude: longitude,
          certifications: formData.certifications,
          specialties: formData.specialties,
          vehicle_info: formData.vehicle_info || null,
          license_plate: formData.license_plate || null,
          pay_type: formData.pay_type,
          package_pay_rates: formData.package_pay_rates,
          commission_rate: formData.commission_rate ? parseFloat(formData.commission_rate) : null,
          bonus_trigger: formData.bonus_trigger || null,
          bonus_threshold: formData.bonus_threshold ? parseFloat(formData.bonus_threshold) : null,
          bonus_amount: formData.bonus_amount ? parseFloat(formData.bonus_amount) : null,
          bonus_type: formData.bonus_type || 'flat',
        } as any)
        .eq('id', staff.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-all'] });
      toast.success('Technician updated');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating staff:', error);
      toast.error('Failed to update technician');
    } finally {
      setIsLoading(false);
      setIsGeocodingAddress(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !staff) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) { toast.error('Please upload a PDF, JPG, or PNG file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be less than 10MB'); return; }
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${staff.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('tax-documents').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      setFormData({ ...formData, tax_document_url: fileName });
      toast.success('Tax document uploaded');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload tax document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async () => {
    if (!formData.tax_document_url) return;
    try {
      await supabase.storage.from('tax-documents').remove([formData.tax_document_url]);
      setFormData({ ...formData, tax_document_url: '' });
      toast.success('Tax document deleted');
    } catch (error) { toast.error('Failed to delete tax document'); }
  };

  const handleDownloadDocument = async () => {
    if (!formData.tax_document_url) return;
    try {
      const { data, error } = await supabase.storage.from('tax-documents').download(formData.tax_document_url);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url; a.download = formData.tax_document_url.split('/').pop() || 'tax-document';
      a.click(); URL.revokeObjectURL(url);
    } catch (error) { toast.error('Failed to download tax document'); }
  };

  const handleResetPassword = async () => {
    if (!staff?.user_id || !newPassword) return;
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setIsResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-staff-password', {
        body: { userId: staff.user_id, newPassword, organizationId }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Password reset successfully');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally { setIsResettingPassword(false); }
  };

  const taxDocLabel = formData.tax_classification === 'w2' ? 'W-4 Form' : 'W-9 Form';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Technician — {staff?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="pay">Pay & Rates</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="docs">Docs & Tax</TabsTrigger>
            </TabsList>

            {/* ─── PROFILE TAB ─── */}
            <TabsContent value="profile" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" value={formData.email} disabled className="bg-muted" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label>Calendar Color</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {STAFF_COLOR_OPTIONS.map((color) => (
                      <button key={color.value} type="button"
                        className={`w-6 h-6 rounded-full border-2 transition-all ${formData.calendar_color === color.value ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setFormData({ ...formData, calendar_color: color.value })}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Award className="w-4 h-4" /> Certifications</Label>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATION_OPTIONS.map((cert) => (
                    <Badge key={cert} variant={formData.certifications.includes(cert) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setFormData({ ...formData, certifications: toggleArrayItem(formData.certifications, cert) })}
                    >{cert}</Badge>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-2">
                <Label>Specialties</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTY_OPTIONS.map((spec) => (
                    <Badge key={spec} variant={formData.specialties.includes(spec) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setFormData({ ...formData, specialties: toggleArrayItem(formData.specialties, spec) })}
                    >{spec}</Badge>
                  ))}
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Car className="w-4 h-4" /> Vehicle (Van/Car)</Label>
                  <Input value={formData.vehicle_info} onChange={(e) => setFormData({ ...formData, vehicle_info: e.target.value })} placeholder="2022 Ford Transit" />
                </div>
                <div className="space-y-2">
                  <Label>License Plate</Label>
                  <Input value={formData.license_plate} onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })} placeholder="ABC-1234" />
                </div>
              </div>

              {/* Home Address */}
              <div className="space-y-2">
                <Label htmlFor="edit-home_address" className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Home Address</Label>
                <div className="flex gap-2">
                  <Input id="edit-home_address" value={formData.home_address}
                    onChange={(e) => setFormData({ ...formData, home_address: e.target.value, home_latitude: null, home_longitude: null })}
                    placeholder="123 Main St, City, State ZIP" className="flex-1"
                  />
                  {formData.home_address && (
                    <Button type="button" variant="outline" size="sm" disabled={isGeocodingAddress}
                      onClick={async () => {
                        setIsGeocodingAddress(true);
                        const coords = await geocodeAddress(formData.home_address);
                        if (coords) {
                          setFormData({ ...formData, home_latitude: coords.lat, home_longitude: coords.lng });
                          toast.success(`Location updated!`);
                        } else { toast.error('Could not geocode'); }
                        setIsGeocodingAddress(false);
                      }}
                    >
                      {isGeocodingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for distance calculations
                  {formData.home_latitude && <span className="text-primary ml-1">✓ Location saved</span>}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bio">Bio</Label>
                <Textarea id="edit-bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Brief description..." rows={2} />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit-active">Active Status</Label>
                <Switch id="edit-active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
              </div>
            </TabsContent>

            {/* ─── PAY & RATES TAB ─── */}
            <TabsContent value="pay" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Pay Type</Label>
                <Select value={formData.pay_type} onValueChange={(v) => setFormData({ ...formData, pay_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAY_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Per Job - Package Pay Rates */}
              {formData.pay_type === 'per_job' && (
                <div className="space-y-3 rounded-lg border p-4">
                  <Label className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Per-Package Pay Rates</Label>
                  <p className="text-xs text-muted-foreground">Set the flat pay amount this technician earns per package</p>
                  {PACKAGE_NAMES.map(pkg => (
                    <div key={pkg} className="flex items-center gap-3">
                      <span className="text-sm w-48 truncate">{pkg}</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input type="number" step="0.01" min="0" className="pl-7"
                          value={formData.package_pay_rates[pkg] || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            package_pay_rates: { ...formData.package_pay_rates, [pkg]: parseFloat(e.target.value) || 0 }
                          })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Commission */}
              {formData.pay_type === 'commission' && (
                <div className="space-y-2 rounded-lg border p-4">
                  <Label>Commission Rate (%)</Label>
                  <Input type="number" step="0.1" min="0" max="100"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                    placeholder="40"
                  />
                  <p className="text-xs text-muted-foreground">Percentage of job total paid to this technician</p>
                </div>
              )}

              {/* Hourly */}
              {formData.pay_type === 'hourly' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hourly Rate ($)</Label>
                    <Input type="number" step="0.01" min="0" value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })} placeholder="25.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Hours Per Job</Label>
                    <Input type="number" step="0.5" min="0.5" max="24" value={formData.default_hours}
                      onChange={(e) => setFormData({ ...formData, default_hours: e.target.value })} placeholder="5" />
                  </div>
                </div>
              )}

              {/* Salary — keep existing percentage/hourly as fallback */}
              {formData.pay_type === 'salary' && (
                <div className="space-y-2">
                  <Label>Annual Salary or Base Wage</Label>
                  <Input type="number" step="0.01" min="0" value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })} placeholder="50000" />
                  <p className="text-xs text-muted-foreground">Enter the base wage amount used for payroll calculations</p>
                </div>
              )}

              {/* Tax Classification */}
              <div className="space-y-2">
                <Label>Tax Classification</Label>
                <Select value={formData.tax_classification} onValueChange={(v: 'w2' | '1099') => setFormData({ ...formData, tax_classification: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="w2">W-2 (Employee)</SelectItem>
                    <SelectItem value="1099">1099 (Independent Contractor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bonus Rules */}
              <div className="space-y-3 rounded-lg border p-4">
                <Label>Bonus Rules (Optional)</Label>
                <div className="space-y-2">
                  <Label className="text-xs">Bonus Trigger</Label>
                  <Select value={formData.bonus_trigger} onValueChange={(v) => setFormData({ ...formData, bonus_trigger: v })}>
                    <SelectTrigger><SelectValue placeholder="Select trigger..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="jobs_completed">Jobs Completed in Period</SelectItem>
                      <SelectItem value="revenue_generated">Revenue Generated</SelectItem>
                      <SelectItem value="rating_average">Customer Rating Average</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.bonus_trigger && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Threshold</Label>
                        <Input type="number" step="1" min="1" value={formData.bonus_threshold}
                          onChange={(e) => setFormData({ ...formData, bonus_threshold: e.target.value })}
                          placeholder={formData.bonus_trigger === 'jobs_completed' ? '20' : formData.bonus_trigger === 'revenue_generated' ? '5000' : '4.8'}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Bonus Amount</Label>
                        <Input type="number" step="0.01" min="0" value={formData.bonus_amount}
                          onChange={(e) => setFormData({ ...formData, bonus_amount: e.target.value })} placeholder="100"
                        />
                      </div>
                    </div>
                    <Select value={formData.bonus_type} onValueChange={(v) => setFormData({ ...formData, bonus_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat ($)</SelectItem>
                        <SelectItem value="percent">% of Earnings</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Example: If this technician completes {formData.bonus_threshold || '20'}+ {formData.bonus_trigger === 'jobs_completed' ? 'jobs' : formData.bonus_trigger === 'revenue_generated' ? 'in revenue' : 'avg rating'} in a pay period, add {formData.bonus_type === 'flat' ? `$${formData.bonus_amount || '100'}` : `${formData.bonus_amount || '5'}%`} bonus
                    </p>
                  </>
                )}
              </div>
            </TabsContent>

            {/* ─── PERFORMANCE TAB ─── */}
            <TabsContent value="performance" className="space-y-4 mt-4">
              {performanceData ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold">{performanceData.monthJobs}</p>
                    <p className="text-xs text-muted-foreground">Jobs This Month</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold">{performanceData.yearJobs}</p>
                    <p className="text-xs text-muted-foreground">Jobs This Year</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">${performanceData.totalRevenue.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Total Revenue Generated</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold">{performanceData.mediaCount}</p>
                    <p className="text-xs text-muted-foreground">Media Uploaded</p>
                  </div>
                  <div className="col-span-2 rounded-lg border p-4 text-center">
                    <p className="text-lg font-bold">{performanceData.topService}</p>
                    <p className="text-xs text-muted-foreground">Most Performed Package</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Loading performance data...</p>
              )}
            </TabsContent>

            {/* ─── DOCS & TAX TAB ─── */}
            <TabsContent value="docs" className="space-y-4 mt-4">
              {/* SSN/EIN */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SSN (Last 4 digits)</Label>
                  <Input value={formData.ssn_last4} onChange={(e) => setFormData({ ...formData, ssn_last4: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="1234" maxLength={4} />
                </div>
                <div className="space-y-2">
                  <Label>EIN (if applicable)</Label>
                  <Input value={formData.ein} onChange={(e) => setFormData({ ...formData, ein: e.target.value })} placeholder="XX-XXXXXXX" />
                </div>
              </div>

              {/* Tax Document Upload */}
              <div className="space-y-2">
                <Label>{taxDocLabel} (Tax Document)</Label>
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
                {formData.tax_document_url ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="flex-1 text-sm truncate">{formData.tax_document_url.split('/').pop()}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={handleDownloadDocument}><Download className="w-4 h-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={handleDeleteDocument}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    <Upload className="w-4 h-4" />{isUploading ? 'Uploading...' : `Upload ${taxDocLabel}`}
                  </Button>
                )}
              </div>

              {/* Staff Documents */}
              <div className="space-y-2 pt-4 border-t">
                <Label className="flex items-center gap-2"><FileText className="w-4 h-4" /> Uploaded Documents</Label>
                {staff && <StaffDocumentManager staffId={staff.id} staffName={staff.name} />}
              </div>

              {/* Payout Status */}
              <div className="space-y-2 pt-4 border-t">
                {staff && <AdminPayoutStatus staffId={staff.id} staffName={staff.name} />}
              </div>

              {/* Password Reset */}
              <div className="space-y-2 pt-4 border-t">
                <Label className="flex items-center gap-2"><Key className="w-4 h-4" /> Reset Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" minLength={6} />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="button" variant="secondary" onClick={handleResetPassword} disabled={isResettingPassword || !newPassword || newPassword.length < 6}>
                    {isResettingPassword ? 'Resetting...' : 'Reset'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading || isGeocodingAddress}>
              {isLoading || isGeocodingAddress ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isGeocodingAddress ? 'Geocoding...' : 'Saving...'}</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

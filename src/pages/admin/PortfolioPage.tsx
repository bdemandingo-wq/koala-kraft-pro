import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Play, ImageIcon, Loader2, ArrowRight, Share2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { getSignedUrl } from '@/hooks/useSignedUrl';
import { toast } from 'sonner';

interface PortfolioItem {
  booking_id: string;
  scheduled_at: string;
  service_name: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_type: string | null;
  before_items: MediaRecord[];
  after_items: MediaRecord[];
}

interface MediaRecord {
  id: string;
  file_url: string;
  file_type: string;
  media_type: string;
  file_name: string;
  uploaded_at: string;
}

export default function PortfolioPage() {
  const { organization } = useOrganization();
  const [serviceFilter, setServiceFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: rawMedia = [], isLoading } = useQuery({
    queryKey: ['portfolio-media', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_media')
        .select(`
          id, file_url, file_type, media_type, file_name, uploaded_at, booking_id,
          bookings!inner(scheduled_at, service_id, vehicle_id,
            services(name),
            customer_vehicles:vehicles(year, make, model, vehicle_type)
          )
        `)
        .eq('organization_id', organization!.id)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services-list', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('services')
        .select('id, name')
        .eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Group by booking_id for before/after pairs
  const portfolioItems = useMemo(() => {
    const map = new Map<string, PortfolioItem>();
    for (const item of rawMedia) {
      const booking = (item as any).bookings;
      const vehicle = booking?.customer_vehicles;
      if (!map.has(item.booking_id)) {
        map.set(item.booking_id, {
          booking_id: item.booking_id,
          scheduled_at: booking?.scheduled_at || '',
          service_name: booking?.services?.name || null,
          vehicle_year: vehicle?.year || null,
          vehicle_make: vehicle?.make || null,
          vehicle_model: vehicle?.model || null,
          vehicle_type: vehicle?.vehicle_type || null,
          before_items: [],
          after_items: [],
        });
      }
      const entry = map.get(item.booking_id)!;
      const record: MediaRecord = {
        id: item.id,
        file_url: item.file_url,
        file_type: item.file_type,
        media_type: item.media_type,
        file_name: item.file_name,
        uploaded_at: item.uploaded_at || '',
      };
      if (item.media_type === 'before') entry.before_items.push(record);
      else entry.after_items.push(record);
    }
    // Only show items that have both before and after
    let items = Array.from(map.values()).filter(i => i.before_items.length > 0 && i.after_items.length > 0);
    
    if (serviceFilter !== 'all') {
      items = items.filter(i => i.service_name === serviceFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(i =>
        i.vehicle_make?.toLowerCase().includes(s) ||
        i.vehicle_model?.toLowerCase().includes(s) ||
        i.service_name?.toLowerCase().includes(s)
      );
    }
    return items.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  }, [rawMedia, serviceFilter, search]);

  return (
    <AdminLayout title="Portfolio" subtitle="Before & after gallery across all jobs">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by vehicle or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map(s => (
                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : portfolioItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No before & after pairs yet. Upload media to bookings to build your portfolio.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolioItems.map(item => (
              <PortfolioCard key={item.booking_id} item={item} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function PortfolioCard({ item }: { item: PortfolioItem }) {
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);

  const beforeItem = item.before_items.find(i => i.file_type === 'photo') || item.before_items[0];
  const afterItem = item.after_items.find(i => i.file_type === 'photo') || item.after_items[0];

  // Load signed URLs on mount
  useState(() => { void 0; });
  // Use useEffect-like pattern with empty array to load once
  if (!beforeUrl && beforeItem) {
    getSignedUrl('job-before-media', beforeItem.file_url, 3600).then(setBeforeUrl);
  }
  if (!afterUrl && afterItem) {
    getSignedUrl('job-after-media', afterItem.file_url, 3600).then(setAfterUrl);
  }

  const vehicleLabel = [item.vehicle_year, item.vehicle_make, item.vehicle_model].filter(Boolean).join(' ');

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Before/After side-by-side thumbnails */}
      <div className="flex h-40">
        <div className="flex-1 relative bg-muted">
          {beforeUrl ? (
            beforeItem.file_type === 'video' ? (
              <div className="w-full h-full flex items-center justify-center bg-black/10">
                <Play className="w-8 h-8 text-white drop-shadow" />
              </div>
            ) : (
              <img src={beforeUrl} alt="Before" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <Badge className="absolute bottom-1 left-1 text-[10px]">Before</Badge>
        </div>
        <div className="flex items-center px-1 text-muted-foreground">
          <ArrowRight className="w-4 h-4" />
        </div>
        <div className="flex-1 relative bg-muted">
          {afterUrl ? (
            afterItem.file_type === 'video' ? (
              <div className="w-full h-full flex items-center justify-center bg-black/10">
                <Play className="w-8 h-8 text-white drop-shadow" />
              </div>
            ) : (
              <img src={afterUrl} alt="After" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <Badge className="absolute bottom-1 left-1 text-[10px] bg-green-600">After</Badge>
        </div>
      </div>

      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{item.service_name || 'Service'}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {item.scheduled_at ? format(new Date(item.scheduled_at), 'MMM d, yyyy') : ''}
          </div>
        </div>
        {vehicleLabel && (
          <p className="text-xs text-muted-foreground">{vehicleLabel}</p>
        )}
        <div className="flex gap-1.5 pt-1">
          <Badge variant="secondary" className="text-[10px]">
            {item.before_items.length} before · {item.after_items.length} after
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

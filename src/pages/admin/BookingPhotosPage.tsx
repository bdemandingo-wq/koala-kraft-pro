import { useState, useRef, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SubscriptionGate } from '@/components/admin/SubscriptionGate';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SignedImage } from '@/components/ui/signed-image';
import {
  Search, Camera, Calendar, User, Loader2, Image as ImageIcon,
  Trash2, Upload, Play, Video, X, Film, ImagePlus,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getSignedUrl } from '@/hooks/useSignedUrl';
import { cn } from '@/lib/utils';

// Unified media item from both tables
interface MediaItem {
  id: string;
  source: 'booking_photos' | 'job_media';
  booking_id: string;
  file_url: string;
  media_type: string | null; // before | after
  file_type: string; // mime type or 'image'
  caption: string | null;
  created_at: string | null;
  booking_number: number | null;
  customer_name: string;
  staff_name: string | null;
  scheduled_at: string | null;
  signedUrl?: string;
}

function isVideo(fileType: string) {
  return fileType.startsWith('video/') || fileType === 'video';
}

// Upload dialog pending file
interface PendingFile {
  id: string;
  file: File;
  type: 'photo' | 'video';
}

export default function BookingPhotosPage() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadBookingId, setUploadBookingId] = useState('');
  const [uploadMediaType, setUploadMediaType] = useState<'before' | 'after'>('before');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Fetch booking_photos
  const { data: bookingPhotos = [], isLoading: loadingPhotos } = useQuery({
    queryKey: ['booking-photos', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('booking_photos')
        .select(`*, booking:bookings!booking_photos_booking_id_fkey(booking_number, scheduled_at, customer:customers!bookings_customer_id_fkey(first_name, last_name)), staff:staff!booking_photos_staff_id_fkey(name)`)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any): MediaItem => ({
        id: p.id,
        source: 'booking_photos',
        booking_id: p.booking_id,
        file_url: p.photo_url,
        media_type: p.photo_type,
        file_type: 'image/jpeg',
        caption: p.caption,
        created_at: p.created_at,
        booking_number: p.booking?.booking_number ?? null,
        customer_name: p.booking?.customer ? `${p.booking.customer.first_name} ${p.booking.customer.last_name}` : 'Unknown',
        staff_name: p.staff?.name ?? null,
        scheduled_at: p.booking?.scheduled_at ?? null,
      }));
    },
    enabled: !!organization?.id,
  });

  // Fetch job_media
  const { data: jobMedia = [], isLoading: loadingMedia } = useQuery({
    queryKey: ['job-media', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('job_media')
        .select(`*, booking:bookings!job_media_booking_id_fkey(booking_number, scheduled_at, customer:customers!bookings_customer_id_fkey(first_name, last_name))`)
        .eq('organization_id', organization.id)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;

      // Generate signed URLs for private bucket items
      const items: MediaItem[] = [];
      for (const m of data || []) {
        const bucket = m.media_type === 'before' ? 'job-before-media' : 'job-after-media';
        const url = await getSignedUrl(bucket, m.file_url);
        items.push({
          id: m.id,
          source: 'job_media',
          booking_id: m.booking_id,
          file_url: m.file_url,
          media_type: m.media_type,
          file_type: m.file_type || 'image/jpeg',
          caption: m.notes,
          created_at: m.uploaded_at,
          booking_number: (m as any).booking?.booking_number ?? null,
          customer_name: (m as any).booking?.customer ? `${(m as any).booking.customer.first_name} ${(m as any).booking.customer.last_name}` : 'Unknown',
          staff_name: null,
          scheduled_at: (m as any).booking?.scheduled_at ?? null,
          signedUrl: url ?? undefined,
        });
      }
      return items;
    },
    enabled: !!organization?.id,
  });

  // Recent bookings for upload picker
  const { data: recentBookings = [] } = useQuery({
    queryKey: ['recent-bookings-upload', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('bookings')
        .select('id, booking_number, scheduled_at, customer:customers!bookings_customer_id_fkey(first_name, last_name)')
        .eq('organization_id', organization.id)
        .order('scheduled_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const isLoading = loadingPhotos || loadingMedia;
  const allMedia = [...bookingPhotos, ...jobMedia].sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return db - da;
  });

  const photoCount = allMedia.filter(m => !isVideo(m.file_type)).length;
  const videoCount = allMedia.filter(m => isVideo(m.file_type)).length;
  const beforeCount = allMedia.filter(m => m.media_type === 'before').length;
  const afterCount = allMedia.filter(m => m.media_type === 'after').length;

  const filtered = allMedia.filter(m => {
    if (typeFilter === 'before' && m.media_type !== 'before') return false;
    if (typeFilter === 'after' && m.media_type !== 'after') return false;
    if (typeFilter === 'videos' && !isVideo(m.file_type)) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return m.customer_name.toLowerCase().includes(term) ||
      (m.staff_name?.toLowerCase().includes(term) ?? false) ||
      (m.booking_number?.toString().includes(term) ?? false);
  });

  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Delete this media? This cannot be undone.')) return;
    setDeletingId(item.id);
    try {
      if (item.source === 'booking_photos') {
        await supabase.storage.from('booking-photos').remove([item.file_url]);
        const { error } = await supabase.from('booking_photos').delete().eq('id', item.id);
        if (error) throw error;
      } else {
        const bucket = item.media_type === 'before' ? 'job-before-media' : 'job-after-media';
        await supabase.storage.from(bucket).remove([item.file_url]);
        const { error } = await supabase.from('job_media').delete().eq('id', item.id);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['booking-photos'] });
      queryClient.invalidateQueries({ queryKey: ['job-media'] });
      toast.success('Deleted');
      if (selectedItem?.id === item.id) setSelectedItem(null);
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  // Upload handlers
  const addPendingFiles = (files: FileList | null, type: 'photo' | 'video') => {
    if (!files) return;
    const newFiles: PendingFile[] = Array.from(files).map(f => ({
      id: crypto.randomUUID(), file: f, type,
    }));
    setPendingFiles(prev => [...prev, ...newFiles]);
  };

  const handleUpload = async () => {
    if (!organization?.id || !uploadBookingId || pendingFiles.length === 0) {
      toast.error('Select a booking and add files');
      return;
    }
    setUploading(true);
    try {
      const bucket = uploadMediaType === 'before' ? 'job-before-media' : 'job-after-media';
      for (const pf of pendingFiles) {
        const ext = pf.file.name.split('.').pop();
        const path = `${organization.id}/${uploadBookingId}/${pf.id}.${ext}`;
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, pf.file);
        if (upErr) { console.error(upErr); continue; }
        const detectedType = pf.file.type.startsWith('video/') ? 'video' : 'photo';
        const { error: dbErr } = await supabase.from('job_media').insert({
          booking_id: uploadBookingId,
          organization_id: organization.id,
          file_name: pf.file.name,
          file_type: detectedType,
          file_url: path,
          media_type: uploadMediaType,
        });
        if (dbErr) {
          console.error('DB insert error:', dbErr);
          toast.error(`Failed to save record for ${pf.file.name}: ${dbErr.message}`);
        }
      }
      toast.success(`${pendingFiles.length} file(s) uploaded!`);
      setPendingFiles([]);
      setUploadOpen(false);
      queryClient.invalidateQueries({ queryKey: ['job-media'] });
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Render media thumbnail
  const MediaThumb = ({ item }: { item: MediaItem }) => {
    const videoFile = isVideo(item.file_type);
    const src = item.signedUrl || item.file_url;

    if (item.source === 'booking_photos') {
      return (
        <SignedImage src={item.file_url} bucket="booking-photos" alt="" className="w-full h-full object-cover"
          fallback={<div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>} />
      );
    }

    if (videoFile) {
      return (
        <div className="w-full h-full bg-muted relative overflow-hidden">
          {src ? (
            <video
              src={src}
              className="w-full h-full object-cover"
              preload="metadata"
              muted
              playsInline
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
        </div>
      );
    }

    return src ? (
      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-muted"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>
    );
  };

  const openUploadEmpty = () => {
    setPendingFiles([]);
    setUploadBookingId('');
    setUploadMediaType('before');
    setUploadOpen(true);
  };

  return (
    <AdminLayout title="Media Gallery" actions={
      <Button onClick={openUploadEmpty} size="sm" className="gap-2">
        <Upload className="w-4 h-4" /> Upload
      </Button>
    }>
      <SubscriptionGate feature="Media Gallery">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Media Gallery</h1>
            <p className="text-muted-foreground">All photos & videos from your jobs</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by customer or booking #..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="before">Before</SelectItem>
                <SelectItem value="after">After</SelectItem>
                <SelectItem value="videos">Videos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{allMedia.length} total</span>
            <span>•</span>
            <span>{photoCount} photos</span>
            <span>•</span>
            <span>{videoCount} videos</span>
            <span>•</span>
            <span>{beforeCount} before</span>
            <span>•</span>
            <span>{afterCount} after</span>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : allMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Camera className="w-12 h-12 mb-3" />
              <p className="text-lg font-medium">No media yet</p>
              <p className="text-sm mb-4">Upload photos & videos from your completed jobs</p>
              <Button onClick={openUploadEmpty} className="gap-2">
                <ImagePlus className="w-4 h-4" /> Upload Your First Photo
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Search className="w-12 h-12 mb-3" />
              <p className="text-lg font-medium">No results</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map(item => (
                <Card key={`${item.source}-${item.id}`}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => setSelectedItem(item)}>
                  <div className="aspect-square relative bg-muted">
                    <MediaThumb item={item} />
                    <Badge className={cn(
                      "absolute top-2 left-2 text-xs capitalize",
                      item.media_type === 'after' ? 'bg-green-600 hover:bg-green-700' : ''
                    )} variant={item.media_type === 'before' ? 'secondary' : 'default'}>
                      {item.media_type || 'photo'}
                    </Badge>
                    {isVideo(item.file_type) && (
                      <Badge className="absolute top-2 right-2 text-xs" variant="outline">
                        <Video className="w-3 h-3 mr-1" /> Video
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs font-medium truncate">{item.customer_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.booking_number ? `#${item.booking_number}` : '—'}
                    </p>
                    {item.created_at && (
                      <p className="text-xs text-muted-foreground">{format(new Date(item.created_at), 'MMM d, yyyy')}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Detail Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={open => !open && setSelectedItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isVideo(selectedItem?.file_type || '') ? <Video className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                {selectedItem?.media_type === 'before' ? 'Before' : 'After'} {isVideo(selectedItem?.file_type || '') ? 'Video' : 'Photo'} — Booking #{selectedItem?.booking_number}
              </DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden bg-muted">
                  {isVideo(selectedItem.file_type) ? (
                    <video
                      src={selectedItem.signedUrl || selectedItem.file_url}
                      controls
                      className="w-full max-h-[60vh]"
                    />
                  ) : selectedItem.source === 'booking_photos' ? (
                    <SignedImage src={selectedItem.file_url} bucket="booking-photos" alt="Full size"
                      className="w-full max-h-[60vh] object-contain"
                      fallback={<div className="w-full h-64 flex items-center justify-center"><ImageIcon className="w-12 h-12 text-muted-foreground" /></div>} />
                  ) : selectedItem.signedUrl ? (
                    <img src={selectedItem.signedUrl} alt="Full size" className="w-full max-h-[60vh] object-contain" />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center"><ImageIcon className="w-12 h-12 text-muted-foreground" /></div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedItem.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedItem.scheduled_at ? format(new Date(selectedItem.scheduled_at), 'EEE, MMM d, yyyy') : '—'}</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="destructive" size="sm" className="gap-2"
                    onClick={() => handleDelete(selectedItem)} disabled={deletingId === selectedItem.id}>
                    {deletingId === selectedItem.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Upload Dialog */}
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Upload Media</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Booking / Job</Label>
                <Select value={uploadBookingId} onValueChange={setUploadBookingId}>
                  <SelectTrigger><SelectValue placeholder="Select a booking..." /></SelectTrigger>
                  <SelectContent>
                    {recentBookings.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        #{b.booking_number} — {b.customer?.first_name} {b.customer?.last_name} — {format(new Date(b.scheduled_at), 'MMM d')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <div className="flex gap-2 mt-1">
                  <Button size="sm" variant={uploadMediaType === 'before' ? 'default' : 'outline'}
                    onClick={() => setUploadMediaType('before')}>Before</Button>
                  <Button size="sm" variant={uploadMediaType === 'after' ? 'default' : 'outline'}
                    onClick={() => setUploadMediaType('after')}>After</Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}>
                  <Camera className="mr-2 h-4 w-4" /> Add Photos
                </Button>
                <Button variant="outline" size="sm" onClick={() => videoInputRef.current?.click()}>
                  <Video className="mr-2 h-4 w-4" /> Add Videos
                </Button>
                <input ref={photoInputRef as any} type="file" accept="image/*" multiple hidden
                  onChange={e => { addPendingFiles(e.target.files, 'photo'); e.target.value = ''; }} />
                <input ref={videoInputRef as any} type="file" accept="video/*" multiple hidden
                  onChange={e => { addPendingFiles(e.target.files, 'video'); e.target.value = ''; }} />
              </div>
              {pendingFiles.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {pendingFiles.map(pf => (
                    <div key={pf.id} className="flex items-center justify-between text-sm bg-muted rounded px-2 py-1">
                      <span className="truncate flex-1">{pf.file.name}</span>
                      <button onClick={() => setPendingFiles(prev => prev.filter(f => f.id !== pf.id))}>
                        <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={handleUpload} disabled={uploading || !uploadBookingId || pendingFiles.length === 0} className="w-full">
                {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : `Upload ${pendingFiles.length} file(s)`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </SubscriptionGate>
    </AdminLayout>
  );
}

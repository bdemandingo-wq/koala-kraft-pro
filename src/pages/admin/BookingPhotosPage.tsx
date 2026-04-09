import { useState, useRef } from 'react';
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
  Search, Camera, Calendar, User, Loader2, Image as ImageIcon, Trash2, Upload, Video, Plus, Play,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getSignedUrl } from '@/hooks/useSignedUrl';

interface BookingPhoto {
  id: string;
  booking_id: string;
  staff_id: string | null;
  photo_url: string;
  photo_type: string | null;
  caption: string | null;
  created_at: string | null;
  booking?: {
    booking_number: number;
    scheduled_at: string;
    customer?: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
  staff?: {
    name: string;
  } | null;
}

interface JobMedia {
  id: string;
  booking_id: string;
  media_type: string;
  file_type: string;
  file_url: string;
  file_name: string;
  uploaded_at: string | null;
  notes: string | null;
  booking?: {
    booking_number: number;
    scheduled_at: string;
    customer?: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
}

type GalleryItem = {
  id: string;
  source: 'booking_photos' | 'job_media';
  url: string;
  bucket: string;
  mediaType: 'before' | 'after' | 'photo';
  fileType: 'photo' | 'video';
  caption: string | null;
  customerName: string;
  bookingNumber: number | null;
  date: string | null;
  staffName: string | null;
  signedUrl?: string;
};

export default function BookingPhotosPage() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Fetch booking_photos
  const { data: photos = [], isLoading: loadingPhotos } = useQuery({
    queryKey: ['booking-photos', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('booking_photos')
        .select(`
          *,
          booking:bookings!booking_photos_booking_id_fkey(
            booking_number,
            scheduled_at,
            customer:customers!bookings_customer_id_fkey(first_name, last_name)
          ),
          staff:staff!booking_photos_staff_id_fkey(name)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BookingPhoto[];
    },
    enabled: !!organization?.id,
  });

  // Fetch job_media
  const { data: jobMedia = [], isLoading: loadingMedia } = useQuery({
    queryKey: ['job-media-gallery', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('job_media')
        .select(`
          id, booking_id, media_type, file_type, file_url, file_name, uploaded_at, notes,
          booking:bookings!job_media_booking_id_fkey(
            booking_number,
            scheduled_at,
            customer:customers!bookings_customer_id_fkey(first_name, last_name)
          )
        `)
        .eq('organization_id', organization.id)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as JobMedia[];
    },
    enabled: !!organization?.id,
  });

  const isLoading = loadingPhotos || loadingMedia;

  // Merge both sources into a unified gallery
  const gallery: GalleryItem[] = [
    ...photos.map((p): GalleryItem => ({
      id: p.id,
      source: 'booking_photos',
      url: p.photo_url,
      bucket: 'booking-photos',
      mediaType: (p.photo_type as 'before' | 'after') || 'photo',
      fileType: 'photo',
      caption: p.caption,
      customerName: p.booking?.customer
        ? `${p.booking.customer.first_name} ${p.booking.customer.last_name}`
        : '',
      bookingNumber: p.booking?.booking_number || null,
      date: p.created_at,
      staffName: p.staff?.name || null,
    })),
    ...jobMedia.map((m): GalleryItem => ({
      id: m.id,
      source: 'job_media',
      url: m.file_url,
      bucket: m.media_type === 'before' ? 'job-before-media' : 'job-after-media',
      mediaType: m.media_type as 'before' | 'after',
      fileType: m.file_type as 'photo' | 'video',
      caption: m.notes,
      customerName: m.booking?.customer
        ? `${m.booking.customer.first_name} ${m.booking.customer.last_name}`
        : '',
      bookingNumber: m.booking?.booking_number || null,
      date: m.uploaded_at,
      staffName: null,
    })),
  ].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  const filtered = gallery.filter(item => {
    const matchesType =
      typeFilter === 'all' ||
      item.mediaType === typeFilter ||
      (typeFilter === 'video' && item.fileType === 'video');
    if (!searchTerm) return matchesType;
    const term = searchTerm.toLowerCase();
    return matchesType && (
      item.customerName.toLowerCase().includes(term) ||
      item.staffName?.toLowerCase().includes(term) ||
      item.bookingNumber?.toString().includes(term) ||
      item.caption?.toLowerCase().includes(term)
    );
  });

  const photoCount = gallery.filter(g => g.fileType === 'photo').length;
  const videoCount = gallery.filter(g => g.fileType === 'video').length;
  const beforeCount = gallery.filter(g => g.mediaType === 'before').length;
  const afterCount = gallery.filter(g => g.mediaType === 'after').length;

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm('Delete this file? This cannot be undone.')) return;
    setDeletingId(item.id);
    try {
      await supabase.storage.from(item.bucket).remove([item.url]);
      if (item.source === 'booking_photos') {
        const { error } = await supabase.from('booking_photos').delete().eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('job_media').delete().eq('id', item.id);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['booking-photos'] });
      queryClient.invalidateQueries({ queryKey: ['job-media-gallery'] });
      toast.success('Deleted');
      if (selectedItem?.id === item.id) setSelectedItem(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout
      title="Media Gallery"
      actions={
        <Button className="gap-2" onClick={() => setShowUpload(true)}>
          <Upload className="w-4 h-4" /> Upload
        </Button>
      }
    >
      <SubscriptionGate feature="Booking Photos">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Media Gallery</h1>
            <p className="text-muted-foreground">All photos & videos from your jobs</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, booking #, or caption..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Media</SelectItem>
                <SelectItem value="before">Before</SelectItem>
                <SelectItem value="after">After</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{gallery.length} total</span>
            <span>|</span>
            <span>{photoCount} photos</span>
            <span>{videoCount} videos</span>
            <span>|</span>
            <span>{beforeCount} before</span>
            <span>{afterCount} after</span>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Camera className="w-12 h-12 mb-3" />
              <p className="text-lg font-medium">No media yet</p>
              <p className="text-sm mb-4">Upload photos and videos of your work</p>
              <Button onClick={() => setShowUpload(true)} className="gap-2">
                <Upload className="w-4 h-4" /> Upload Your First Photo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map(item => (
                <GalleryCard
                  key={`${item.source}-${item.id}`}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail dialog */}
        <DetailDialog
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDelete={handleDelete}
          deletingId={deletingId}
        />

        {/* Upload dialog */}
        <UploadDialog
          open={showUpload}
          onClose={() => setShowUpload(false)}
          organizationId={organization?.id || ''}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['booking-photos'] });
            queryClient.invalidateQueries({ queryKey: ['job-media-gallery'] });
            setShowUpload(false);
          }}
        />
      </SubscriptionGate>
    </AdminLayout>
  );
}

// ----------- Gallery Card -----------
function GalleryCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  if (!signedUrl) {
    getSignedUrl(item.bucket, item.url, 3600).then(setSignedUrl);
  }

  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group" onClick={onClick}>
      <div className="aspect-square relative bg-muted">
        {item.fileType === 'video' ? (
          signedUrl ? (
            <video src={signedUrl} className="w-full h-full object-cover" preload="metadata" muted />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-8 h-8 text-muted-foreground" />
            </div>
          )
        ) : signedUrl ? (
          <img src={signedUrl} alt={item.caption || 'Job photo'} className="w-full h-full object-cover" />
        ) : item.source === 'booking_photos' ? (
          <SignedImage
            src={item.url}
            bucket="booking-photos"
            alt="Job photo"
            className="w-full h-full object-cover"
            fallback={<div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge className="text-xs capitalize" variant={item.mediaType === 'before' ? 'secondary' : 'default'}>
            {item.mediaType}
          </Badge>
          {item.fileType === 'video' && (
            <Badge className="text-xs" variant="outline">
              <Video className="w-3 h-3 mr-0.5" /> Video
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-2">
        <p className="text-xs font-medium truncate">
          {item.customerName || `Booking #${item.bookingNumber || '—'}`}
        </p>
        {item.date && (
          <p className="text-xs text-muted-foreground">
            {format(new Date(item.date), 'MMM d, yyyy')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ----------- Detail Dialog -----------
function DetailDialog({
  item,
  onClose,
  onDelete,
  deletingId,
}: {
  item: GalleryItem | null;
  onClose: () => void;
  onDelete: (item: GalleryItem) => void;
  deletingId: string | null;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  if (item && !signedUrl) {
    getSignedUrl(item.bucket, item.url, 3600).then(setSignedUrl);
  }

  // Reset URL when item changes
  if (!item && signedUrl) setSignedUrl(null);

  return (
    <Dialog open={!!item} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {item?.mediaType === 'before' ? 'Before' : item?.mediaType === 'after' ? 'After' : ''} — Booking #{item?.bookingNumber}
          </DialogTitle>
        </DialogHeader>
        {item && (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden bg-muted">
              {item.fileType === 'video' && signedUrl ? (
                <video src={signedUrl} controls className="w-full max-h-[60vh]" preload="metadata" />
              ) : signedUrl ? (
                <img src={signedUrl} alt="Full size" className="w-full max-h-[60vh] object-contain" />
              ) : item.source === 'booking_photos' ? (
                <SignedImage
                  src={item.url}
                  bucket="booking-photos"
                  alt="Full size"
                  className="w-full max-h-[60vh] object-contain"
                  fallback={<div className="w-full h-64 flex items-center justify-center"><ImageIcon className="w-12 h-12 text-muted-foreground" /></div>}
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{item.customerName || '—'}</span>
              </div>
              {item.staffName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>Technician: {item.staffName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{item.date ? format(new Date(item.date), 'MMM d, yyyy h:mm a') : '—'}</span>
              </div>
            </div>
            {item.caption && (
              <p className="text-sm text-muted-foreground italic">{item.caption}</p>
            )}
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => onDelete(item)}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ----------- Upload Dialog -----------
function UploadDialog({
  open,
  onClose,
  organizationId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: () => void;
}) {
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaType, setMediaType] = useState<'before' | 'after'>('after');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const { data: bookings = [] } = useQuery({
    queryKey: ['recent-bookings-upload', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('id, booking_number, scheduled_at, customer:customers!bookings_customer_id_fkey(first_name, last_name)')
        .eq('organization_id', organizationId)
        .order('scheduled_at', { ascending: false })
        .limit(50);
      return (data || []) as {
        id: string;
        booking_number: number;
        scheduled_at: string;
        customer: { first_name: string; last_name: string } | null;
      }[];
    },
    enabled: open && !!organizationId,
  });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setPendingFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedBookingId) {
      toast.error('Please select a job');
      return;
    }
    if (pendingFiles.length === 0) {
      toast.error('Please add at least one file');
      return;
    }

    setUploading(true);
    try {
      const bucket = mediaType === 'before' ? 'job-before-media' : 'job-after-media';

      for (const file of pendingFiles) {
        if (file.size > 100 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 100MB, skipping`);
          continue;
        }
        const isVideo = file.type.startsWith('video/');
        const ext = file.name.split('.').pop();
        const filePath = `${organizationId}/${selectedBookingId}/${mediaType}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: upErr } = await supabase.storage.from(bucket).upload(filePath, file);
        if (upErr) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        await supabase.from('job_media').insert({
          booking_id: selectedBookingId,
          organization_id: organizationId,
          media_type: mediaType,
          file_type: isVideo ? 'video' : 'photo',
          file_url: filePath,
          file_name: file.name,
        });
      }

      toast.success(`${pendingFiles.length} file(s) uploaded!`);
      setPendingFiles([]);
      setSelectedBookingId('');
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setPendingFiles([]);
    setSelectedBookingId('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" /> Upload Photos & Videos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Select Job</Label>
            <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a job..." />
              </SelectTrigger>
              <SelectContent>
                {bookings.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    #{b.booking_number} — {b.customer ? `${b.customer.first_name} ${b.customer.last_name}` : 'No customer'} — {format(new Date(b.scheduled_at), 'MMM d')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Type</Label>
            <div className="flex gap-2 mt-1">
              <Button
                variant={mediaType === 'before' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaType('before')}
              >
                Before
              </Button>
              <Button
                variant={mediaType === 'after' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaType('after')}
              >
                After
              </Button>
            </div>
          </div>

          <div>
            <Label>Files</Label>
            <div className="flex gap-2 mt-1">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => photoRef.current?.click()}>
                <Camera className="w-3.5 h-3.5" /> Photos
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => videoRef.current?.click()}>
                <Video className="w-3.5 h-3.5" /> Videos
              </Button>
              <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
              <input ref={videoRef} type="file" accept="video/*" multiple className="hidden" onChange={handleFiles} />
            </div>
          </div>

          {pendingFiles.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {pendingFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-muted rounded px-3 py-1.5">
                  <span className="truncate flex-1">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="ml-2 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button className="w-full gap-2" onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="w-4 h-4" /> Upload {pendingFiles.length} File{pendingFiles.length !== 1 ? 's' : ''}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

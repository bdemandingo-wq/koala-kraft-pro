import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Camera, Video, Trash2, Download, Loader2, ImageIcon, Play, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getSignedUrl } from '@/hooks/useSignedUrl';
import { format } from 'date-fns';

interface JobMediaSectionProps {
  bookingId: string;
  organizationId: string;
  staffId?: string;
  isStaffView?: boolean;
}

interface MediaItem {
  id: string;
  booking_id: string;
  organization_id: string;
  media_type: 'before' | 'after';
  file_type: 'photo' | 'video';
  file_url: string;
  file_name: string;
  uploaded_by: string | null;
  uploaded_at: string;
  notes: string | null;
  damage_notes: string | null;
  customer_acknowledged: boolean;
}

function MediaColumn({
  type,
  items,
  bookingId,
  organizationId,
  staffId,
  isStaffView,
  onRefresh,
}: {
  type: 'before' | 'after';
  items: MediaItem[];
  bookingId: string;
  organizationId: string;
  staffId?: string;
  isStaffView?: boolean;
  onRefresh: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [damageNotes, setDamageNotes] = useState('');
  const [showDamagePrompt, setShowDamagePrompt] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const bucket = type === 'before' ? 'job-before-media' : 'job-after-media';
  const photos = items.filter(i => i.file_type === 'photo');
  const videos = items.filter(i => i.file_type === 'video');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'photo' | 'video') => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // For "before" media with no existing items, show damage prompt
    if (type === 'before' && items.length === 0 && fileType === 'photo') {
      setPendingFiles(files);
      setShowDamagePrompt(true);
      return;
    }

    await uploadFiles(files, fileType);
  };

  const uploadFiles = async (files: File[], fileType?: 'photo' | 'video') => {
    setUploading(true);
    try {
      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const detectedType = fileType || (isVideo ? 'video' : 'photo');

        if (file.size > 100 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 100MB limit`);
          continue;
        }

        const ext = file.name.split('.').pop();
        const filePath = `${organizationId}/${bookingId}/${type}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { error: dbError } = await supabase.from('job_media').insert({
          booking_id: bookingId,
          organization_id: organizationId,
          media_type: type,
          file_type: detectedType,
          file_url: filePath,
          file_name: file.name,
          uploaded_by: staffId || null,
          damage_notes: type === 'before' && damageNotes ? damageNotes : null,
        });

        if (dbError) {
          console.error('DB error:', dbError);
          toast.error(`Failed to save ${file.name}`);
        }
      }
      toast.success(`${type === 'before' ? 'Before' : 'After'} media uploaded!`);
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setDamageNotes('');
    }
  };

  const handleDamagePromptComplete = async () => {
    setShowDamagePrompt(false);
    await uploadFiles(pendingFiles, 'photo');
    setPendingFiles([]);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await supabase.storage.from(bucket).remove([deleteTarget.file_url]);
      await supabase.from('job_media').delete().eq('id', deleteTarget.id);
      toast.success('Media deleted');
      onRefresh();
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDownload = async (item: MediaItem) => {
    const url = await getSignedUrl(bucket, item.file_url, 300);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = item.file_name;
      a.click();
    }
  };

  const handleUpdateNotes = async (item: MediaItem, notes: string) => {
    await supabase.from('job_media').update({ notes }).eq('id', item.id);
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          {type === 'before' ? '📷 Before' : '✅ After'}
          <Badge variant="secondary" className="text-xs">
            {photos.length} Photo{photos.length !== 1 ? 's' : ''} · {videos.length} Video{videos.length !== 1 ? 's' : ''}
          </Badge>
        </h4>
      </div>

      {/* Upload buttons */}
      <div className="flex gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 flex-1"
          onClick={() => photoRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          Add Photo
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 flex-1"
          onClick={() => videoRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
          Add Video
        </Button>
        <input
          ref={photoRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'photo')}
        />
        <input
          ref={videoRef}
          type="file"
          accept="video/mp4,video/mov,video/webm"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'video')}
        />
      </div>

      {/* Media grid */}
      {items.length === 0 ? (
        <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center text-muted-foreground text-sm">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No {type} media yet
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map(item => (
            <MediaThumbnail
              key={item.id}
              item={item}
              bucket={bucket}
              onDelete={() => setDeleteTarget(item)}
              onDownload={() => handleDownload(item)}
              onUpdateNotes={(notes) => handleUpdateNotes(item, notes)}
            />
          ))}
        </div>
      )}

      {/* Damage prompt dialog */}
      <AlertDialog open={showDamagePrompt} onOpenChange={setShowDamagePrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Pre-Job Condition Report
            </AlertDialogTitle>
            <AlertDialogDescription>
              Document any existing damage before starting. Note scratches, dents, stains, or other issues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={damageNotes}
            onChange={(e) => setDamageNotes(e.target.value)}
            placeholder="Describe any existing damage (scratches, dents, stains)..."
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingFiles([]); setDamageNotes(''); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDamagePromptComplete}>
              Continue Upload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete media?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this file.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MediaThumbnail({
  item,
  bucket,
  onDelete,
  onDownload,
  onUpdateNotes,
}: {
  item: MediaItem;
  bucket: string;
  onDelete: () => void;
  onDownload: () => void;
  onUpdateNotes: (notes: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(item.notes || '');

  useState(() => {
    getSignedUrl(bucket, item.file_url, 3600).then(setUrl);
  });

  const saveNotes = () => {
    onUpdateNotes(localNotes);
    setEditingNotes(false);
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="relative aspect-video bg-muted">
        {item.file_type === 'video' ? (
          url ? (
            <video src={url} controls className="w-full h-full object-cover" preload="metadata" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-8 h-8 text-muted-foreground" />
            </div>
          )
        ) : (
          url ? (
            <img src={url} alt={item.file_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          )
        )}
        {item.damage_notes && (
          <Badge className="absolute top-1 left-1 bg-amber-500 text-white text-[10px]">
            <AlertTriangle className="w-3 h-3 mr-0.5" />
            Damage noted
          </Badge>
        )}
      </div>
      <div className="p-2 space-y-1">
        <div className="text-[10px] text-muted-foreground">
          {item.uploaded_at ? format(new Date(item.uploaded_at), 'MMM d, h:mm a') : ''}
        </div>
        {editingNotes ? (
          <div className="flex gap-1">
            <Input
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              className="h-6 text-xs"
              placeholder="Add caption..."
              onKeyDown={(e) => e.key === 'Enter' && saveNotes()}
            />
            <Button size="sm" className="h-6 text-xs px-2" onClick={saveNotes}>Save</Button>
          </div>
        ) : (
          <p
            className="text-xs text-muted-foreground cursor-pointer hover:text-foreground truncate"
            onClick={() => setEditingNotes(true)}
          >
            {item.notes || 'Add caption...'}
          </p>
        )}
        {item.damage_notes && (
          <p className="text-[10px] text-amber-600 italic">{item.damage_notes}</p>
        )}
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDownload}>
            <Download className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={onDelete}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function JobMediaSection({ bookingId, organizationId, staffId, isStaffView }: JobMediaSectionProps) {
  const queryClient = useQueryClient();

  const { data: media = [], isLoading } = useQuery({
    queryKey: ['job-media', bookingId, organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_media')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('organization_id', organizationId)
        .order('uploaded_at', { ascending: true });
      if (error) throw error;
      return data as MediaItem[];
    },
    enabled: !!bookingId && !!organizationId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['job-media', bookingId] });

  const beforeItems = media.filter(m => m.media_type === 'before');
  const afterItems = media.filter(m => m.media_type === 'after');
  const hasCustomerAck = beforeItems.some(m => m.customer_acknowledged);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Before & After Media
          {hasCustomerAck && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <CheckCircle className="w-3 h-3 text-green-600" />
              Customer Acknowledged
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            <MediaColumn
              type="before"
              items={beforeItems}
              bookingId={bookingId}
              organizationId={organizationId}
              staffId={staffId}
              isStaffView={isStaffView}
              onRefresh={refresh}
            />
            <div className="hidden sm:flex items-center text-muted-foreground text-2xl">→</div>
            <MediaColumn
              type="after"
              items={afterItems}
              bookingId={bookingId}
              organizationId={organizationId}
              staffId={staffId}
              isStaffView={isStaffView}
              onRefresh={refresh}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, HelpCircle, Mail, Plus, Pencil, Trash2, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

interface HelpVideo {
  id: string;
  title: string;
  description: string | null;
  loom_url: string;
  sort_order: number;
  created_at: string;
  organization_id: string | null;
}

interface VideoFormData {
  title: string;
  description: string;
  loom_url: string;
}

const emptyFormData: VideoFormData = {
  title: '',
  description: '',
  loom_url: '',
};

export default function HelpPage() {
  const { organization } = useOrganization();
  const [videos, setVideos] = useState<HelpVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<HelpVideo | null>(null);
  const [formData, setFormData] = useState<VideoFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<HelpVideo | null>(null);

  useEffect(() => {
    if (organization?.id) {
      fetchVideos();
    }
  }, [organization?.id]);

  const fetchVideos = async () => {
    if (!organization?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('help_videos')
        .select('*')
        .eq('organization_id', organization.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load help videos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingVideo(null);
    setFormData(emptyFormData);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (video: HelpVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      loom_url: video.loom_url,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.loom_url.trim()) {
      toast.error('Title and Loom URL are required');
      return;
    }

    // Convert share URL to embed URL if needed
    let embedUrl = formData.loom_url.trim();
    if (embedUrl.includes('loom.com/share/')) {
      embedUrl = embedUrl.replace('loom.com/share/', 'loom.com/embed/');
    }

    setSaving(true);
    try {
      if (editingVideo) {
        const { error } = await supabase
          .from('help_videos')
          .update({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            loom_url: embedUrl,
          })
          .eq('id', editingVideo.id);

        if (error) throw error;
        toast.success('Video updated successfully');
      } else {
        const maxSortOrder = videos.length > 0 
          ? Math.max(...videos.map(v => v.sort_order || 0)) 
          : 0;

        const { error } = await supabase
          .from('help_videos')
          .insert({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            loom_url: embedUrl,
            organization_id: organization?.id,
            sort_order: maxSortOrder + 1,
          });

        if (error) throw error;
        toast.success('Video added successfully');
      }

      setDialogOpen(false);
      fetchVideos();
    } catch (error: any) {
      console.error('Error saving video:', error);
      toast.error(error.message || 'Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (video: HelpVideo) => {
    setVideoToDelete(video);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;

    try {
      const { error } = await supabase
        .from('help_videos')
        .delete()
        .eq('id', videoToDelete.id);

      if (error) throw error;
      toast.success('Video deleted successfully');
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
      fetchVideos();
    } catch (error: any) {
      console.error('Error deleting video:', error);
      toast.error(error.message || 'Failed to delete video');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Help Center" subtitle="Tutorial videos and support">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Help Center"
      subtitle="Tutorial videos and support"
    >
      <div className="space-y-8">
        {/* Videos Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Tutorial Videos</h2>
            <Button onClick={handleOpenAddDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Video
            </Button>
          </div>
          
          {videos.length === 0 ? (
            <Card className="py-16">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Help Videos Yet</h3>
                <p className="text-muted-foreground max-w-md mb-4">
                  Add Loom tutorial videos to help your team learn how to use the system.
                </p>
                <Button onClick={handleOpenAddDialog} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Video
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden group">
                  <div className="aspect-video bg-muted relative">
                    <iframe
                      src={video.loom_url}
                      frameBorder="0"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{video.title}</h3>
                        {video.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {video.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEditDialog(video)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(video)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Contact Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Need help or have questions? Reach out to us directly.
            </p>
            <a 
              href="mailto:support@jointidywise.com" 
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <Mail className="w-4 h-4" />
              support@jointidywise.com
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Video Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVideo ? 'Edit Video' : 'Add Tutorial Video'}
            </DialogTitle>
            <DialogDescription>
              Add a Loom video to help your team learn how to use the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., How to Create a Booking"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loom_url">Loom URL *</Label>
              <Input
                id="loom_url"
                placeholder="https://www.loom.com/share/..."
                value={formData.loom_url}
                onChange={(e) => setFormData({ ...formData, loom_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Paste the Loom share link (it will be converted to embed format automatically)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this video covers..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingVideo ? 'Save Changes' : 'Add Video'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Video</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{videoToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

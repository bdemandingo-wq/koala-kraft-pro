import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, FileText, Upload, Trash2, Loader2, CheckCircle2, Clock, PenLine, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgId } from '@/hooks/useOrgId';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface SignableDoc {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  is_active: boolean;
  created_at: string;
}

export function AdminSignableDocManager() {
  const { organizationId } = useOrgId();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['admin-signable-docs', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_signable_documents')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SignableDoc[];
    },
    enabled: !!organizationId,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !organizationId) return;
    if (!title.trim()) {
      toast.error('Please enter a document title');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const safeName = `${Date.now()}.${ext}`;
      const path = `signable/${organizationId}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('staff-documents')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('staff_signable_documents').insert({
        organization_id: organizationId,
        title: title.trim(),
        description: description.trim() || null,
        file_path: path,
        file_name: file.name,
        created_by: user.id,
      });
      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ['admin-signable-docs', organizationId] });
      toast.success('Signable document uploaded');
      setTitle('');
      setDescription('');
      setShowForm(false);
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('staff_signable_documents')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-signable-docs', organizationId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: SignableDoc) => {
      await supabase.storage.from('staff-documents').remove([doc.file_path]);
      const { error } = await supabase.from('staff_signable_documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-signable-docs', organizationId] });
      toast.success('Document removed');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  const handlePreview = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('staff-documents')
      .download(filePath);
    if (error || !data) {
      toast.error('Failed to preview');
      return;
    }
    const url = URL.createObjectURL(data);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <PenLine className="w-4 h-4" />
          Signable Documents
        </Label>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5" />
          Add Document
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-3 space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Document Title *</Label>
            <Input
              placeholder="e.g. Independent Contractor Agreement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              placeholder="Brief description of what this document is..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={handleUpload}
            disabled={uploading}
          />
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="gap-1"
              disabled={uploading || !title.trim()}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setTitle(''); setDescription(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        </div>
      ) : docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No signable documents yet. Upload contracts or agreements for staff to sign.
        </p>
      ) : (
        docs.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-3 flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.title}</p>
              <p className="text-xs text-muted-foreground">
                {doc.file_name} · {format(new Date(doc.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <Switch
              checked={doc.is_active}
              onCheckedChange={(checked) => toggleMutation.mutate({ id: doc.id, isActive: checked })}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePreview(doc.file_path)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => deleteMutation.mutate(doc)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}
    </div>
  );
}

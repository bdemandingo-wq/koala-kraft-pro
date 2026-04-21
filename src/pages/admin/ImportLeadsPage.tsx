import { useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const TEMPLATE_COLUMNS = ['first_name', 'last_name', 'email', 'phone', 'service_interest', 'notes', 'source'];

function downloadTemplate() {
  const csv = TEMPLATE_COLUMNS.join(',') + '\nJohn,Doe,john@example.com,555-123-4567,Full Detail,Interested in ceramic coating,facebook\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leads_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

interface ParsedLead {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  service_interest: string;
  notes: string;
  source: string;
}

function parseCSV(text: string): ParsedLead[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  return lines.slice(1).map(line => {
    // Simple CSV parse (handles basic cases)
    const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row: any = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return {
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      email: row.email || '',
      phone: row.phone || '',
      service_interest: row.service_interest || '',
      notes: row.notes || '',
      source: row.source || '',
    };
  }).filter(r => r.email); // skip rows without email
}

export default function ImportLeadsPage() {
  const { organization } = useOrganization();
  const [leads, setLeads] = useState<ParsedLead[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error('No valid rows found in CSV');
        return;
      }
      setLeads(parsed);
      toast.success(`Parsed ${parsed.length} leads from CSV`);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    if (!organization?.id) {
      toast.error('No organization selected');
      return;
    }
    setImporting(true);
    try {
      // Fetch existing emails for deduplication
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('email')
        .eq('organization_id', organization.id);

      const existingEmails = new Set(
        (existingLeads || []).map(l => l.email?.toLowerCase())
      );

      const toInsert = leads
        .filter(l => !existingEmails.has(l.email.toLowerCase()))
        .map(l => ({
          name: `${l.first_name} ${l.last_name}`.trim() || l.email,
          email: l.email.toLowerCase(),
          phone: l.phone || null,
          service_interest: l.service_interest || null,
          notes: l.notes || null,
          source: l.source || 'facebook',
          status: 'new',
          organization_id: organization.id,
        }));

      const skipped = leads.length - toInsert.length;

      if (toInsert.length > 0) {
        // Insert in batches of 100
        for (let i = 0; i < toInsert.length; i += 100) {
          const batch = toInsert.slice(i, i + 100);
          const { error } = await supabase.from('leads').insert(batch);
          if (error) throw error;
        }
      }

      toast.success(`Imported ${toInsert.length} leads${skipped > 0 ? `, skipped ${skipped} duplicates` : ''}`);
      setLeads([]);
      setFileName('');
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminLayout title="Import Leads">
      <div className="space-y-6 max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Import Leads from CSV</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Upload a CSV file to bulk import leads into your CRM
            </p>
          </div>
          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>

        {/* Upload Area */}
        <Card>
          <CardContent className="pt-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFile(file);
                };
                input.click();
              }}
            >
              {fileName ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="h-10 w-10 text-primary" />
                  <p className="font-medium">{fileName}</p>
                  <p className="text-sm text-muted-foreground">{leads.length} leads ready to import</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">Drop your CSV file here or click to upload</p>
                  <p className="text-sm text-muted-foreground">Columns: first_name, last_name, email, phone, service_interest, notes, source</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {leads.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Preview (first {Math.min(5, leads.length)} of {leads.length} rows)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.slice(0, 5).map((lead, i) => (
                      <TableRow key={i}>
                        <TableCell>{`${lead.first_name} ${lead.last_name}`.trim()}</TableCell>
                        <TableCell className="text-xs">{lead.email}</TableCell>
                        <TableCell>{lead.phone}</TableCell>
                        <TableCell>{lead.service_interest}</TableCell>
                        <TableCell>{lead.source || 'facebook'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleImport} disabled={importing} className="gap-2">
                  {importing ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Import {leads.length} Lead{leads.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

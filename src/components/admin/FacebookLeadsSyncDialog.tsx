import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

interface FacebookLeadsSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

interface FBLead {
  name: string;
  email: string;
  phone: string;
  form_name: string;
  created_time: string;
  ad_name: string;
  facebook_lead_id: string;
}

export function FacebookLeadsSyncDialog({ open, onOpenChange, organizationId }: FacebookLeadsSyncDialogProps) {
  const [step, setStep] = useState<'connect' | 'preview' | 'importing' | 'done'>('connect');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 90), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fetching, setFetching] = useState(false);
  const [fbLeads, setFbLeads] = useState<FBLead[]>([]);
  const [skipExisting, setSkipExisting] = useState(true);
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['business-settings-fb', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('business_settings')
        .select('facebook_page_id')
        .eq('organization_id', organizationId)
        .maybeSingle();
      return data;
    },
    enabled: !!organizationId && open,
  });

  const hasPageId = !!settings?.facebook_page_id;

  const newLeads = useMemo(() => {
    if (!skipExisting) return fbLeads;
    return fbLeads.filter(l => l.email && !existingEmails.has(l.email.toLowerCase()));
  }, [fbLeads, skipExisting, existingEmails]);

  const alreadyInCRM = fbLeads.length - newLeads.length;

  const handleFetchLeads = async () => {
    setFetching(true);
    try {
      // Fetch existing lead emails for dedup
      const { data: existing } = await supabase
        .from('leads')
        .select('email')
        .eq('organization_id', organizationId)
        .not('email', 'is', null);
      
      const emails = new Set((existing || []).map((l: any) => l.email?.toLowerCase()).filter(Boolean));
      setExistingEmails(emails);

      const { data, error } = await supabase.functions.invoke('facebook-fetch-leads', {
        body: { organization_id: organizationId, date_from: dateFrom, date_to: dateTo },
      });

      if (error) throw new Error(error.message || 'Failed to fetch leads');
      if (data?.error) throw new Error(data.error);

      setFbLeads(data.leads || []);
      setStep('preview');
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch Facebook leads');
    } finally {
      setFetching(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setStep('importing');
    let count = 0;

    try {
      const leadsToImport = newLeads;
      const batchSize = 50;

      for (let i = 0; i < leadsToImport.length; i += batchSize) {
        const batch = leadsToImport.slice(i, i + batchSize).map(lead => {
          const nameParts = lead.name.split(' ');
          const firstName = nameParts[0] || 'Facebook';
          const lastName = nameParts.slice(1).join(' ') || 'Lead';
          return {
            name: lead.name,
            first_name: firstName,
            last_name: lastName,
            email: lead.email || null,
            phone: lead.phone || null,
            source: 'facebook',
            status: 'new',
            service_interest: lead.form_name || null,
            notes: `Imported from Facebook Ad: ${lead.ad_name}\nOriginal date: ${lead.created_time ? format(new Date(lead.created_time), 'PPP') : 'Unknown'}`,
            organization_id: organizationId,
          };
        });

        const { error } = await supabase.from('leads').insert(batch);
        if (error) {
          console.error('Batch insert error:', error);
        } else {
          count += batch.length;
        }
        setImportedCount(count);
      }

      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Imported ${count} new leads from Facebook`);
      setStep('done');
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => {
      setStep('connect');
      setFbLeads([]);
      setImportedCount(0);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Facebook Ad Leads</DialogTitle>
        </DialogHeader>

        {step === 'connect' && (
          <div className="space-y-4">
            {!hasPageId ? (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Facebook Page ID not configured</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Go to <strong>Settings → Facebook</strong> tab to configure your Facebook Page ID first.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">Connected to Page ID: <code className="bg-background px-1 rounded">{settings?.facebook_page_id}</code></span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div>
                <Label>To</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </div>

            <Button onClick={handleFetchLeads} disabled={!hasPageId || fetching} className="w-full">
              {fetching && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Fetch Leads
            </Button>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">Found {fbLeads.length} leads from Facebook</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-green-600 font-medium">{newLeads.length} new</span>
                <span>•</span>
                <span>{alreadyInCRM} already in CRM</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="skip-existing"
                checked={skipExisting}
                onCheckedChange={(v) => setSkipExisting(!!v)}
              />
              <Label htmlFor="skip-existing" className="text-sm">Skip leads already in CRM</Label>
            </div>

            {fbLeads.length > 0 ? (
              <div className="border rounded-md max-h-[40vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Form/Campaign</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fbLeads.map((lead, i) => {
                      const isExisting = lead.email && existingEmails.has(lead.email.toLowerCase());
                      return (
                        <TableRow key={i} className={skipExisting && isExisting ? 'opacity-40' : ''}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell className="text-sm">{lead.email || '—'}</TableCell>
                          <TableCell className="text-sm">{lead.phone || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{lead.form_name}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {lead.created_time ? format(new Date(lead.created_time), 'MMM d, yyyy') : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No leads found in the selected date range.</p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('connect')}>Back</Button>
              <Button onClick={handleImport} disabled={newLeads.length === 0}>
                Import {newLeads.length} New Leads
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center py-8 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Importing leads... {importedCount} of {newLeads.length}</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center py-8 gap-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="font-medium text-lg">Import Complete</p>
            <p className="text-muted-foreground">Successfully imported {importedCount} leads from Facebook</p>
            <Button onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

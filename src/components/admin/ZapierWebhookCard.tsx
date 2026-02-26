import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Zap, Save, Loader2, ExternalLink, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ZapierWebhookCardProps {
  organizationId: string | null;
}

export function ZapierWebhookCard({ organizationId }: ZapierWebhookCardProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!organizationId) return;
    fetchWebhookUrl();
  }, [organizationId]);

  const fetchWebhookUrl = async () => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('zapier_webhook_url')
        .eq('organization_id', organizationId!)
        .maybeSingle();

      if (error) throw error;
      setWebhookUrl((data as any)?.zapier_webhook_url || '');
    } catch (err) {
      console.error('Error fetching Zapier webhook URL:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organizationId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_settings')
        .update({ zapier_webhook_url: webhookUrl || null } as any)
        .eq('organization_id', organizationId);

      if (error) throw error;
      toast.success('Zapier webhook URL saved');
    } catch (err) {
      console.error('Error saving Zapier webhook URL:', err);
      toast.error('Failed to save webhook URL');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!webhookUrl) {
      toast.error('Enter a webhook URL first');
      return;
    }
    setTesting(true);
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          event: 'test',
          organization_id: organizationId,
          timestamp: new Date().toISOString(),
          data: { message: 'Test event from TidyWise' },
        }),
      });
      toast.success('Test event sent — check your Zap history to confirm it was received');
    } catch (err) {
      console.error('Error testing webhook:', err);
      toast.error('Failed to send test event');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Zapier Integration
        </CardTitle>
        <CardDescription>
          Connect your account to Zapier to automate workflows. Key events (new booking, completed job, new customer) will be sent to your webhook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="zapier-webhook-url">Zapier Webhook URL</Label>
          <Input
            id="zapier-webhook-url"
            placeholder="https://hooks.zapier.com/hooks/catch/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Create a Zap with a "Webhooks by Zapier" trigger, then paste the webhook URL here.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing || !webhookUrl} className="gap-2">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Test Event
          </Button>
          <Button variant="ghost" asChild className="gap-2">
            <a href="https://zapier.com/app/zaps" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              Open Zapier
            </a>
          </Button>
        </div>

        <div className="rounded-lg border p-4 bg-muted/50">
          <p className="text-sm font-medium mb-2">Events sent to your webhook:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>new_booking</strong> — When a new booking is created</li>
            <li>• <strong>booking_completed</strong> — When a job is marked completed</li>
            <li>• <strong>new_customer</strong> — When a new customer is added</li>
            <li>• <strong>payment_received</strong> — When a payment is captured</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

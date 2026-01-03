import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Copy, Code, ExternalLink, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BookingFormShareCardProps {
  organizationSlug?: string | null;
}

export function BookingFormShareCard({ organizationSlug }: BookingFormShareCardProps) {
  const [copied, setCopied] = useState<'link' | 'embed' | null>(null);
  
  // Generate the public booking form URL
  const baseUrl = window.location.origin;
  const bookingUrl = organizationSlug 
    ? `${baseUrl}/book/${organizationSlug}`
    : `${baseUrl}/book`;
  
  // Generate embed code
  const embedCode = `<iframe 
  src="${bookingUrl}" 
  width="100%" 
  height="800" 
  frameborder="0" 
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"
  title="Book an Appointment"
></iframe>`;

  const copyToClipboard = async (text: string, type: 'link' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(type === 'link' ? 'Link copied!' : 'Embed code copied!');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const openBookingForm = () => {
    window.open(bookingUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Share Booking Form
        </CardTitle>
        <CardDescription>
          Share your booking form with customers or embed it on your website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Direct Link */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Direct Link
          </Label>
          <p className="text-sm text-muted-foreground">
            Share this link with customers so they can book directly
          </p>
          <div className="flex gap-2">
            <Input 
              value={bookingUrl} 
              readOnly 
              className="font-mono text-sm"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => copyToClipboard(bookingUrl, 'link')}
            >
              {copied === 'link' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={openBookingForm}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        {/* Embed Code */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Embed Code
          </Label>
          <p className="text-sm text-muted-foreground">
            Add this code to your website to embed the booking form
          </p>
          <div className="relative">
            <Textarea 
              value={embedCode} 
              readOnly 
              className="font-mono text-xs h-32 resize-none"
            />
            <Button 
              variant="secondary" 
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(embedCode, 'embed')}
            >
              {copied === 'embed' ? (
                <><Check className="w-4 h-4 mr-1 text-green-500" /> Copied</>
              ) : (
                <><Copy className="w-4 h-4 mr-1" /> Copy Code</>
              )}
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">Tips for sharing:</p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Add the direct link to your social media bios</li>
            <li>Include it in your email signature</li>
            <li>Share on Google Business Profile</li>
            <li>Embed on your website's contact or booking page</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Trial Expired Banner - iOS App Store Compliant
 * 
 * Shows a message directing users to the website for subscription management
 * NO prices, NO payment buttons - just a link to the website
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ExternalLink } from 'lucide-react';
import { usePlatform } from '@/hooks/usePlatform';

interface TrialExpiredBannerProps {
  onManageOnWeb?: () => void;
}

export function TrialExpiredBanner({ onManageOnWeb }: TrialExpiredBannerProps) {
  const { billingUrl } = usePlatform();

  const handleManageSubscription = () => {
    if (onManageOnWeb) {
      onManageOnWeb();
    } else {
      window.open(billingUrl, '_blank');
    }
  };

  return (
    <Card className="border-warning border-2 bg-warning/5">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="p-4 rounded-full bg-warning/10 mb-4">
          <Clock className="h-8 w-8 text-warning" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Your Trial Has Ended</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          Manage your subscription at jointidywise.lovable.app to continue using all features.
        </p>
        <Button onClick={handleManageSubscription} variant="outline" className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Manage Subscription on Web
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Open jointidywise.lovable.app/dashboard/subscription in your browser
        </p>
      </CardContent>
    </Card>
  );
}

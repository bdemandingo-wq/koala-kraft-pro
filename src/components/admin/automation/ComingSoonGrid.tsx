import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PhoneMissed, CreditCard, Sparkles, BarChart3, Star } from 'lucide-react';

const comingSoonAutomations = [
  { icon: PhoneMissed, name: 'Post-Call Follow Up', description: 'Sends SMS after missed OpenPhone call', color: 'text-red-500' },
  { icon: CreditCard, name: 'Card Expiry Alert', description: 'Warns client when saved card is about to expire', color: 'text-amber-500' },
  { icon: Sparkles, name: 'Seasonal Promo Sender', description: 'Auto-sends campaign on holidays and seasonal events', color: 'text-purple-500' },
  { icon: BarChart3, name: 'Weekly Business Summary', description: 'Sends you a weekly SMS/email digest of your business stats', color: 'text-blue-500' },
  { icon: Star, name: 'Loyalty Milestone', description: 'Triggers when client hits 5/10/20 bookings — sends reward message', color: 'text-yellow-500' },
];

export function ComingSoonGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {comingSoonAutomations.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.name} className="opacity-70">
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-muted shrink-0 ${item.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-foreground">{item.name}</p>
                  <Badge variant="secondary" className="text-[10px] shrink-0">Coming Soon</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { LucideIcon } from 'lucide-react';

interface ActiveAutomationRowProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  isEnabled: boolean;
  lastFiredAt: string | null;
  fireCount: number;
  onToggle: (id: string, enabled: boolean) => void;
  children?: React.ReactNode;
}

export function ActiveAutomationRow({
  id, name, description, icon: Icon, iconColor, isEnabled,
  lastFiredAt, fireCount, onToggle, children,
}: ActiveAutomationRowProps) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg bg-muted shrink-0 ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-[10px] font-normal">
                Last fired: {lastFiredAt ? format(new Date(lastFiredAt), 'MMM d, yyyy') : 'Never'}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-normal">
                Fired {fireCount}x total
              </Badge>
            </div>
          </div>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={(checked) => onToggle(id, checked)}
          className="shrink-0"
        />
      </div>
      {children}
    </div>
  );
}

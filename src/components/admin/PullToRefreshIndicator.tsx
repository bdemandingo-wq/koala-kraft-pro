import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  refreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({ pullDistance, refreshing, threshold = 64 }: PullToRefreshIndicatorProps) {
  if (pullDistance <= 0 && !refreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all"
      style={{ height: refreshing ? 40 : pullDistance }}
    >
      {refreshing ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <ArrowDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            progress >= 1 && "text-primary rotate-180"
          )}
        />
      )}
    </div>
  );
}

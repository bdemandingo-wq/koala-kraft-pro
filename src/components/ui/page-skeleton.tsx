import { cn } from "@/lib/utils";

interface PageSkeletonProps {
  /** Number of stat cards to show */
  statCards?: number;
  /** Show a table skeleton */
  showTable?: boolean;
  /** Number of table rows */
  tableRows?: number;
  /** Custom className */
  className?: string;
}

export function PageSkeleton({ 
  statCards = 4, 
  showTable = true, 
  tableRows = 5,
  className 
}: PageSkeletonProps) {
  return (
    <div className={cn("space-y-6 animate-fade-in", className)}>
      {/* Stat Cards */}
      {statCards > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: statCards }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "stat-card p-6 animate-stagger-in",
                `stagger-${Math.min(i + 1, 6)}`
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="skeleton-shimmer h-4 w-24 rounded" />
                <div className="skeleton-shimmer h-8 w-8 rounded-lg" />
              </div>
              <div className="skeleton-shimmer h-8 w-32 rounded mb-2" />
              <div className="skeleton-shimmer h-3 w-20 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Table Skeleton */}
      {showTable && (
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden animate-stagger-in stagger-5">
          {/* Table Header */}
          <div className="border-b border-border px-6 py-4 flex gap-4">
            <div className="skeleton-shimmer h-4 w-32 rounded" />
            <div className="skeleton-shimmer h-4 w-24 rounded" />
            <div className="skeleton-shimmer h-4 w-28 rounded" />
            <div className="flex-1" />
            <div className="skeleton-shimmer h-4 w-16 rounded" />
          </div>
          
          {/* Table Rows */}
          {Array.from({ length: tableRows }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "px-6 py-4 flex items-center gap-4 border-b border-border/50 last:border-0",
              )}
              style={{ animationDelay: `${0.3 + i * 0.05}s` }}
            >
              <div className="skeleton-shimmer h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton-shimmer h-4 w-40 rounded" />
                <div className="skeleton-shimmer h-3 w-24 rounded" />
              </div>
              <div className="skeleton-shimmer h-6 w-20 rounded-full" />
              <div className="skeleton-shimmer h-8 w-8 rounded" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={cn("stat-card p-6", className)}>
      <div className="flex justify-between items-start mb-4">
        <div className="skeleton-shimmer h-4 w-24 rounded" />
        <div className="skeleton-shimmer h-8 w-8 rounded-lg" />
      </div>
      <div className="skeleton-shimmer h-8 w-32 rounded mb-2" />
      <div className="skeleton-shimmer h-3 w-20 rounded" />
    </div>
  );
}

interface TableRowSkeletonProps {
  columns?: number;
}

export function TableRowSkeleton({ columns = 4 }: TableRowSkeletonProps) {
  return (
    <div className="px-6 py-4 flex items-center gap-4 border-b border-border/50">
      <div className="skeleton-shimmer h-10 w-10 rounded-full flex-shrink-0" />
      {Array.from({ length: columns - 1 }).map((_, i) => (
        <div key={i} className="flex-1">
          <div className="skeleton-shimmer h-4 w-full max-w-32 rounded" />
        </div>
      ))}
    </div>
  );
}

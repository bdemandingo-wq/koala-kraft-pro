// Package duration estimates (in minutes)
export const PACKAGE_DURATIONS: Record<string, number> = {
  'Express Detail': 60,
  'Full Detail': 150,
  'Premium Detail': 240,
  'Maintenance Plan': 90,
};

// Lookup by service name (case-insensitive partial match)
export function getPackageDuration(serviceName: string | null | undefined): number | null {
  if (!serviceName) return null;
  const lower = serviceName.toLowerCase();
  for (const [key, val] of Object.entries(PACKAGE_DURATIONS)) {
    if (lower.includes(key.toLowerCase().split(' ')[0])) return val;
  }
  return null;
}

// Format duration as "Xh Ym"
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Format duration as time range "10:00 AM → 12:30 PM"
export function formatTimeRange(startIso: string, durationMinutes: number): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${fmt(start)} → ${fmt(end)}`;
}

// Checklists per package
export const PACKAGE_CHECKLISTS: Record<string, string[]> = {
  'Express Detail': [
    'Hand wash complete',
    'Quick vacuum done',
    'Light wipe down complete',
    'Air freshener applied',
    'Windows cleaned',
    'Tires dressed',
    'Final inspection done',
  ],
  'Full Detail': [
    'Deep interior clean complete',
    'Steam & shampoo done',
    'Exterior wash complete',
    'Protection applied',
    'Door jambs cleaned',
    'Windows streak-free',
    'Tires dressed',
    'Dashboard & console detailed',
    'Cup holders & crevices cleaned',
    'Final inspection done',
  ],
  'Premium Detail': [
    'Clay bar treatment complete',
    'Ceramic sealant applied',
    'Stain & odor removal done',
    'Leather conditioning complete',
    'Full interior deep clean',
    'Exterior wash & decontamination',
    'Paint correction complete',
    'All glass cleaned',
    'Engine bay wipe-down',
    'Final inspection done',
  ],
  'Maintenance Plan': [
    'Exterior wash complete',
    'Interior vacuum done',
    'Dashboard wipe-down',
    'Windows cleaned',
    'Tires dressed',
    'Air freshener applied',
    'Final inspection done',
  ],
};

// Get checklist for a service name (fuzzy match)
export function getPackageChecklist(serviceName: string | null | undefined): string[] {
  if (!serviceName) return PACKAGE_CHECKLISTS['Express Detail'];
  const lower = serviceName.toLowerCase();
  for (const [key, val] of Object.entries(PACKAGE_CHECKLISTS)) {
    if (lower.includes(key.toLowerCase().split(' ')[0])) return val;
  }
  return PACKAGE_CHECKLISTS['Express Detail'];
}

// Status colors for the scheduler
export const DETAILING_STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-600', label: 'Pending' },
  confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-600', label: 'Scheduled' },
  en_route: { bg: 'bg-cyan-500/20', text: 'text-cyan-600', label: 'En Route' },
  in_progress: { bg: 'bg-amber-400/20', text: 'text-amber-500', label: 'In Progress' },
  completed: { bg: 'bg-green-500/20', text: 'text-green-600', label: 'Completed' },
  cancelled: { bg: 'bg-red-500/20', text: 'text-red-600', label: 'Cancelled' },
  no_show: { bg: 'bg-gray-500/20', text: 'text-gray-500', label: 'No Show' },
};

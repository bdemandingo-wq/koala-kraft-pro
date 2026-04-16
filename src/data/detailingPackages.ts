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
  'Express Package': [
    'Prewash complete',
    'Emblems & gas cap cleaned',
    'Wheels, tires & fender wells complete',
    'Bug removal done',
    'Foam bath complete',
    'Door jambs cleaned',
    'Tires dressed',
    'Windows streak-free',
    'Interior air blowout done',
    'Vacuum complete',
    'Final inspection done',
  ],
  'Reset Package': [
    'Prewash complete',
    'Emblems & gas cap cleaned',
    'Wheels, tires & fender wells complete',
    'Bug removal done',
    'Foam bath complete',
    'Door jambs cleaned',
    'Tires dressed',
    'Windows streak-free',
    'Interior air blowout done',
    'Vacuum complete',
    'Trim restored',
    'Spray sealant applied',
    'Dash, cup holders & plastic trim cleaned',
    'Leather & vinyl cleaned',
    'Final inspection done',
  ],
  'Deluxe Package': [
    'Prewash complete',
    'Emblems & gas cap cleaned',
    'Wheels, tires & fender wells complete',
    'Bug removal done',
    'Foam bath complete',
    'Door jambs cleaned',
    'Tires dressed',
    'Windows streak-free',
    'Interior air blowout done',
    'Vacuum complete',
    'Trim restored',
    'Spray sealant applied',
    'Dash, cup holders & plastic trim cleaned',
    'Leather & vinyl cleaned',
    'Paint decontamination complete',
    'Clay bar treatment done',
    'Ceramic wax buffed on',
    'Leather & vinyl conditioned',
    'Steam cleaning complete',
    'Final inspection done',
  ],
  'Elite Package': [
    'Prewash complete',
    'Emblems & gas cap cleaned',
    'Wheels, tires & fender wells complete',
    'Bug removal done',
    'Foam bath complete',
    'Door jambs cleaned',
    'Tires dressed',
    'Windows streak-free',
    'Interior air blowout done',
    'Vacuum complete',
    '1-step paint correction complete (50-70% swirl removal)',
    'Final inspection done',
  ],
  'Ultimate Protect Package': [
    'Prewash complete',
    'Emblems & gas cap cleaned',
    'Wheels, tires & fender wells complete',
    'Bug removal done',
    'Foam bath complete',
    'Door jambs cleaned',
    'Tires dressed',
    'Windows streak-free',
    'Interior air blowout done',
    'Vacuum complete',
    '5-year ceramic coating applied',
    'Coating cure time noted',
    'Final inspection done',
  ],
  'Maintenance Plan': [
    'Prewash complete',
    'Emblems & gas cap cleaned',
    'Wheels, tires & fender wells complete',
    'Bug removal done',
    'Foam bath complete',
    'Door jambs cleaned',
    'Tires dressed',
    'Windows streak-free',
    'Interior air blowout done',
    'Vacuum complete',
    'Final inspection done',
  ],
};

// Get checklist for a service name (fuzzy match)
export function getPackageChecklist(serviceName: string | null | undefined): string[] {
  if (!serviceName) return PACKAGE_CHECKLISTS['Express Package'];
  const lower = serviceName.toLowerCase();
  for (const [key, val] of Object.entries(PACKAGE_CHECKLISTS)) {
    if (lower.includes(key.toLowerCase().split(' ')[0])) return val;
  }
  return PACKAGE_CHECKLISTS['Express Package'];
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

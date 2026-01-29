/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in miles
 */
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate drive time based on distance
 * Uses a rough average of 30 mph for urban/suburban driving
 * @returns estimated minutes
 */
export function estimateDriveMinutes(distanceMiles: number): number {
  const avgSpeedMph = 30; // Conservative estimate for mixed driving
  const hours = distanceMiles / avgSpeedMph;
  return Math.round(hours * 60);
}

/**
 * Format distance for display
 */
export function formatDistance(distanceMiles: number): string {
  if (distanceMiles < 0.1) {
    return '< 0.1 mi';
  }
  return `${distanceMiles.toFixed(1)} mi`;
}

/**
 * Format drive time for display
 */
export function formatDriveTime(minutes: number): string {
  if (minutes < 1) {
    return '< 1 min';
  }
  if (minutes < 60) {
    return `~${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `~${hours} hr`;
  }
  return `~${hours} hr ${remainingMinutes} min`;
}

/**
 * Normalize US address for geocoding accuracy
 */
function normalizeUSAddress(address: string): string {
  let normalized = address.trim().toLowerCase();

  // Remove apartment/unit/suite identifiers – they confuse geocoders
  normalized = normalized
    .replace(/\b(apt|apartment|unit|suite|ste|bldg|building)\.?\s*#?\s*[\w-]+/gi, '')
    .replace(/\s+#[\w-]+/gi, '');

  // Replace common street abbreviations with full words
  const streetAbbrevs: [RegExp, string][] = [
    [/\brd\b/gi, 'road'],
    [/\bave\b/gi, 'avenue'],
    [/\bblvd\b/gi, 'boulevard'],
    [/\bdr\b/gi, 'drive'],
    [/\bln\b/gi, 'lane'],
    [/\bct\b/gi, 'court'],
    [/\bcir\b/gi, 'circle'],
    [/\bpl\b/gi, 'place'],
    [/\bpkwy\b/gi, 'parkway'],
    [/\bhwy\b/gi, 'highway'],
    [/\btrl\b/gi, 'trail'],
    [/\bter\b/gi, 'terrace'],
  ];
  for (const [pattern, replacement] of streetAbbrevs) {
    normalized = normalized.replace(pattern, replacement);
  }

  // Collapse whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Remove double commas or trailing commas before state/zip
  normalized = normalized.replace(/,\s*,/g, ',').replace(/,\s*$/g, '');

  // Append USA if not present (helps Nominatim)
  if (!normalized.includes('usa') && !normalized.includes('united states')) {
    normalized = normalized + ', usa';
  }

  return normalized.trim();
}

function buildCommaFormattedCandidates(
  normalizedNoCountry: string
): string[] {
  // Input example (already lowercased, units removed, abbreviations expanded):
  // "6701 mallards cove road jupiter fl 33458"
  const cleaned = normalizedNoCountry
    .replace(/\s+/g, " ")
    .replace(/,/g, " ")
    .trim();

  const tokens = cleaned.split(" ").filter(Boolean);
  if (tokens.length < 4) return [];

  const zip = tokens[tokens.length - 1];
  const state = tokens[tokens.length - 2];

  const isZip = /^\d{5}(?:-\d{4})?$/.test(zip);
  const isState = /^[a-z]{2}$/i.test(state);
  if (!isZip || !isState) return [];

  const prefix = tokens.slice(0, -2);
  if (prefix.length < 2) return [];

  // Heuristic 1 (preferred): split street/city using a known street suffix.
  const streetSuffixes = new Set([
    "road",
    "street",
    "avenue",
    "boulevard",
    "drive",
    "lane",
    "court",
    "circle",
    "place",
    "parkway",
    "highway",
    "trail",
    "terrace",
    "way",
  ]);

  const candidates: string[] = [];

  let suffixIdx = -1;
  for (let i = prefix.length - 1; i >= 0; i--) {
    if (streetSuffixes.has(prefix[i])) {
      suffixIdx = i;
      break;
    }
  }

  if (suffixIdx >= 0 && suffixIdx < prefix.length - 1) {
    const street = prefix.slice(0, suffixIdx + 1).join(" ").trim();
    const city = prefix.slice(suffixIdx + 1).join(" ").trim();
    if (street && city) {
      candidates.push(`${street}, ${city}, ${state.toUpperCase()} ${zip}`);
    }
  }

  // Heuristic 2 (fallback): assume city is the last 1–3 tokens before state.
  // This helps when the street suffix is missing (or abbreviated in an unexpected way).
  for (const cityLen of [1, 2, 3]) {
    if (prefix.length <= cityLen) continue;
    const street = prefix.slice(0, prefix.length - cityLen).join(" ").trim();
    const city = prefix.slice(prefix.length - cityLen).join(" ").trim();
    if (street && city) {
      const formatted = `${street}, ${city}, ${state.toUpperCase()} ${zip}`;
      if (!candidates.includes(formatted)) candidates.push(formatted);
    }
  }

  return candidates;
}

/**
 * Geocode an address using the backend edge function (avoids CORS issues)
 * Falls back to direct Nominatim call if edge function unavailable
 * Returns null if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const trimmed = address.trim();
    if (!trimmed) return null;
    if (trimmed.length > 300) return null;

    // Use supabase edge function to avoid CORS issues
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('geocode-address', {
      body: { address: trimmed }
    });

    if (error) {
      console.error('Geocode edge function error:', error);
      return null;
    }

    if (data?.success && data.lat && data.lng) {
      return { lat: data.lat, lng: data.lng };
    }

    console.warn('Geocode failed:', data?.error || 'Unknown error');
    return null;
  } catch (error) {
    console.error('Geocoding failed:', error);
    return null;
  }
}

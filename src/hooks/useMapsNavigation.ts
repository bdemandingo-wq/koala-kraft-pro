/**
 * Platform-aware maps navigation hook
 * iOS → Apple Maps, Android → geo: intent, Desktop → Google Maps web
 */

type Platform = 'ios' | 'android' | 'desktop';

interface MapsNavigationOptions {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  lat?: number | null;
  lng?: number | null;
  label?: string;
}

function detectPlatform(): Platform {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }
  
  // Android detection
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  return 'desktop';
}

function buildFullAddress(options: MapsNavigationOptions): string {
  const parts: string[] = [];
  if (options.address) parts.push(options.address);
  if (options.city) parts.push(options.city);
  if (options.state) parts.push(options.state);
  return parts.join(', ');
}

function getMapsUrl(options: MapsNavigationOptions): string | null {
  const { lat, lng, label } = options;
  const fullAddress = buildFullAddress(options);
  
  if (!fullAddress && (!lat || !lng)) {
    return null;
  }

  const platform = detectPlatform();
  const encodedAddress = encodeURIComponent(fullAddress);
  const encodedLabel = encodeURIComponent(label || fullAddress);

  switch (platform) {
    case 'ios':
      // Apple Maps - use coordinates if available, otherwise address
      if (lat && lng) {
        return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
      }
      return `https://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`;

    case 'android':
      // Android geo: intent - works with default maps app
      if (lat && lng) {
        return `geo:${lat},${lng}?q=${lat},${lng}(${encodedLabel})`;
      }
      // Fallback to geo: with address query
      return `geo:0,0?q=${encodedAddress}`;

    case 'desktop':
    default:
      // Google Maps web
      if (lat && lng) {
        return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      }
      return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  }
}

export function useMapsNavigation() {
  const platform = detectPlatform();

  const openDirections = (options: MapsNavigationOptions): void => {
    const url = getMapsUrl(options);
    if (!url) return;

    // For mobile platforms, use direct location change to trigger native app
    // For desktop, open in new tab
    if (platform === 'desktop') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Direct navigation triggers native app handlers on mobile
      window.location.href = url;
    }
  };

  const getDirectionsUrl = (options: MapsNavigationOptions): string | null => {
    return getMapsUrl(options);
  };

  return {
    platform,
    openDirections,
    getDirectionsUrl,
  };
}

export { detectPlatform, getMapsUrl };
export type { MapsNavigationOptions, Platform };

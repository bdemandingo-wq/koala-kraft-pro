import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';

function hexToHSL(hex: string): string {
  hex = hex.replace('#', '');
  if (hex.length !== 6) return '221 83% 53%';
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function adjustLightness(hsl: string, amount: number): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return hsl;
  const h = parseInt(parts[1]);
  const sv = parseInt(parts[2]);
  const lv = Math.min(100, Math.max(0, parseInt(parts[3]) + amount));
  return `${h} ${sv}% ${lv}%`;
}

// Cache to avoid redundant DOM mutations
let lastAppliedPrimary = '';
let lastAppliedAccent = '';

function applyBranding(primaryHex: string, accentHex: string) {
  // Skip if nothing changed
  if (primaryHex === lastAppliedPrimary && accentHex === lastAppliedAccent) return;
  lastAppliedPrimary = primaryHex;
  lastAppliedAccent = accentHex;

  const primaryHSL = hexToHSL(primaryHex);
  const accentHSL = hexToHSL(accentHex);
  const root = document.documentElement;

  // Batch style updates
  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--primary-foreground', '210 40% 98%');
  root.style.setProperty('--primary-glow', adjustLightness(primaryHSL, 7));
  root.style.setProperty('--ring', primaryHSL);
  root.style.setProperty('--accent', accentHSL);
  root.style.setProperty('--accent-foreground', '0 0% 100%');
  root.style.setProperty('--accent-glow', adjustLightness(accentHSL, 5));
  root.style.setProperty('--sidebar-primary', primaryHSL);
  root.style.setProperty('--sidebar-ring', primaryHSL);
}

export function useBrandingColors() {
  const { organization } = useOrganization();
  const fetchedOrgId = useRef<string | null>(null);

  // Listen for branding changes from settings save
  useEffect(() => {
    const handler = () => {
      // Reset cache so next fetch applies
      lastAppliedPrimary = '';
      lastAppliedAccent = '';
      fetchedOrgId.current = null;
    };
    window.addEventListener('branding-updated', handler);
    return () => window.removeEventListener('branding-updated', handler);
  }, []);

  useEffect(() => {
    const orgId = organization?.id;
    if (!orgId) return;
    // Already fetched for this org (and no branding-updated event fired)
    if (fetchedOrgId.current === orgId) return;

    let cancelled = false;

    const fetchAndApply = async () => {
      const { data } = await supabase
        .from('business_settings')
        .select('primary_color, accent_color')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (cancelled) return;

      fetchedOrgId.current = orgId;
      const primaryHex = data?.primary_color || '#3b82f6';
      const accentHex = data?.accent_color || '#14b8a6';
      applyBranding(primaryHex, accentHex);
    };

    fetchAndApply();

    return () => {
      cancelled = true;
    };
  }, [organization?.id]);
}

// Standalone function for public pages that receive colors directly
export function applyPublicBranding(primaryHex: string | null, accentHex: string | null) {
  if (!primaryHex && !accentHex) return;
  applyBranding(primaryHex || '#3b82f6', accentHex || primaryHex || '#14b8a6');
}

export function clearPublicBranding() {
  lastAppliedPrimary = '';
  lastAppliedAccent = '';
  const root = document.documentElement;
  const props = ['--primary', '--primary-foreground', '--primary-glow', '--ring', '--accent', '--accent-foreground', '--accent-glow', '--sidebar-primary', '--sidebar-ring'];
  props.forEach(p => root.style.removeProperty(p));
}

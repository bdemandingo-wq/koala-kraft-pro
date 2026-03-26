import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';

export function useAppStateHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    const init = async () => {
      const { App } = await import('@capacitor/app');

      const resumeListener = await App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive) {
          try {
            // First try getSession — if token is still valid, no network call needed
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              // Proactively refresh if token expires within 5 minutes
              const expiresAt = session.expires_at ?? 0;
              const expiresInSec = expiresAt - Math.floor(Date.now() / 1000);
              if (expiresInSec < 300) {
                await supabase.auth.refreshSession();
              }
            }
          } catch {
            // Non-fatal — offline or transient error
          }
        }
      });

      const backListener = await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });

      cleanup = () => {
        resumeListener.remove();
        backListener.remove();
      };
    };

    init().catch(console.error);

    return () => {
      cleanup?.();
    };
  }, []);
}

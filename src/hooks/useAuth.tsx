/**
 * AUTH HOOK - Unified with No-Session System
 * 
 * This hook now uses the no-session auth context as its source of truth.
 * Session persistence is disabled - users must login every visit.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useAuthNoSession, supabaseNoSession } from './useAuthNoSession';

interface SubscriptionStatus {
  subscribed: boolean;
  trial_active: boolean;
  trial_end: string | null;
  subscription_end: string | null;
  payment_failed?: boolean;
  message?: string;
  product_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  subscription: SubscriptionStatus | null;
  checkSubscription: (accessToken?: string) => Promise<void>;
  showSubscriptionDialog: boolean;
  setShowSubscriptionDialog: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use the no-session auth as the source of truth
  const noSessionAuth = useAuthNoSession();
  
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);

  const signOut = async () => {
    await noSessionAuth.signOut();
    setSubscription(null);
    setShowSubscriptionDialog(false);
  };

  const checkSubscription = async (_accessToken?: string) => {
    // Subscription check disabled — treat all users as subscribed
    setSubscription({ subscribed: true, subscription_tier: 'business', subscription_status: 'active' });
    setShowSubscriptionDialog(false);
  };

  useEffect(() => {
    if (!noSessionAuth.session?.access_token) {
      setSubscription(null);
      setShowSubscriptionDialog(false);
      return;
    }

    const t = window.setTimeout(async () => {
      try {
        const { data, error } = await supabaseNoSession.auth.getUser();
        if (error || !data?.user) {
          // Try refreshing the session before giving up
          const { data: refreshData, error: refreshError } = await supabaseNoSession.auth.refreshSession();
          if (refreshError || !refreshData?.session) {
            await signOut();
            return;
          }
          // Session refreshed successfully, continue
        }
        await checkSubscription(noSessionAuth.session?.access_token);
      } catch {
        // Network error - don't sign out, just skip the check
        console.warn('Network error during auth check, keeping session');
      }
    }, 0);

    return () => window.clearTimeout(t);
  }, [noSessionAuth.session?.access_token]);

  return (
    <AuthContext.Provider value={{ 
      user: noSessionAuth.user, 
      session: noSessionAuth.session, 
      loading: noSessionAuth.loading || !noSessionAuth.initialCleanupDone, 
      signOut, 
      subscription, 
      checkSubscription,
      showSubscriptionDialog,
      setShowSubscriptionDialog
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * PROTECTED ROUTE WITH NO SESSION PERSISTENCE
 * 
 * Redirects to /login if user is not authenticated
 * Works with the no-persist auth system
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthNoSession } from '@/hooks/useAuthNoSession';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteNoSessionProps {
  children: ReactNode;
}

export function ProtectedRouteNoSession({ children }: ProtectedRouteNoSessionProps) {
  const { user, loading, initialCleanupDone } = useAuthNoSession();

  // Show loading while initial auth cleanup and check happens
  if (loading || !initialCleanupDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If no user after cleanup, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

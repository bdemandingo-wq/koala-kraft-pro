/**
 * Apple Sign In Button — iOS only (Capacitor)
 * 
 * Dynamically imports the native plugin so the build doesn't fail
 * when @capacitor-community/apple-sign-in is not installed.
 * Falls back gracefully if unavailable.
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlatform } from '@/hooks/usePlatform';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AppleSignInButtonProps {
  label?: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

export function AppleSignInButton({
  label = 'Sign in with Apple',
  onSuccess,
  disabled = false,
}: AppleSignInButtonProps) {
  const { isIOS } = usePlatform();
  const [loading, setLoading] = useState(false);

  if (!isIOS) return null;

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      // Dynamic import — won't break build if package is missing
      const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');

      const result = await SignInWithApple.authorize({
        clientId: 'app.lovable.b5fbe592e63a4ccf8d0f0393049d0881',
        redirectURI: 'https://slwfkaqczvwvvvavkgpr.supabase.co/auth/v1/callback',
        scopes: 'email name',
      });

      const idToken = result.response?.identityToken;
      if (!idToken) {
        toast.error('Apple Sign In failed — no identity token received.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: idToken,
        nonce: '',
      });

      if (error) {
        toast.error(error.message || 'Apple Sign In failed.');
        setLoading(false);
        return;
      }

      onSuccess?.();
    } catch (err: any) {
      if (err?.code === '1001' || err?.message?.includes('canceled')) {
        setLoading(false);
        return;
      }
      // Plugin not installed — silently ignore
      if (err?.message?.includes('Failed to fetch') || err?.code === 'MODULE_NOT_FOUND') {
        console.warn('Apple Sign In plugin not available');
        toast.error('Apple Sign In is not available on this device.');
        setLoading(false);
        return;
      }
      console.error('Apple Sign In error:', err);
      toast.error('Apple Sign In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAppleSignIn}
      disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-3 rounded-lg bg-black text-white font-medium text-base h-12 px-4 transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 17 20" fill="none">
          <path
            d="M13.312 10.563c-.02-2.21 1.803-3.27 1.886-3.32-1.027-1.502-2.627-1.708-3.197-1.732-1.36-.138-2.655.802-3.346.802-.691 0-1.76-.782-2.893-.761-1.489.022-2.863.866-3.63 2.2-1.548 2.687-.396 6.67 1.113 8.852.738 1.067 1.617 2.265 2.773 2.222 1.113-.045 1.533-.72 2.878-.72 1.345 0 1.723.72 2.895.698 1.198-.02 1.96-1.088 2.694-2.158.85-1.239 1.198-2.438 1.22-2.5-.027-.013-2.34-.899-2.363-3.563l.07.08zM11.082 3.82c.612-.744 1.026-1.777.913-2.808-.882.036-1.95.587-2.582 1.33-.567.657-1.063 1.705-.93 2.712.984.077 1.988-.5 2.599-1.234z"
            fill="currentColor"
          />
        </svg>
      )}
      {label}
    </button>
  );
}

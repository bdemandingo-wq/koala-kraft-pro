import { toast } from 'sonner';

interface AppleSignInButtonProps {
  label?: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

export function AppleSignInButton({
  label = 'Sign in with Apple',
  disabled = false,
}: AppleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={() => toast.info('Sign in with Apple coming soon')}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 rounded-lg bg-black text-white font-medium text-base h-12 px-4 transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      🍎 {label}
    </button>
  );
}

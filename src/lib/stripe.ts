// NOTE (performance): Stripe should only be loaded on payment-related screens.
// This module provides a lazy initializer so importing it doesn't pull Stripe into the initial bundle.

type StripePromise = Promise<import('@stripe/stripe-js').Stripe | null>;

const DEFAULT_STRIPE_PUBLISHABLE_KEY =
  'pk_live_51NAFIvJv857o86nokonrv19sgQfuWLJpF2mrM37GiiBki4fmjwGqe1NQobcTJ6LrJ9YDk0vaKYgN7ALAxFJdSf2g00TDRZ9tNw';

let cachedKey: string | null = null;
let cachedPromise: StripePromise | null = null;

function safeGetStoredPublishableKey(): string | null {
  try {
    const key = localStorage.getItem('stripe_publishable_key');
    return key && key.startsWith('pk_') ? key : null;
  } catch {
    return null;
  }
}

/**
 * Lazily loads Stripe.js only when needed.
 * Keeps behavior the same, but avoids pulling Stripe into the initial bundle.
 */
export function getStripePromise(publishableKey?: string): StripePromise {
  const resolvedKey = publishableKey || safeGetStoredPublishableKey() || DEFAULT_STRIPE_PUBLISHABLE_KEY;

  if (cachedPromise && cachedKey === resolvedKey) return cachedPromise;
  cachedKey = resolvedKey;

  cachedPromise = import('@stripe/stripe-js').then(({ loadStripe }) => loadStripe(resolvedKey));
  return cachedPromise;
}

import { useEffect, useMemo, useState } from 'react';
import { getStripePromise, getCachedStripeReact, setCachedStripeReact } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { Stripe } from '@stripe/stripe-js';

type StripeReact = typeof import('@stripe/react-stripe-js');

interface CardFormProps {
  email: string;
  customerName: string;
  organizationId: string;
  onCardSaved: (cardInfo: { last4: string; brand: string; paymentMethodId: string }) => void;
  onError?: (error: string) => void;
  onHoldPlaced?: (holdInfo: { paymentIntentId: string; amount: number }) => void;
  showHoldOption?: boolean;
  defaultHoldAmount?: number;
  publicBooking?: boolean;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      padding: '10px 12px',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  disableLink: true,
  hidePostalCode: true,
};

function CardFormInnerDynamic({
  stripeReact,
  onPublishableKeyReceived,
  ...props
}: CardFormProps & {
  stripeReact: StripeReact;
  onPublishableKeyReceived?: (key: string) => void;
}) {
  const {
    email,
    customerName,
    organizationId,
    onCardSaved,
    onError,
    onHoldPlaced,
    showHoldOption = true,
    defaultHoldAmount = 50,
    publicBooking = false,
  } = props;

  const stripe = stripeReact.useStripe();
  const elements = stripeReact.useElements();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [placeHold, setPlaceHold] = useState(false);
  const [holdAmount, setHoldAmount] = useState(defaultHoldAmount.toString());

  const handleSaveCard = async () => {
    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(stripeReact.CardElement);
    if (!cardElement) {
      return;
    }

    setLoading(true);

    try {
      // First, create a SetupIntent on the server
      const { data: setupData, error: setupError } = await supabase.functions.invoke('create-setup-intent', {
        body: {
          email,
          customerName,
          organizationId,
          publicBooking,
        },
      });

      if (setupError || !setupData?.clientSecret) {
        throw new Error(setupError?.message || 'Failed to create setup intent');
      }

      // CRITICAL FIX: The clientSecret is created using the org's Stripe secret key.
      // We MUST confirm using the matching org-specific publishable key — NOT the platform default.
      // This prevents the "No such setupintent" error when orgs use their own Stripe accounts.
      let stripeInstance: Stripe | null = stripe;
      if (setupData.publishableKey && setupData.publishableKey !== '') {
        // Notify parent to update future Stripe Elements with the org key
        onPublishableKeyReceived?.(setupData.publishableKey);
        // Load a Stripe instance scoped to the org's publishable key
        const { loadStripe } = await import('@stripe/stripe-js');
        const orgStripe = await loadStripe(setupData.publishableKey);
        if (orgStripe) {
          stripeInstance = orgStripe;
        }
      }

      if (!stripeInstance) {
        throw new Error('Failed to initialize Stripe for this organization');
      }

      // Confirm the SetupIntent with the card details using the correct Stripe account
      const { error: confirmError, setupIntent } = await stripeInstance.confirmCardSetup(setupData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerName,
            email: email,
          },
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (setupIntent?.status === 'succeeded' && setupIntent.payment_method) {
        // Get card details from the payment method
        const { data: cardData, error: cardError } = await supabase.functions.invoke('get-payment-method-details', {
          body: {
            paymentMethodId: setupIntent.payment_method,
            organizationId,
          },
        });

        if (cardError) {
          throw new Error(cardError.message);
        }

        onCardSaved({
          last4: cardData.last4,
          brand: cardData.brand,
          paymentMethodId: setupIntent.payment_method as string,
        });

        // If hold is requested, place it now
        if (placeHold && parseFloat(holdAmount) > 0) {
          const { data: holdData, error: holdError } = await supabase.functions.invoke('charge-customer-card', {
            body: {
              email,
              amount: parseFloat(holdAmount),
              description: `Temporary hold for ${customerName}`,
              organizationId,
            },
          });

          if (holdError) {
            toast({
              title: 'Card saved, but hold failed',
              description: holdError.message,
              variant: 'destructive',
            });
          } else if (holdData?.success) {
            toast({
              title: 'Success',
              description: `Card saved and $${parseFloat(holdAmount).toFixed(2)} hold placed (not charged)`,
            });
            onHoldPlaced?.({
              paymentIntentId: holdData.paymentIntentId,
              amount: parseFloat(holdAmount),
            });
          }
        } else {
          toast({
            title: 'Success',
            description: `Card saved (${cardData.brand} ending in ${cardData.last4})`,
          });
        }

        // Clear the card element
        cardElement.clear();
      }
    } catch (error: any) {
      console.error('Failed to save card:', error);
      const errorMessage = error.message || 'Failed to save card';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 border rounded-md bg-background">
        <stripeReact.CardElement options={CARD_ELEMENT_OPTIONS} onChange={(e) => setCardComplete(e.complete)} />
      </div>
      
      {showHoldOption && (
        <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border/50">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="placeHold"
              checked={placeHold}
              onCheckedChange={(checked) => setPlaceHold(checked === true)}
            />
            <Label htmlFor="placeHold" className="flex items-center gap-2 text-sm cursor-pointer">
              <Lock className="w-4 h-4 text-muted-foreground" />
              Place temporary hold (not charged)
            </Label>
          </div>
          
          {placeHold && (
            <div className="flex items-center gap-2 ml-6">
              <Label htmlFor="holdAmount" className="text-sm text-muted-foreground whitespace-nowrap">
                Hold amount:
              </Label>
              <div className="relative flex-1 max-w-[120px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="holdAmount"
                  type="number"
                  value={holdAmount}
                  onChange={(e) => setHoldAmount(e.target.value)}
                  className="pl-7 h-9"
                  min="1"
                  step="0.01"
                />
              </div>
            </div>
          )}
          
          {placeHold && (
            <p className="text-xs text-muted-foreground ml-6">
              This hold authorizes but does not charge the card. You can capture or release it later.
            </p>
          )}
        </div>
      )}
      
      <Button
        type="button"
        variant="secondary"
        disabled={loading || !stripe || !cardComplete}
        className="w-full"
        onClick={handleSaveCard}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4 mr-2" />
        )}
        {placeHold ? `Add Card & Place $${parseFloat(holdAmount || '0').toFixed(2)} Hold` : 'Add Card'}
      </Button>
    </div>
  );
}

// Inner wrapper that manages the Stripe Elements provider with an org-specific key
function StripeCardFormWithReact({
  stripeReact,
  stripePromise,
  setStripePromise,
  ...props
}: CardFormProps & {
  stripeReact: StripeReact;
  stripePromise: Promise<Stripe | null> | null;
  setStripePromise: (p: Promise<Stripe | null>) => void;
}) {
  // Use a stable placeholder promise until we learn the org's publishable key
  const placeholderPromise = useMemo(() => getStripePromise(), []);
  const effectivePromise = stripePromise ?? placeholderPromise;

  return (
    <stripeReact.Elements stripe={effectivePromise}>
      <CardFormInnerDynamic
        stripeReact={stripeReact}
        onPublishableKeyReceived={(key) => {
          // Switch to the org-specific key for future renders
          setStripePromise(getStripePromise(key));
        }}
        {...props}
      />
    </stripeReact.Elements>
  );
}

export function StripeCardForm(props: CardFormProps) {
  // stripePromise is updated once we discover the org's publishable key
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripeReact, setStripeReact] = useState<StripeReact | null>(getCachedStripeReact);

  useEffect(() => {
    if (stripeReact) return;
    
    let cancelled = false;
    import('@stripe/react-stripe-js')
      .then((m) => {
        if (!cancelled) {
          setStripeReact(m);
          setCachedStripeReact(m);
        }
      })
      .catch((err) => {
        console.error('Failed to load Stripe React:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [stripeReact]);

  if (!stripeReact) {
    return (
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading secure payment form…
        </div>
      </div>
    );
  }

  return (
    <StripeCardFormWithReact
      stripeReact={stripeReact}
      stripePromise={stripePromise}
      setStripePromise={setStripePromise}
      {...props}
    />
  );
}

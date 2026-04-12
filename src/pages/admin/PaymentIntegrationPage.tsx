import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  CheckCircle2,
  Loader2,
  Trash2,
  ExternalLink,
  AlertCircle,
  Key,
  Eye,
  EyeOff,
  Save,
  TestTube,
  BarChart3,
  Users,
  Link2,
  Banknote,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useOrganization } from "@/contexts/OrganizationContext";

function normalizeKeyInput(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

function looksMaskedStripeKey(value: string): boolean {
  return (
    value.includes("...") ||
    value.includes("…") ||
    value.includes("••") ||
    value.length < 30
  );
}

function validateStripeKeys(
  publishableKeyRaw: string,
  secretKeyRaw: string
): { ok: true; publishableKey: string; secretKey: string } | { ok: false; message: string } {
  const publishableKey = normalizeKeyInput(publishableKeyRaw);
  const secretKey = normalizeKeyInput(secretKeyRaw);

  if (!publishableKey) return { ok: false, message: "Publishable key is required" };
  if (!secretKey) return { ok: false, message: "Secret key is required" };

  if (secretKey.startsWith("pk_")) {
    return { ok: false, message: "You entered a publishable key in the secret key field — they're different keys." };
  }
  if (!publishableKey.startsWith("pk_")) {
    return { ok: false, message: "Publishable key must start with pk_live_ or pk_test_" };
  }
  if (
    !secretKey.startsWith("sk_live_") &&
    !secretKey.startsWith("sk_test_") &&
    !secretKey.startsWith("rk_live_") &&
    !secretKey.startsWith("rk_test_")
  ) {
    return { ok: false, message: "Secret key must start with sk_live_, sk_test_, rk_live_, or rk_test_" };
  }
  if (looksMaskedStripeKey(secretKey)) {
    return {
      ok: false,
      message:
        "That secret key looks masked/truncated. In Stripe, create/rotate a key and copy the FULL value (Stripe only shows it once).",
    };
  }

  return { ok: true, publishableKey, secretKey };
}

const stripeLinks = [
  { label: "View Charges", icon: CreditCard, url: "https://dashboard.stripe.com/charges" },
  { label: "View Payouts", icon: Banknote, url: "https://dashboard.stripe.com/payouts" },
  { label: "View Customers", icon: Users, url: "https://dashboard.stripe.com/customers" },
  { label: "View Dashboard", icon: BarChart3, url: "https://dashboard.stripe.com" },
  { label: "Create Payment Link", icon: Link2, url: "https://dashboard.stripe.com/payment-links/create" },
];

export default function PaymentIntegrationPage() {
  const { organization } = useOrganization();

  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAt, setConnectedAt] = useState<string | null>(null);

  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testedOk, setTestedOk] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Load existing connection
  useEffect(() => {
    if (!organization?.id) return;
    (async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("org_stripe_settings")
        .select("is_connected, connected_at, stripe_publishable_key")
        .eq("organization_id", organization.id)
        .maybeSingle();
      if (data?.is_connected) {
        setIsConnected(true);
        setConnectedAt(data.connected_at ?? null);
      }
      setIsLoading(false);
    })();
  }, [organization?.id]);

  const handleTestConnection = async () => {
    const v = validateStripeKeys(publishableKey, secretKey);
    if (!v.ok) { toast.error(v.message); return; }
    setIsTesting(true);
    setTestedOk(false);
    try {
      const { loadStripe } = await import("@stripe/stripe-js");
      const stripe = await loadStripe(v.publishableKey);
      if (stripe) {
        setTestedOk(true);
        toast.success("Keys verified — connection looks good!");
      } else {
        throw new Error("Stripe failed to initialise");
      }
    } catch {
      setTestedOk(false);
      toast.error("Could not verify keys. Double-check they're correct.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveKeys = async () => {
    if (!testedOk) { toast.error("Please test your connection first"); return; }
    const v = validateStripeKeys(publishableKey, secretKey);
    if (!v.ok) { toast.error(v.message); return; }
    if (!organization?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("org_stripe_settings").upsert(
        {
          organization_id: organization.id,
          stripe_secret_key: v.secretKey,
          stripe_publishable_key: v.publishableKey,
          is_connected: true,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "organization_id" }
      );
      if (error) throw error;
      setIsConnected(true);
      setConnectedAt(new Date().toISOString());
      setPublishableKey("");
      setSecretKey("");
      setTestedOk(false);
      toast.success("Stripe connected! You can now accept payments.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!organization?.id) return;
    const ok = window.confirm(
      "Disconnect Stripe? This will disable payment features until you reconnect."
    );
    if (!ok) return;
    setIsDisconnecting(true);
    try {
      await supabase
        .from("org_stripe_settings")
        .delete()
        .eq("organization_id", organization.id);
      setIsConnected(false);
      setConnectedAt(null);
      toast.success("Stripe disconnected.");
    } catch {
      toast.error("Failed to disconnect. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Payment Integration" subtitle="Connect your Stripe account to accept payments">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Payment Integration" subtitle="Connect your Stripe account to accept payments">
      <div className="space-y-6 max-w-3xl">

        {/* ── Connection status banner ── */}
        {isConnected ? (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground text-lg">✅ Stripe Connected</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your Stripe account is connected and ready to accept payments.
                    </p>
                    {connectedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Connected since {new Date(connectedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Disconnect</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Stripe Not Connected</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your Stripe API keys below to start accepting payments from customers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── What you can do ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              What You Can Accept with Stripe
            </CardTitle>
            <CardDescription>Everything you need to get paid, built in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Credit & debit cards (Visa, Mastercard, Amex)",
                "Apple Pay & Google Pay",
                "ACH bank transfers",
                "Deposits & tips from clients",
                "Automatic payouts to your bank",
                "Built-in fraud protection",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Step-by-step guide ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Stripe Setup Guide
            </CardTitle>
            <CardDescription>Follow these steps to connect your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                n: 1,
                title: "Create a Stripe Account",
                desc: "Go to stripe.com and create a free account — takes about 5 minutes.",
              },
              {
                n: 2,
                title: "Complete Account Verification",
                desc: "Add your business details and banking information so Stripe can pay you out.",
              },
              {
                n: 3,
                title: "Get Your API Keys",
                desc: "In your Stripe Dashboard → Developers → API Keys. You'll need the Publishable key (pk_...) and Secret key (sk_...).",
              },
              {
                n: 4,
                title: "Paste Keys Below",
                desc: "Enter both keys in the form below, test the connection, and save.",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="flex gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {step.n}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                </div>
              </div>
            ))}

            <div className="pt-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open("https://dashboard.stripe.com/apikeys", "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-4 w-4" />
                Open Stripe API Keys Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── API Keys form ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {isConnected ? "Update Your Stripe API Keys" : "Enter Your Stripe API Keys"}
            </CardTitle>
            <CardDescription>Your keys are encrypted and stored securely in our database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publishableKey">Publishable Key</Label>
              <Input
                id="publishableKey"
                type="text"
                placeholder="pk_live_... or pk_test_..."
                value={publishableKey}
                onChange={(e) => { setPublishableKey(e.target.value); setTestedOk(false); }}
              />
              <p className="text-xs text-muted-foreground">Safe to use in frontend code</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <div className="relative">
                <Input
                  id="secretKey"
                  type={showSecretKey ? "text" : "password"}
                  placeholder="sk_live_... or sk_test_..."
                  value={secretKey}
                  onChange={(e) => { setSecretKey(e.target.value); setTestedOk(false); }}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  {showSecretKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Stripe only shows secret keys once — copy it immediately when you create or rotate one.
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Security Note</p>
                <p className="text-muted-foreground mt-1">
                  Never share your secret key. Use <strong>test keys</strong> (
                  <code className="bg-muted px-1 rounded">pk_test_</code> /{" "}
                  <code className="bg-muted px-1 rounded">sk_test_</code>) while developing, then
                  swap to live keys when ready.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={!publishableKey || !secretKey || isTesting}
                className="flex-1"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
              <Button
                onClick={handleSaveKeys}
                disabled={!testedOk || isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? "Saving..." : "Save & Connect"}
              </Button>
            </div>

            {testedOk && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Connection Verified ✓</p>
                  <p className="text-muted-foreground">Your Stripe keys are valid. Click "Save & Connect" to finish.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Stripe Quick Links (only shown when connected) ── */}
        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Stripe Dashboard Quick Links
              </CardTitle>
              <CardDescription>Jump straight to the most useful parts of your Stripe account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {stripeLinks.map((link) => (
                  <Button
                    key={link.label}
                    variant="outline"
                    className="h-auto flex-col gap-2 py-4 text-xs font-medium"
                    onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
                  >
                    <link.icon className="h-5 w-5 text-primary" />
                    {link.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Help card ── */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Need Help?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Having trouble setting up Stripe? Reach us at{" "}
                  <a href="mailto:support@wedetailnc.com" className="text-primary hover:underline">
                    support@wedetailnc.com
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}

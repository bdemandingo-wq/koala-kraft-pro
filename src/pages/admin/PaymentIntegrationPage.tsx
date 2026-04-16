import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreditCard,
  CheckCircle2,
  Loader2,
  Trash2,
  Zap,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useOrganization } from "@/contexts/OrganizationContext";
import { format } from "date-fns";

interface ManualPayment {
  id: string;
  customer_name: string;
  amount: number;
  description: string | null;
  created_at: string;
}

export default function PaymentIntegrationPage() {
  const { organization } = useOrganization();

  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAt, setConnectedAt] = useState<string | null>(null);

  const [secretKey, setSecretKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const [chargeOpen, setChargeOpen] = useState(false);
  const [chargeName, setChargeName] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeDesc, setChargeDesc] = useState("");
  const [charging, setCharging] = useState(false);
  const [recentPayments, setRecentPayments] = useState<ManualPayment[]>([]);

  useEffect(() => {
    if (!organization?.id) return;
    (async () => {
      const { data } = await supabase
        .from("org_stripe_settings")
        .select("is_connected, connected_at")
        .eq("organization_id", organization.id)
        .maybeSingle();
      if (data?.is_connected) {
        setIsConnected(true);
        setConnectedAt(data.connected_at ?? null);
        fetchRecentPayments();
      }
      setIsLoading(false);
    })();
  }, [organization?.id]);

  const fetchRecentPayments = async () => {
    if (!organization?.id) return;
    const { data } = await supabase
      .from("manual_payments" as any)
      .select("id, customer_name, amount, description, created_at")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setRecentPayments((data as any) || []);
  };

  const handleSave = async () => {
    const key = secretKey.trim();
    if (!key) { toast.error("Paste your Stripe secret key"); return; }
    if (key.startsWith("pk_")) { toast.error("That's a publishable key — paste your secret key (sk_live_... or sk_test_...)"); return; }
    if (!key.startsWith("sk_live_") && !key.startsWith("sk_test_") && !key.startsWith("rk_live_") && !key.startsWith("rk_test_")) {
      toast.error("Secret key must start with sk_live_ or sk_test_");
      return;
    }
    if (!organization?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("org_stripe_settings")
        .upsert(
          { organization_id: organization.id, stripe_secret_key: key, is_connected: true, connected_at: new Date().toISOString() },
          { onConflict: "organization_id" }
        );
      if (error) throw error;
      setIsConnected(true);
      setConnectedAt(new Date().toISOString());
      setSecretKey("");
      toast.success("Stripe connected! You can now charge clients.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!organization?.id) return;
    setIsDisconnecting(true);
    try {
      await supabase.from("org_stripe_settings").delete().eq("organization_id", organization.id);
      setIsConnected(false);
      setConnectedAt(null);
      setRecentPayments([]);
      toast.success("Stripe disconnected");
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setIsDisconnecting(false);
      setDisconnectOpen(false);
    }
  };

  const handleChargeCard = async () => {
    if (!organization?.id || !chargeName.trim() || !chargeAmount) return;
    setCharging(true);
    try {
      const { data, error } = await supabase.functions.invoke("charge-card-manual", {
        body: {
          organization_id: organization.id,
          customer_name: chargeName.trim(),
          amount: parseFloat(chargeAmount),
          description: chargeDesc.trim() || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Payment intent created for $${parseFloat(chargeAmount).toFixed(2)}`);
      setChargeOpen(false);
      setChargeName(""); setChargeAmount(""); setChargeDesc("");
      fetchRecentPayments();
    } catch (err: any) {
      toast.error(err.message || "Failed to create charge");
    } finally {
      setCharging(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Payment Integration" subtitle="Connect Stripe to charge clients">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Payment Integration" subtitle="Connect Stripe to charge clients">
      <div className="space-y-6 max-w-2xl">

        {isConnected ? (
          <>
            {/* Connected */}
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-lg">✅ Stripe Connected</p>
                      {connectedAt && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Since {new Date(connectedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => setDisconnectOpen(true)}
                    disabled={isDisconnecting}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">Disconnect</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Charge button + Stripe links */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Button
                  className="w-full gap-2 bg-[#635BFF] hover:bg-[#5851DB] text-white"
                  onClick={() => setChargeOpen(true)}
                >
                  <Zap className="h-4 w-4" />
                  Charge a Card
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "View Charges",   emoji: "💳", url: "https://dashboard.stripe.com/charges" },
                    { label: "View Payouts",   emoji: "💰", url: "https://dashboard.stripe.com/payouts" },
                    { label: "View Customers", emoji: "👥", url: "https://dashboard.stripe.com/customers" },
                    { label: "Dashboard",      emoji: "📊", url: "https://dashboard.stripe.com" },
                  ].map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-col items-center justify-center gap-1 rounded-md border border-input bg-background hover:bg-accent py-3 px-2 text-center text-xs font-medium"
                    >
                      <span className="text-lg">{link.emoji}</span>
                      {link.label}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent charges */}
            {recentPayments.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-500" />Recent Charges</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentPayments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{p.customer_name}</p>
                          {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(p.created_at), "MMM d, yyyy h:mm a")}</p>
                        </div>
                        <p className="font-semibold text-sm text-green-600 shrink-0 ml-3">${p.amount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Not connected */
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="text-center pb-2">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-[#635BFF] flex items-center justify-center mb-3">
                  <CreditCard className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-xl font-bold">Connect Your Stripe Account</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Paste your secret key from{" "}
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    Stripe → Developers → API Keys <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretKey">Secret Key</Label>
                <Input
                  id="secretKey"
                  type="password"
                  placeholder="sk_live_..."
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <p className="text-xs text-muted-foreground">Use the Secret key (sk_live_... or sk_test_...) — not the publishable key</p>
              </div>

              <Button
                className="w-full bg-[#635BFF] hover:bg-[#5851DB] text-white gap-2"
                onClick={handleSave}
                disabled={isSaving || !secretKey.trim()}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isSaving ? "Connecting..." : "Connect Stripe"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charge Card Modal */}
      <Dialog open={chargeOpen} onOpenChange={setChargeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#635BFF]" />
              Charge a Card
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Customer Name</Label>
              <Input placeholder="e.g. John Smith" value={chargeName} onChange={(e) => setChargeName(e.target.value)} />
            </div>
            <div>
              <Label>Amount ($)</Label>
              <Input type="number" step="0.01" min="0.50" placeholder="0.00" value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea placeholder="e.g. Full detail" value={chargeDesc} onChange={(e) => setChargeDesc(e.target.value)} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChargeOpen(false)}>Cancel</Button>
            <Button
              onClick={handleChargeCard}
              disabled={charging || !chargeName.trim() || !chargeAmount}
              className="bg-[#635BFF] hover:bg-[#5851DB] text-white gap-2"
            >
              {charging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {charging ? "Processing..." : "Charge Card"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect confirm */}
      <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Stripe?</AlertDialogTitle>
            <AlertDialogDescription>
              Payment features will be disabled until you reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} className="bg-destructive hover:bg-destructive/90">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

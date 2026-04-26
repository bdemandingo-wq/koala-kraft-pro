import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { detailingServices } from "@/data/pricingData";
import { PACKAGE_DURATIONS } from "@/data/detailingPackages";

/**
 * Source of truth for the public Remain Clean booking page packages.
 * Mirrors the PACKAGES array in src/pages/RemainCleanBookingPage.tsx
 * and the marketing copy on landing/services/home pages.
 */
const PUBLIC_PACKAGES = [
  {
    name: "Express Detail",
    startingPrice: 60,
    durationMin: PACKAGE_DURATIONS["Express Detail"],
    appearsIn: [
      "Booking page (PACKAGES)",
      "Landing page hero",
      "Services page · Express Detail",
      "RemainClean home cards",
    ],
  },
  {
    name: "Full Detail",
    startingPrice: 150,
    durationMin: PACKAGE_DURATIONS["Full Detail"],
    appearsIn: [
      "Booking page (PACKAGES)",
      "Landing page hero",
      "Services page · Full Detail",
      "RemainClean home cards",
    ],
  },
  {
    name: "Premium Detail",
    startingPrice: 295,
    durationMin: PACKAGE_DURATIONS["Premium Detail"],
    appearsIn: [
      "Booking page (PACKAGES)",
      "Landing page hero",
      "Services page · Premium Detail",
      "RemainClean home cards",
    ],
  },
];

export function PackagePriceAudit() {
  // Cross-check the public source of truth against the internal admin
  // pricingData.detailingServices catalog used by the admin booking form.
  const reconciliation = useMemo(() => {
    return PUBLIC_PACKAGES.map((pkg) => {
      const internal = detailingServices.find(
        (s) => s.name.toLowerCase() === pkg.name.toLowerCase()
      );
      const internalPrice = internal?.basePrice ?? null;
      const matches =
        internalPrice === null ? null : internalPrice === pkg.startingPrice;
      return { ...pkg, internalPrice, matches };
    });
  }, []);

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <AlertTriangle className="w-5 h-5" />
            Package Price Audit
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Public-facing starting prices for every detailing package. Use this
            to spot stale values across marketing pages, the booking form, and
            the internal admin catalog before they go live.
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-3">
        {reconciliation.map((pkg) => {
          const inSync = pkg.matches === true;
          const outOfSync = pkg.matches === false;
          return (
            <Card key={pkg.name}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-base">{pkg.name}</h3>
                    {inSync && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        In sync
                      </Badge>
                    )}
                    {outOfSync && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Mismatch
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Duration: {pkg.durationMin} min · Appears in:{" "}
                    {pkg.appearsIn.join(" • ")}
                  </p>
                  {outOfSync && (
                    <p className="text-xs text-destructive mt-1">
                      Public shows ${pkg.startingPrice} but internal catalog
                      lists ${pkg.internalPrice}. Update{" "}
                      <code className="text-[11px]">
                        src/data/pricingData.ts
                      </code>
                      .
                    </p>
                  )}
                </div>

                <div className="flex items-baseline gap-2 sm:gap-3">
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Public starts at
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      ${pkg.startingPrice}
                    </p>
                  </div>
                  {pkg.internalPrice !== null && (
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Internal
                      </p>
                      <p
                        className={`text-lg font-semibold ${
                          outOfSync ? "text-destructive" : "text-foreground"
                        }`}
                      >
                        ${pkg.internalPrice}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Where to edit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Public booking page packages</strong>:{" "}
            <code className="text-xs">src/pages/RemainCleanBookingPage.tsx</code>{" "}
            (PACKAGES array)
          </p>
          <p>
            • <strong>Marketing copy</strong>:{" "}
            <code className="text-xs">src/pages/LandingPage.tsx</code>,{" "}
            <code className="text-xs">
              src/pages/remainclean/RemainCleanHome.tsx
            </code>
            ,{" "}
            <code className="text-xs">
              src/pages/remainclean/RemainCleanServices.tsx
            </code>
          </p>
          <p>
            • <strong>Internal admin catalog</strong>:{" "}
            <code className="text-xs">src/data/pricingData.ts</code>{" "}
            (detailingServices)
          </p>
          <div className="pt-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/book/remainclean" target="_blank">
                <ExternalLink className="w-4 h-4" />
                Open public booking page
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

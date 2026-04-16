import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Check, Phone } from "lucide-react";
import { T, RCGlobalStyles, RCStatusBar, RCNav, RCPromo, RCFooter } from "./RCLayout";

const PACKAGES = [
  {
    name: "Basic",
    price: "$50",
    popular: false,
    cta: "Book Basic",
    features: [
      "Exterior hand wash",
      "Wheel & tire cleaning",
      "Tire dressing",
      "Exterior window cleaning",
      "Quick interior vacuum",
      "Dashboard wipe-down",
    ],
  },
  {
    name: "Silver",
    price: "$100",
    popular: true,
    cta: "Book Silver",
    features: [
      "Everything in Basic",
      "Full interior vacuum & detail",
      "Door jamb cleaning",
      "Interior window cleaning",
      "Air freshener",
      "Tire dressing",
    ],
  },
  {
    name: "Gold",
    price: "$150",
    popular: false,
    cta: "Book Gold",
    features: [
      "Everything in Silver",
      "Clay bar treatment",
      "One-step machine polish",
      "Sealant or carnauba wax",
      "Leather/vinyl conditioning",
      "Engine bay wipe-down",
      "Deep cup holder cleaning",
    ],
  },
  {
    name: "Platinum",
    price: "$200",
    popular: false,
    cta: "Book Platinum",
    features: [
      "Everything in Gold",
      "Interior protection treatment",
      "Premium spray wax coating",
      "High-detail dashboard/steering wheel/panels",
      "Exterior finishing",
      "Maximum attention to detail",
      "Final showroom-quality inspection",
    ],
  },
];

const DISCOUNTS: Record<string, string> = {
  Silver:   "$10 off with code MarioWorld4L",
  Gold:     "$15 off with code MarioWorld4L",
  Platinum: "$20 off with code MarioWorld4L",
};

export default function RemainCleanServices() {
  return (
    <>
      <RCGlobalStyles />
      <Seo
        title="Services & Pricing | Remain Clean Services"
        description="Mobile detailing packages from $50. Basic, Silver, Gold & Platinum — we bring the showroom to Fort Lauderdale, Miami-Dade & West Palm Beach."
        canonicalPath="/remainclean/services"
      />

      <div style={{ backgroundColor: T.bg, color: T.fg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <RCStatusBar />
        <RCNav />
        <RCPromo />

        <main style={{ flex: 1 }}>

          {/* Header */}
          <section style={{ padding: "5rem 1.5rem 3.5rem", textAlign: "center", background: `linear-gradient(180deg, oklch(16% .007 285) 0%, ${T.bg} 100%)` }}>
            <p style={{ color: T.primary, fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Mobile Detailing</p>
            <h1 className="rc-s" style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 800, color: T.fg, marginBottom: "1rem" }}>
              Services &amp; Pricing
            </h1>
            <p style={{ color: T.mutedFg, fontSize: "1.0625rem", lineHeight: 1.7, maxWidth: "520px", margin: "0 auto" }}>
              Choose the package that fits your vehicle and budget. Every service is performed on-location — we come to you.
            </p>
          </section>

          {/* Packages */}
          <section style={{ padding: "3rem 1.5rem 5rem" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "1.5rem" }}>
              {PACKAGES.map(pkg => (
                <div key={pkg.name} className="rc-card"
                  style={{
                    backgroundColor: T.card,
                    border: `1px solid ${pkg.popular ? T.primary : T.border}`,
                    borderRadius: "1rem",
                    padding: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden",
                  }}>

                  {pkg.popular && (
                    <div style={{ position: "absolute", top: 0, right: 0, backgroundColor: T.primary, color: T.primaryFg, fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.3125rem 0.875rem", borderBottomLeftRadius: "0.625rem" }}>
                      MOST POPULAR
                    </div>
                  )}

                  <div style={{ marginBottom: "1.5rem" }}>
                    <h2 className="rc-s" style={{ color: T.fg, fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.25rem" }}>{pkg.name}</h2>
                    <p style={{ color: T.primary, fontSize: "2rem", fontWeight: 800 }}>{pkg.price}</p>
                    {DISCOUNTS[pkg.name] && (
                      <p style={{ color: T.mutedFg, fontSize: "0.75rem", marginTop: "0.25rem" }}>💰 {DISCOUNTS[pkg.name]}</p>
                    )}
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.625rem", flex: 1 }}>
                    {pkg.features.map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "0.9rem", color: T.mutedFg, lineHeight: 1.5 }}>
                        <Check size={15} style={{ color: T.primary, flexShrink: 0, marginTop: "0.125rem" }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link to={`/book/remainclean?package=${pkg.name}`} className="rc-btn"
                    style={{
                      display: "block",
                      textAlign: "center",
                      backgroundColor: pkg.popular ? T.primary : "transparent",
                      color: pkg.popular ? T.primaryFg : T.fg,
                      border: `1px solid ${pkg.popular ? T.primary : T.border}`,
                      padding: "0.8125rem 1.5rem",
                      borderRadius: "0.625rem",
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      textDecoration: "none",
                    }}>
                    {pkg.cta}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section style={{ padding: "5rem 1.5rem", textAlign: "center", backgroundColor: T.card }}>
            <div style={{ maxWidth: "560px", margin: "0 auto" }}>
              <h2 className="rc-s" style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 800, color: T.fg, marginBottom: "1rem" }}>
                Ready to Book Your Detail?
              </h2>
              <p style={{ color: T.mutedFg, lineHeight: 1.7, marginBottom: "2rem" }}>
                We service Fort Lauderdale, Miami-Dade &amp; West Palm Beach — 7 days a week, 8AM–9PM.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
                <Link to="/book/remainclean" className="rc-btn"
                  style={{ backgroundColor: T.primary, color: T.primaryFg, padding: "0.9375rem 2.25rem", borderRadius: "9999px", fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>
                  Book Your Detail Now
                </Link>
                <a href="tel:9549131307" className="rc-btn"
                  style={{ backgroundColor: "transparent", color: T.fg, padding: "0.9375rem 2.25rem", borderRadius: "9999px", fontWeight: 600, fontSize: "1rem", textDecoration: "none", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Phone size={16} />Call (954)-913-1307
                </a>
              </div>
            </div>
          </section>

        </main>

        <RCFooter />
      </div>
    </>
  );
}

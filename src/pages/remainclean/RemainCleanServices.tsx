import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Check, Phone, Car, Crown } from "lucide-react";
import { T, RCGlobalStyles, RCStatusBar, RCNav, RCPromo, RCFooter } from "./RCLayout";

const EXPRESS_DETAIL_SIZES = [
  { size: "Cars", price: "$60", example: "Civic, Corolla, Model 3" },
  { size: "Mid-Size", price: "$70", example: "RAV4, CR-V, Model Y" },
  { size: "Full-Size", price: "$80", example: "F-150, Tahoe, Expedition" },
];

const EXPRESS_DETAIL_FEATURES = [
  "Hand Wash",
  "Quick Vacuum",
  "Light Wipe Down",
  "Air Freshener",
];

const FULL_DETAIL_SIZES = [
  { size: "Cars", price: "$150", example: "Civic, Corolla, Model 3" },
  { size: "Mid-Size", price: "$145", example: "RAV4, CR-V, Model Y" },
  { size: "Full-Size", price: "$165", example: "F-150, Tahoe, Expedition" },
];

const FULL_DETAIL_FEATURES = [
  "Deep Interior Clean",
  "Steam & Shampoo",
  "Exterior Wash + Protection",
];

const PREMIUM_DETAIL_FEATURES = [
  "Clay Bar Treatment",
  "Ceramic Sealant",
  "Stain & Odor Removal",
  "Leather Conditioning",
];

export default function RemainCleanServices() {
  return (
    <>
      <RCGlobalStyles />
      <Seo
        title="Services & Pricing | Remain Clean Services"
        description="Mobile detailing packages starting at $60. Express, Full Detail & Premium — we bring the showroom to Fort Lauderdale, Miami-Dade & West Palm Beach."
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

          {/* Express Detail Section */}
          <section style={{ padding: "3rem 1.5rem 2rem" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <h2 className="rc-s" style={{ fontSize: "1.75rem", fontWeight: 800, color: T.fg, marginBottom: "0.5rem", textAlign: "center" }}>Express Detail</h2>
              <p style={{ color: T.mutedFg, textAlign: "center", marginBottom: "2rem", fontSize: "0.9375rem" }}>Quick refresh — priced by vehicle size.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
                {EXPRESS_DETAIL_SIZES.map(s => (
                  <div key={s.size} className="rc-card" style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "1rem", padding: "2rem", textAlign: "center" }}>
                    <Car size={28} style={{ color: T.primary, marginBottom: "0.75rem" }} />
                    <h3 className="rc-s" style={{ color: T.fg, fontWeight: 800, fontSize: "1.25rem", marginBottom: "0.25rem" }}>{s.size}</h3>
                    <p style={{ color: T.primary, fontSize: "2rem", fontWeight: 800, marginBottom: "0.25rem" }}>{s.price}</p>
                    <p style={{ color: T.mutedFg, fontSize: "0.8125rem" }}>{s.example}</p>
                  </div>
                ))}
              </div>

              <div className="rc-card" style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "1rem", padding: "2rem" }}>
                <h3 className="rc-s" style={{ color: T.fg, fontWeight: 700, fontSize: "1.125rem", marginBottom: "1rem" }}>What's Included</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "0.625rem" }}>
                  {EXPRESS_DETAIL_FEATURES.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "0.9rem", color: T.mutedFg, lineHeight: 1.5 }}>
                      <Check size={15} style={{ color: T.primary, flexShrink: 0, marginTop: "0.125rem" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                  <Link to="/book/remainclean?package=Express+Detail" className="rc-btn"
                    style={{ display: "inline-block", backgroundColor: "transparent", color: T.fg, border: `1px solid ${T.border}`, padding: "0.8125rem 2rem", borderRadius: "0.625rem", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none" }}>
                    Book Express Detail
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Full Detail Section */}
          <section style={{ padding: "3rem 1.5rem" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <h2 className="rc-s" style={{ fontSize: "1.75rem", fontWeight: 800, color: T.fg, marginBottom: "0.5rem", textAlign: "center" }}>Full Detail</h2>
              <p style={{ color: T.mutedFg, textAlign: "center", marginBottom: "2rem", fontSize: "0.9375rem" }}>Complete interior & exterior transformation — priced by vehicle size.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
                {FULL_DETAIL_SIZES.map(s => (
                  <div key={s.size} className="rc-card" style={{ backgroundColor: T.card, border: `1px solid ${T.primary}`, borderRadius: "1rem", padding: "2rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, right: 0, backgroundColor: T.primary, color: T.primaryFg, fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.3125rem 0.875rem", borderBottomLeftRadius: "0.625rem" }}>
                      MOST POPULAR
                    </div>
                    <Car size={28} style={{ color: T.primary, marginBottom: "0.75rem" }} />
                    <h3 className="rc-s" style={{ color: T.fg, fontWeight: 800, fontSize: "1.25rem", marginBottom: "0.25rem" }}>{s.size}</h3>
                    <p style={{ color: T.primary, fontSize: "2rem", fontWeight: 800, marginBottom: "0.25rem" }}>{s.price}</p>
                    <p style={{ color: T.mutedFg, fontSize: "0.8125rem" }}>{s.example}</p>
                  </div>
                ))}
              </div>

              <div className="rc-card" style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "1rem", padding: "2rem" }}>
                <h3 className="rc-s" style={{ color: T.fg, fontWeight: 700, fontSize: "1.125rem", marginBottom: "1rem" }}>What's Included</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "0.625rem" }}>
                  {FULL_DETAIL_FEATURES.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "0.9rem", color: T.mutedFg, lineHeight: 1.5 }}>
                      <Check size={15} style={{ color: T.primary, flexShrink: 0, marginTop: "0.125rem" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                  <Link to="/book/remainclean?package=Full+Detail" className="rc-btn"
                    style={{ display: "inline-block", backgroundColor: T.primary, color: T.primaryFg, padding: "0.8125rem 2rem", borderRadius: "0.625rem", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none" }}>
                    Book Full Detail
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Premium Detail Section */}
          <section style={{ padding: "3rem 1.5rem 5rem" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <h2 className="rc-s" style={{ fontSize: "1.75rem", fontWeight: 800, color: T.fg, marginBottom: "0.5rem", textAlign: "center" }}>Premium Detail</h2>
              <p style={{ color: T.mutedFg, textAlign: "center", marginBottom: "2rem", fontSize: "0.9375rem" }}>Showroom finish — the ultimate transformation.</p>

              <div style={{ maxWidth: "400px", margin: "0 auto 2.5rem" }}>
                <div className="rc-card" style={{ backgroundColor: T.card, border: `1px solid ${T.primary}`, borderRadius: "1rem", padding: "2.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, right: 0, backgroundColor: T.primary, color: T.primaryFg, fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.3125rem 0.875rem", borderBottomLeftRadius: "0.625rem" }}>
                    PREMIUM
                  </div>
                  <Crown size={32} style={{ color: T.primary, marginBottom: "0.75rem" }} />
                  <h3 className="rc-s" style={{ color: T.fg, fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.25rem" }}>All Vehicle Sizes</h3>
                  <p style={{ color: T.primary, fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>$295</p>
                  <p style={{ color: T.mutedFg, fontSize: "0.875rem" }}>Showroom Finish</p>
                </div>
              </div>

              <div className="rc-card" style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "1rem", padding: "2rem" }}>
                <h3 className="rc-s" style={{ color: T.fg, fontWeight: 700, fontSize: "1.125rem", marginBottom: "1rem" }}>What's Included</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "0.625rem" }}>
                  {PREMIUM_DETAIL_FEATURES.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "0.9rem", color: T.mutedFg, lineHeight: 1.5 }}>
                      <Check size={15} style={{ color: T.primary, flexShrink: 0, marginTop: "0.125rem" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                  <Link to="/book/remainclean?package=Premium+Detail" className="rc-btn"
                    style={{ display: "inline-block", backgroundColor: T.primary, color: T.primaryFg, padding: "0.8125rem 2rem", borderRadius: "0.625rem", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none" }}>
                    Book Premium Detail
                  </Link>
                </div>
              </div>
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

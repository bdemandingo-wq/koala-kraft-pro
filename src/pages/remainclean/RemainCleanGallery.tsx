import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Phone, ImageOff } from "lucide-react";
import { T, RCGlobalStyles, RCStatusBar, RCNav, RCPromo, RCFooter } from "./RCLayout";

const CATEGORIES = [
  { icon: "🚿", title: "Exterior Wash & Shine" },
  { icon: "🪥", title: "Interior Details" },
  { icon: "✨", title: "Buff & Wax" },
];

function BeforeAfterPlaceholder() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
      {["Before", "After"].map(label => (
        <div key={label} style={{ backgroundColor: T.bg, border: `1px dashed ${T.border}`, borderRadius: "0.75rem", aspectRatio: "4/3", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <ImageOff size={24} style={{ color: T.border }} />
          <span style={{ color: T.border, fontSize: "0.8125rem", fontWeight: 600 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function RemainCleanGallery() {
  return (
    <>
      <RCGlobalStyles />
      <Seo
        title="Gallery | Remain Clean Services"
        description="Before & after photos from Remain Clean Services — premium mobile detailing in Fort Lauderdale, Miami-Dade & West Palm Beach."
        canonicalPath="/remainclean/gallery"
      />

      <div style={{ backgroundColor: T.bg, color: T.fg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <RCStatusBar />
        <RCNav />
        <RCPromo />

        <main style={{ flex: 1 }}>

          {/* Header */}
          <section style={{ padding: "5rem 1.5rem 3.5rem", textAlign: "center", background: `linear-gradient(180deg, oklch(16% .007 285) 0%, ${T.bg} 100%)` }}>
            <p style={{ color: T.primary, fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Before &amp; After</p>
            <h1 className="rc-s" style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 800, color: T.fg, marginBottom: "1rem" }}>
              Our Work
            </h1>
            <p style={{ color: T.mutedFg, fontSize: "1.0625rem", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto" }}>
              Real results from real vehicles we've detailed.
            </p>
          </section>

          {/* Coming Soon */}
          <section style={{ padding: "4rem 1.5rem" }}>
            <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
              <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "1.25rem", padding: "3.5rem 2rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1.25rem" }}>📸</div>
                <h2 className="rc-s" style={{ color: T.fg, fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.75rem" }}>Gallery Coming Soon</h2>
                <p style={{ color: T.mutedFg, lineHeight: 1.7, fontSize: "0.9375rem" }}>
                  We're putting together photos of our best work. Check back soon to see stunning before &amp; after transformations!
                </p>
              </div>
            </div>
          </section>

          {/* Category Placeholders */}
          <section style={{ padding: "2rem 1.5rem 5rem" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1.5rem" }}>
              {CATEGORIES.map(cat => (
                <div key={cat.title} className="rc-card" style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "1rem", padding: "1.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>{cat.icon}</span>
                    <h3 className="rc-s" style={{ color: T.fg, fontWeight: 700, fontSize: "1rem" }}>{cat.title}</h3>
                  </div>
                  <BeforeAfterPlaceholder />
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section style={{ padding: "5rem 1.5rem", textAlign: "center", backgroundColor: T.card }}>
            <div style={{ maxWidth: "520px", margin: "0 auto" }}>
              <h2 className="rc-s" style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 800, color: T.fg, marginBottom: "1rem" }}>
                Want Results Like These?
              </h2>
              <p style={{ color: T.mutedFg, lineHeight: 1.7, marginBottom: "2rem" }}>
                Book your mobile detail today and see the difference.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
                <Link to="/book/remainclean" className="rc-btn"
                  style={{ backgroundColor: T.primary, color: T.primaryFg, padding: "0.9375rem 2.25rem", borderRadius: "9999px", fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>
                  Book Now
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

import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Phone } from "lucide-react";
import { T, RCGlobalStyles, RCStatusBar, RCNav, RCPromo, RCFooter } from "./RCLayout";

const SERVICES = [
  { icon: "🚿", title: "Express Detail",  desc: "Hand Wash, Quick Vacuum, Light Wipe Down, Air Freshener. Starting at $60." },
  { icon: "🪥", title: "Full Detail",      desc: "Deep Interior Clean, Steam & Shampoo, Exterior Wash + Protection. Starting at $125." },
  { icon: "✨", title: "Premium Detail",    desc: "Clay Bar Treatment, Ceramic Sealant, Stain & Odor Removal, Leather Conditioning. $295." },
];

const TESTIMONIALS = [
  { name: "Marcus J.",  location: "Fort Lauderdale", quote: "Hands down the best mobile detail I've ever had. My BMW looked brand new — inside and out. Worth every dollar." },
  { name: "Sophia R.",  location: "Miami-Dade",      quote: "Got the Gold package and it was worth every penny. They were on time, professional, and my car has never looked this good." },
  { name: "David T.",   location: "West Palm Beach", quote: "I've tried other detailers but nobody comes close. These guys take their time and actually care about the result." },
  { name: "Ashley M.",  location: "Fort Lauderdale", quote: "Super professional and on time. They came right to my driveway — I didn't have to go anywhere. 10/10 would book again." },
  { name: "Carlos G.",  location: "Miami-Dade",      quote: "The buff and wax service removed years of sun damage from my hood. Looks absolutely incredible now." },
  { name: "Nicole W.",  location: "West Palm Beach", quote: "Love the rewards program! Already on my 6th wash. The team is always friendly and the results speak for themselves." },
];

export default function RemainCleanHome() {
  return (
    <>
      <RCGlobalStyles />
      <Seo
        title="Remain Clean Services | Premium Mobile Detailing"
        description="Premium mobile detailing — we bring the showroom to you. Serving Fort Lauderdale, Miami-Dade & West Palm Beach. Book today!"
        canonicalPath="/remainclean"
      />

      <div style={{ backgroundColor: T.bg, color: T.fg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <RCStatusBar />
        <RCNav />
        <RCPromo />

        <main style={{ flex: 1 }}>

          {/* Hero */}
          <section style={{ padding: "6rem 1.5rem 5rem", textAlign: "center", background: `linear-gradient(180deg, oklch(16% .007 285) 0%, ${T.bg} 100%)` }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <div style={{ display: "inline-block", backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "9999px", padding: "0.375rem 1rem", fontSize: "0.75rem", color: T.mutedFg, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1.75rem" }}>
                Mobile Detailing • South Florida
              </div>
              <h1 className="rc-s" style={{ fontSize: "clamp(2.5rem,7vw,4.5rem)", fontWeight: 800, color: T.fg, lineHeight: 1.1, marginBottom: "1.25rem", letterSpacing: "-0.01em" }}>
                REMAIN CLEAN<br />SERVICES
              </h1>
              <p style={{ fontSize: "clamp(1rem,2.5vw,1.25rem)", color: T.mutedFg, lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: "560px", margin: "0 auto 2.5rem" }}>
                Premium mobile detailing — we bring the showroom to you. Serving Fort Lauderdale, Miami-Dade &amp; West Palm Beach.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
                <Link to="/book/remainclean"
                  style={{ backgroundColor: T.primary, color: T.primaryFg, padding: "0.9375rem 2.25rem", borderRadius: "9999px", fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}
                  className="rc-btn">
                  Book Appointment
                </Link>
                <a href="tel:9549131307"
                  style={{ backgroundColor: "transparent", color: T.fg, padding: "0.9375rem 2.25rem", borderRadius: "9999px", fontWeight: 600, fontSize: "1rem", textDecoration: "none", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "0.5rem" }}
                  className="rc-btn">
                  <Phone size={16} />Call (954)-913-1307
                </a>
              </div>
            </div>
          </section>

          {/* Services Preview */}
          <section id="services" style={{ padding: "5rem 1.5rem", backgroundColor: T.card }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <p style={{ color: T.primary, fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", marginBottom: "0.75rem" }}>What We Offer</p>
              <h2 className="rc-s" style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 800, textAlign: "center", color: T.fg, marginBottom: "0.75rem" }}>
                Premium Detailing Packages
              </h2>
              <p style={{ color: T.mutedFg, textAlign: "center", marginBottom: "3.5rem", fontSize: "1rem" }}>
                From a quick exterior refresh to a full showroom-quality detail.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.5rem" }}>
                {SERVICES.map(s => (
                  <div key={s.title} className="rc-card" style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: "1rem", padding: "2rem" }}>
                    <div style={{ fontSize: "2.25rem", marginBottom: "1rem" }}>{s.icon}</div>
                    <h3 className="rc-s" style={{ color: T.fg, fontWeight: 700, fontSize: "1.1875rem", marginBottom: "0.5rem" }}>{s.title}</h3>
                    <p style={{ color: T.mutedFg, fontSize: "0.9375rem", lineHeight: 1.65 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
                <Link to="/remainclean/services" className="rc-btn"
                  style={{ display: "inline-block", color: T.primary, border: `1px solid ${T.border}`, padding: "0.75rem 2rem", borderRadius: "9999px", fontWeight: 600, fontSize: "0.9375rem", textDecoration: "none" }}>
                  View All Packages &amp; Pricing →
                </Link>
              </div>
            </div>
          </section>

          {/* We Come to You */}
          <section style={{ padding: "5rem 1.5rem", textAlign: "center" }}>
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
              <p style={{ color: T.primary, fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>No Drop-Off Required</p>
              <h2 className="rc-s" style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 800, color: T.fg, marginBottom: "1.25rem" }}>
                We Come to You
              </h2>
              <p style={{ color: T.mutedFg, lineHeight: 1.75, fontSize: "1rem", marginBottom: "2.5rem" }}>
                Our mobile team brings professional-grade equipment right to your home, office, or wherever your vehicle is parked. No waiting rooms. No wasted time.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
                {["Fort Lauderdale", "Miami-Dade", "West Palm Beach"].map(area => (
                  <span key={area} style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "9999px", padding: "0.5rem 1.25rem", fontSize: "0.875rem", color: T.fg }}>
                    📍 {area}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section id="reviews" style={{ padding: "5rem 1.5rem", backgroundColor: T.card }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <p style={{ color: T.primary, fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", marginBottom: "0.75rem" }}>5-Star Reviews</p>
              <h2 className="rc-s" style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 800, textAlign: "center", color: T.fg, marginBottom: "3.5rem" }}>
                What Our Clients Say
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1.25rem" }}>
                {TESTIMONIALS.map(t => (
                  <div key={t.name} className="rc-card" style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: "1rem", padding: "1.75rem" }}>
                    <div style={{ color: T.primary, fontSize: "1rem", marginBottom: "0.875rem", letterSpacing: "0.05em" }}>★★★★★</div>
                    <p style={{ color: T.fg, fontSize: "0.9375rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>"{t.quote}"</p>
                    <div>
                      <p style={{ color: T.fg, fontWeight: 600, fontSize: "0.875rem" }}>{t.name}</p>
                      <p style={{ color: T.mutedFg, fontSize: "0.8125rem" }}>{t.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section style={{ padding: "6rem 1.5rem", textAlign: "center" }}>
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <h2 className="rc-s" style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 800, color: T.fg, marginBottom: "1rem" }}>
                Ready for a Showroom Finish?
              </h2>
              <p style={{ color: T.mutedFg, fontSize: "1rem", lineHeight: 1.7, marginBottom: "2.5rem" }}>
                Book your mobile detail today and see the difference professional care makes.
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

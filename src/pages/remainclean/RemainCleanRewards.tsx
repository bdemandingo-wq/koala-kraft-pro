import { useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Phone, Mail, RotateCcw, Gift, Star, CheckCircle2 } from "lucide-react";
import { T, RCGlobalStyles, RCStatusBar, RCNav, RCPromo, RCFooter } from "./RCLayout";
import { supabase } from "@/lib/supabase";

const STEPS = [
  { icon: <CheckCircle2 size={22} />, title: "Book & Complete",  desc: "Schedule and finish a detail service with us." },
  { icon: <Star size={22} />,         title: "Earn a Punch",     desc: "Each completed wash earns one punch on your card." },
  { icon: <Gift size={22} />,         title: "10 Punches = FREE", desc: "Reach 10 punches and your next wash is on us." },
  { icon: <RotateCcw size={22} />,    title: "Reset & Repeat",   desc: "Your card resets and you start earning again." },
];

const TOTAL = 10;

export default function RemainCleanRewards() {
  const [phone, setPhone]   = useState("");
  const [result, setResult] = useState<{ punches?: number; name?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("rewards-lookup", {
        body: { phone: phone.trim(), organization_slug: "remainclean" },
      });
      if (error) throw error;
      setResult({ punches: data?.punches ?? 0, name: data?.name });
    } catch {
      setResult({ error: "We couldn't find an account with that number. Try calling us at (954)-913-1307." });
    } finally {
      setLoading(false);
    }
  };

  const punches = result?.punches ?? 0;

  return (
    <>
      <RCGlobalStyles />
      <style>{`
        .rc-punch { transition: background-color .2s, border-color .2s; }
      `}</style>
      <Seo
        title="Rewards | Remain Clean Services"
        description="Every wash counts! Get your 10th wash FREE with the Remain Clean Services loyalty rewards program."
        canonicalPath="/remainclean/rewards"
      />

      <div style={{ backgroundColor: T.bg, color: T.fg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <RCStatusBar />
        <RCNav />
        <RCPromo />

        <main style={{ flex: 1 }}>

          {/* Header */}
          <section style={{ padding: "5rem 1.5rem 4rem", textAlign: "center", background: `linear-gradient(180deg, oklch(16% .007 285) 0%, ${T.bg} 100%)` }}>
            <div style={{ fontSize: "3rem", marginBottom: "1.25rem" }}>🎉</div>
            <p style={{ color: T.primary, fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Loyalty Program</p>
            <h1 className="rc-s" style={{ fontSize: "clamp(1.75rem,5vw,3.25rem)", fontWeight: 800, color: T.fg, marginBottom: "1rem" }}>
              Every wash counts!<br />Get your 10th wash FREE.
            </h1>
            <p style={{ color: T.mutedFg, fontSize: "1.0625rem", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto" }}>
              Book with us, collect punches, and enjoy a complimentary detail on us.
            </p>
          </section>

          {/* How It Works */}
          <section style={{ padding: "4rem 1.5rem", backgroundColor: T.card }}>
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
              <h2 className="rc-s" style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 800, textAlign: "center", color: T.fg, marginBottom: "3rem" }}>
                How It Works
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1.5rem" }}>
                {STEPS.map((step, i) => (
                  <div key={step.title} className="rc-card" style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: "1rem", padding: "1.75rem", textAlign: "center" }}>
                    <div style={{ width: "3rem", height: "3rem", borderRadius: "9999px", backgroundColor: T.secondary, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", color: T.primary }}>
                      {step.icon}
                    </div>
                    <div style={{ backgroundColor: T.primary, color: T.primaryFg, borderRadius: "9999px", width: "1.375rem", height: "1.375rem", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
                      {i + 1}
                    </div>
                    <h3 className="rc-s" style={{ color: T.fg, fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>{step.title}</h3>
                    <p style={{ color: T.mutedFg, fontSize: "0.875rem", lineHeight: 1.6 }}>{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Punch Card Visual */}
          <section style={{ padding: "4rem 1.5rem" }}>
            <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
              <h2 className="rc-s" style={{ fontSize: "clamp(1.25rem,3vw,1.875rem)", fontWeight: 800, color: T.fg, marginBottom: "0.75rem" }}>
                Your Punch Card
              </h2>
              <p style={{ color: T.mutedFg, fontSize: "0.9375rem", marginBottom: "2rem" }}>
                10 washes = 1 FREE detail
              </p>
              <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "1.25rem", padding: "2rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  {Array.from({ length: TOTAL }).map((_, i) => (
                    <div key={i} className="rc-punch"
                      style={{
                        aspectRatio: "1",
                        borderRadius: "0.75rem",
                        border: `2px solid ${i < punches ? T.primary : T.border}`,
                        backgroundColor: i < punches ? `${T.primary}22` : T.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.25rem",
                      }}>
                      {i < punches ? "🚗" : ""}
                    </div>
                  ))}
                </div>
                {result && !result.error && (
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: "1.25rem" }}>
                    {result.name && <p style={{ color: T.fg, fontWeight: 600, marginBottom: "0.25rem" }}>Welcome back, {result.name}!</p>}
                    <p style={{ color: T.primary, fontWeight: 700, fontSize: "1.125rem" }}>
                      {punches} / {TOTAL} punches
                    </p>
                    <p style={{ color: T.mutedFg, fontSize: "0.875rem", marginTop: "0.25rem" }}>
                      {punches >= TOTAL ? "🎉 You've earned a FREE wash! Call us to redeem." : `${TOTAL - punches} more wash${TOTAL - punches === 1 ? "" : "es"} until your free detail!`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Check Your Punches */}
          <section style={{ padding: "4rem 1.5rem", backgroundColor: T.card }}>
            <div style={{ maxWidth: "480px", margin: "0 auto" }}>
              <h2 className="rc-s" style={{ fontSize: "clamp(1.5rem,3.5vw,2rem)", fontWeight: 800, textAlign: "center", color: T.fg, marginBottom: "0.75rem" }}>
                Check Your Punches
              </h2>
              <p style={{ color: T.mutedFg, textAlign: "center", marginBottom: "2rem", fontSize: "0.9375rem" }}>
                Enter your phone number to look up your punch card.
              </p>
              <form onSubmit={lookup} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <input
                  type="tel"
                  placeholder="(954) 555-0123"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ width: "100%", padding: "0.875rem 1rem", backgroundColor: T.bg, color: T.fg, border: `1px solid ${T.border}`, borderRadius: "0.625rem", fontSize: "1rem", fontFamily: "inherit", outline: "none" }}
                />
                <button type="submit" disabled={loading} className="rc-btn"
                  style={{ width: "100%", padding: "0.9375rem", backgroundColor: T.primary, color: T.primaryFg, border: "none", borderRadius: "0.625rem", fontWeight: 700, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}>
                  {loading ? "Looking up…" : "Check Punches"}
                </button>
              </form>

              {result?.error && (
                <p style={{ color: "oklch(57.7% .245 27.325)", fontSize: "0.875rem", textAlign: "center", marginTop: "1rem" }}>
                  ⚠ {result.error}
                </p>
              )}

              <p style={{ color: T.mutedFg, textAlign: "center", fontSize: "0.8125rem", marginTop: "1.5rem" }}>
                Questions? Call us at{" "}
                <a href="tel:9549131307" style={{ color: T.primary, textDecoration: "none" }}>(954)-913-1307</a>
                {" "}or email{" "}
                <a href="mailto:Remaincleanservicesllc@yahoo.com" style={{ color: T.primary, textDecoration: "none" }}>Remaincleanservicesllc@yahoo.com</a>
              </p>
            </div>
          </section>

          {/* CTA */}
          <section style={{ padding: "5rem 1.5rem", textAlign: "center" }}>
            <div style={{ maxWidth: "520px", margin: "0 auto" }}>
              <h2 className="rc-s" style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 800, color: T.fg, marginBottom: "1rem" }}>
                Start Earning Today
              </h2>
              <p style={{ color: T.mutedFg, lineHeight: 1.7, marginBottom: "2rem" }}>
                Every detail gets you one punch closer to a free wash.
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

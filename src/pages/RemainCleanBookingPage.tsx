import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Phone, Menu, X, Mail, Instagram, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const T = {
  bg:        "oklch(14.5% .005 285)",
  card:      "oklch(18% .005 285)",
  secondary: "oklch(22% .005 285)",
  border:    "oklch(30% .005 285)",
  fg:        "oklch(98.5% 0 0)",
  mutedFg:   "oklch(65% .01 285)",
  primary:   "oklch(79.5% .105 85)",
  primaryFg: "oklch(14.5% .005 285)",
  error:     "oklch(57.7% .245 27.325)",
} as const;

const LOGO = "https://remainclean.com/assets/logo-B_QawJUt.png";
const FONT = "https://cdn.gpteng.co/mcp-widgets/v1/fonts/CameraPlainVariable.woff2";

const PACKAGES = [
  { label: "Basic — $50",     value: "Basic",    price: 50  },
  { label: "Silver — $100",   value: "Silver",   price: 100 },
  { label: "Gold — $150",     value: "Gold",     price: 150 },
  { label: "Platinum — $200", value: "Platinum", price: 200 },
];

const SERVICE_AREAS = ["Fort Lauderdale", "Miami-Dade", "West Palm Beach"];

const TIMES = [
  "8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM",
  "1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
  "6:00 PM","7:00 PM","8:00 PM",
];

const SERVICE_TO_PKG: Record<string, string> = {
  "Exterior Wash & Shine": "Basic",
  "Interior Details":      "Silver",
  "Buff & Wax":            "Gold",
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function to24(t12: string) {
  const [time, period] = t12.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

const inp = (err?: string): React.CSSProperties => ({
  width: "100%", boxSizing: "border-box",
  padding: "0.8125rem 1rem",
  backgroundColor: T.bg, color: T.fg,
  border: `1px solid ${err ? T.error : T.border}`,
  borderRadius: "0.625rem", fontSize: "0.9375rem",
  outline: "none", fontFamily: "inherit",
});

function FieldRow({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={{ color: T.fg, fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
        {label}
        {required && <span style={{ color: T.error }}>*</span>}
        {hint && <span style={{ color: T.mutedFg, fontWeight: 400, fontSize: "0.8125rem" }}>({hint})</span>}
      </label>
      {children}
      {error && <p style={{ color: T.error, fontSize: "0.78rem", margin: 0 }}>⚠ {error}</p>}
    </div>
  );
}

function Chevron() {
  return <span style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", color: T.mutedFg, pointerEvents: "none", fontSize: "0.7rem" }}>▼</span>;
}

type F = { name: string; email: string; phone: string; vehicle: string; pkg: string; area: string; date: string; time: string; notes: string; };

export default function RemainCleanBookingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const qp = new URLSearchParams(window.location.search);
  const [form, setForm] = useState<F>({
    name:    qp.get("name")    ?? "",
    email:   qp.get("email")   ?? "",
    phone:   qp.get("phone")   ?? "",
    vehicle: qp.get("vehicleType") ?? "",
    pkg:     SERVICE_TO_PKG[qp.get("service") ?? ""] ?? "",
    area:    "",
    date:    "",
    time:    "",
    notes:   "",
  });

  const [errors, setErrors]   = useState<Partial<F>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [confNum, setConfNum] = useState("");
  const [orgId, setOrgId]     = useState<string | null>(null);

  // Resolve org ID once on mount via the same RPC used by PublicBookingPage
  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const { data } = await supabase
          .rpc('get_public_booking_data', { p_org_slug: 'remain-clean-services' });
        const id = (data as any)?.organization?.id;
        if (id) setOrgId(id);
      } catch {
        /* non-blocking — falls back to slug */
      }
    };
    fetchOrg();
  }, []);

  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const e: Partial<F> = {};
    if (!form.name.trim())    e.name    = "Required";
    if (!form.email.trim())   e.email   = "Required";
    if (!form.phone.trim())   e.phone   = "Required";
    if (!form.vehicle.trim()) e.vehicle = "Required";
    if (!form.pkg)            e.pkg     = "Required";
    if (!form.area)           e.area    = "Required";
    if (!form.date)           e.date    = "Required";
    if (!form.time)           e.time    = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const parts = form.name.trim().split(/\s+/);
      const pkg = PACKAGES.find(p => p.value === form.pkg);
      const { data, error } = await supabase.functions.invoke("external-booking-webhook", {
        body: {
          first_name:        parts[0] || "",
          last_name:         parts.slice(1).join(" ") || "-",
          email:             form.email.trim(),
          phone:             form.phone,
          address:           form.area,
          service_name:      `${form.pkg} Package`,
          total_amount:      pkg?.price ?? 0,
          scheduled_at:      new Date(`${form.date}T${to24(form.time)}:00`).toISOString(),
          notes:             [`Vehicle: ${form.vehicle}`, `Area: ${form.area}`, form.notes].filter(Boolean).join("\n"),
          ...(orgId ? { organization_id: orgId } : { organization_slug: "remain-clean-services" }),
        },
      });
      if (error) throw error;
      const num = data?.booking_number ? `RC-${data.booking_number}` : `RC-${Math.random().toString(36).slice(2,9).toUpperCase()}`;
      setConfNum(num);
      setDone(true);
    } catch (err: unknown) {
      // Log the raw server error for debugging
      if (err && typeof err === "object" && "context" in err) {
        try { (err as any).context.json().then((b: unknown) => console.error("[RC booking] server error:", b)); } catch { /* ignore */ }
      } else {
        console.error("[RC booking] error:", err);
      }
      setErrors({ notes: "Something went wrong. Please try again or call us at (954)-913-1307." });
    } finally {
      setLoading(false);
    }
  };

  const selStyle = (err?: string): React.CSSProperties => ({
    ...inp(err), appearance: "none", paddingRight: "2.5rem", cursor: "pointer",
  });

  return (
    <>
      <style>{`
        @font-face { font-family:'CameraPlainVariable'; src:url('${FONT}') format('woff2'); font-weight:100 900; font-display:swap; }
        .rc-s { font-family:'CameraPlainVariable',Georgia,serif; }
        .rc-nl { background:none; border:none; cursor:pointer; font-size:.875rem; transition:color .2s; text-decoration:none; }
        .rc-nl:hover { color:oklch(98.5% 0 0)!important; }
        .rc-inp:focus { border-color:oklch(79.5% .105 85)!important; outline:none!important; }
        .rc-sel option { background:oklch(18% .005 285); color:oklch(98.5% 0 0); }
        .rc-btn:hover { opacity:.88; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      <Seo title="Book Your Detail | Remain Clean Services" description="Book premium mobile detailing with Remain Clean Services. Fort Lauderdale, Miami-Dade & West Palm Beach." canonicalPath="/book/remainclean" />

      <div style={{ backgroundColor: T.bg, color: T.fg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Status bar */}
        <div style={{ backgroundColor: T.card, borderBottom: `1px solid ${T.border}`, textAlign: "center", padding: "0.5rem", fontSize: "0.75rem", color: T.mutedFg, letterSpacing: "0.05em" }}>
          Open 7 Days a Week&nbsp;•&nbsp;8AM – 9PM
        </div>

        {/* Nav */}
        <nav style={{ backgroundColor: T.bg, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0.875rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
              <img src={LOGO} alt="Remain Clean" style={{ width: "2rem", height: "2rem", borderRadius: "9999px", objectFit: "cover", border: `1px solid ${T.border}` }} />
              <span className="rc-s" style={{ color: T.fg, fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.04em" }}>Remain Clean Services</span>
            </Link>

            <div className="rcnav-d" style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
              <style>{`@media(max-width:767px){.rcnav-d{display:none!important}}`}</style>
              {[{l:"Home",t:"/remainclean"},{l:"Services",t:"/remainclean/services"},{l:"Gallery",t:"/remainclean/gallery"},{l:"Rewards",t:"/remainclean/rewards"},{l:"Contact",t:"/remainclean#contact"}].map(n =>
                <Link key={n.l} to={n.t} className="rc-nl" style={{ color: T.mutedFg }}>{n.l}</Link>
              )}
              <a href="tel:9549131307" className="rc-nl" style={{ color: T.mutedFg, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Phone size={13} />Call Now: (954)-913-1307
              </a>
              <Link to="/book/remainclean" style={{ backgroundColor: T.primary, color: T.primaryFg, padding: "0.5rem 1.25rem", borderRadius: "9999px", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none" }}>Book Now</Link>
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", color: T.fg, cursor: "pointer" }} className="rcnav-m" aria-label="menu">
              <style>{`@media(min-width:768px){.rcnav-m{display:none!important}}`}</style>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
          {menuOpen && (
            <div style={{ backgroundColor: T.card, borderTop: `1px solid ${T.border}`, padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {[{l:"Home",t:"/remainclean"},{l:"Services",t:"/remainclean/services"},{l:"Gallery",t:"/remainclean/gallery"},{l:"Book Now",t:"/book/remainclean"},{l:"Rewards",t:"/remainclean/rewards"},{l:"Contact",t:"/remainclean#contact"}].map(n =>
                <Link key={n.l} to={n.t} onClick={() => setMenuOpen(false)} className="rc-nl" style={{ color: T.mutedFg, padding: "0.625rem 0.5rem" }}>{n.l}</Link>
              )}
              <a href="tel:9549131307" style={{ color: T.mutedFg, padding: "0.625rem 0.5rem", fontSize: "0.875rem", textDecoration: "none" }}>📞 (954)-913-1307</a>
            </div>
          )}
        </nav>

        {/* Promo */}
        <div style={{ backgroundColor: T.secondary, borderBottom: `1px solid ${T.border}`, textAlign: "center", padding: "0.625rem", fontSize: "0.8125rem", color: T.mutedFg }}>
          💰 Use code <strong style={{ color: T.primary }}>MarioWorld4L</strong> for up to $20 off!
        </div>

        {/* Main */}
        <main style={{ flex: 1, padding: "3.5rem 1rem 5rem" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>

            {done ? (
              /* Confirmation */
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <CheckCircle2 size={56} style={{ color: T.primary, margin: "0 auto 1.5rem", display: "block" }} />
                <h1 className="rc-s" style={{ fontSize: "clamp(1.75rem,5vw,2.5rem)", fontWeight: 800, color: T.fg, marginBottom: "0.75rem" }}>
                  Booking Request Sent!
                </h1>
                <p style={{ color: T.mutedFg, marginBottom: "2rem", lineHeight: 1.7 }}>
                  We'll confirm your appointment via phone call within a few hours.
                </p>
                <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "0.75rem", padding: "1.25rem", display: "inline-block", marginBottom: "2.5rem" }}>
                  <p style={{ color: T.mutedFg, fontSize: "0.8125rem", marginBottom: "0.25rem" }}>Confirmation Number</p>
                  <p style={{ color: T.primary, fontWeight: 700, fontSize: "1.5rem", letterSpacing: "0.06em" }}>{confNum}</p>
                </div>
                <br />
                <Link to="/" style={{ backgroundColor: T.primary, color: T.primaryFg, borderRadius: "9999px", fontWeight: 600, padding: "0.875rem 2.25rem", fontSize: "1rem", textDecoration: "none" }}>
                  ← Back to Home
                </Link>
              </div>
            ) : (
              /* Form */
              <>
                <h1 className="rc-s" style={{ fontSize: "clamp(2rem,6vw,3rem)", fontWeight: 800, color: T.fg, marginBottom: "0.5rem", textAlign: "center" }}>
                  Book Your Detail
                </h1>
                <p style={{ color: T.mutedFg, textAlign: "center", marginBottom: "2.5rem", lineHeight: 1.65 }}>
                  Fill out the form and we'll confirm your appointment.
                </p>

                <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                  {/* Name + Phone */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <FieldRow label="Full Name" required error={errors.name}>
                      <input className="rc-inp" type="text" placeholder="John Smith" value={form.name} onChange={set("name")} style={inp(errors.name)} />
                    </FieldRow>
                    <FieldRow label="Phone" required error={errors.phone}>
                      <input className="rc-inp" type="tel" placeholder="(954) 555-0123" value={form.phone} onChange={set("phone")} style={inp(errors.phone)} />
                    </FieldRow>
                  </div>

                  {/* Email */}
                  <FieldRow label="Email" required error={errors.email}>
                    <input className="rc-inp" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} style={inp(errors.email)} />
                  </FieldRow>

                  {/* Vehicle */}
                  <FieldRow label="Vehicle" required hint="Year, Make, Model" error={errors.vehicle}>
                    <input className="rc-inp" type="text" placeholder="e.g. 2021 BMW X5" value={form.vehicle} onChange={set("vehicle")} style={inp(errors.vehicle)} />
                  </FieldRow>

                  {/* Package */}
                  <FieldRow label="Package" required error={errors.pkg}>
                    <div style={{ position: "relative" }}>
                      <select className="rc-inp rc-sel" value={form.pkg} onChange={set("pkg")} style={selStyle(errors.pkg)}>
                        <option value="">Select a package…</option>
                        {PACKAGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                      <Chevron />
                    </div>
                  </FieldRow>

                  {/* Service Area */}
                  <FieldRow label="Service Area" required error={errors.area}>
                    <div style={{ position: "relative" }}>
                      <select className="rc-inp rc-sel" value={form.area} onChange={set("area")} style={selStyle(errors.area)}>
                        <option value="">Select service area…</option>
                        {SERVICE_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <Chevron />
                    </div>
                  </FieldRow>

                  {/* Date + Time */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <FieldRow label="Preferred Date" required error={errors.date}>
                      <input className="rc-inp" type="date" value={form.date} min={todayStr()} onChange={set("date")} style={{ ...inp(errors.date), colorScheme: "dark" }} />
                    </FieldRow>
                    <FieldRow label="Preferred Time" required error={errors.time}>
                      <div style={{ position: "relative" }}>
                        <select className="rc-inp rc-sel" value={form.time} onChange={set("time")} style={selStyle(errors.time)}>
                          <option value="">Select time…</option>
                          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <Chevron />
                      </div>
                    </FieldRow>
                  </div>

                  {/* Notes */}
                  <FieldRow label="Additional Notes" hint="optional">
                    <textarea className="rc-inp" placeholder="Anything we should know about your vehicle or location?" value={form.notes} onChange={set("notes")} rows={3} style={{ ...inp(), resize: "vertical" }} />
                  </FieldRow>

                  {errors.notes && <p style={{ color: T.error, fontSize: "0.875rem" }}>⚠️ {errors.notes}</p>}

                  <button type="submit" disabled={loading} className="rc-btn"
                    style={{ width: "100%", padding: "1rem", fontSize: "1rem", fontWeight: 700, backgroundColor: T.primary, color: T.primaryFg, border: "none", borderRadius: "0.625rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "opacity .2s" }}>
                    {loading
                      ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />Submitting…</>
                      : "Submit Booking Request"}
                  </button>

                  <p style={{ textAlign: "center", color: T.mutedFg, fontSize: "0.8125rem", lineHeight: 1.6 }}>
                    We'll confirm your appointment via phone call within a few hours.
                  </p>
                </form>
              </>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer style={{ backgroundColor: T.bg, borderTop: `1px solid ${T.border}`, padding: "3.5rem 1.5rem" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "2.5rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
                <img src={LOGO} alt="" style={{ width: "2rem", height: "2rem", borderRadius: "9999px", objectFit: "cover", border: `1px solid ${T.border}` }} />
                <span className="rc-s" style={{ color: T.fg, fontWeight: 700, fontSize: "0.875rem" }}>REMAIN CLEAN SERVICES</span>
              </div>
              <p style={{ color: T.mutedFg, fontSize: "0.8125rem", lineHeight: 1.65 }}>Premium mobile detailing serving South Florida.</p>
              <p style={{ color: T.border, fontSize: "0.75rem", marginTop: "0.75rem" }}>Fort Lauderdale • Miami-Dade • West Palm Beach</p>
            </div>
            <div>
              <p style={{ color: T.fg, fontWeight: 600, fontSize: "0.8125rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>Quick Links</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[{l:"Home",t:"/remainclean"},{l:"Services & Pricing",t:"/remainclean/services"},{l:"Book Appointment",t:"/book/remainclean"},{l:"Rewards",t:"/remainclean/rewards"},{l:"Contact",t:"/remainclean#contact"}].map(x =>
                  <li key={x.l}><Link to={x.t} className="rc-nl" style={{ color: T.mutedFg, padding: 0 }}>{x.l}</Link></li>
                )}
              </ul>
            </div>
            <div>
              <p style={{ color: T.fg, fontWeight: 600, fontSize: "0.8125rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>Contact &amp; Hours</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <a href="tel:9549131307" style={{ color: T.mutedFg, textDecoration: "none", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Phone size={14} style={{ color: T.primary }} />(954)-913-1307</a>
                <a href="mailto:Remaincleanservicesllc@yahoo.com" style={{ color: T.mutedFg, textDecoration: "none", fontSize: "0.875rem", display: "flex", alignItems: "flex-start", gap: "0.5rem", wordBreak: "break-all" }}><Mail size={14} style={{ color: T.primary, flexShrink: 0, marginTop: "0.125rem" }} />Remaincleanservicesllc@yahoo.com</a>
                <a href="https://instagram.com/remaincleanservice" target="_blank" rel="noopener noreferrer" style={{ color: T.mutedFg, textDecoration: "none", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Instagram size={14} style={{ color: T.primary }} />@remaincleanservice</a>
                <div style={{ marginTop: "0.25rem" }}>
                  <p style={{ color: T.fg, fontWeight: 600, fontSize: "0.8125rem", marginBottom: "0.25rem" }}>Hours</p>
                  <p style={{ color: T.mutedFg, fontSize: "0.8125rem" }}>Monday – Sunday, 8:00 AM – 9:00 PM</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ maxWidth: "1100px", margin: "2.5rem auto 0", paddingTop: "1.5rem", borderTop: `1px solid ${T.border}`, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "0.75rem", fontSize: "0.75rem", color: T.border }}>
            <span>© 2026 Remain Clean Services LLC. All rights reserved.</span>
            <Link to="/privacy-policy" style={{ color: T.mutedFg, textDecoration: "none" }}>Privacy Policy</Link>
          </div>
        </footer>
      </div>
    </>
  );
}

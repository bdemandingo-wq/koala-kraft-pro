import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Star, Menu, X, Phone, MapPin, Instagram, Mail } from "lucide-react";

/* ─── Theme tokens from remainclean.com CSS ───────────────────────────────── */
const T = {
  bg:          "oklch(14.5% .005 285)",   // --background
  card:        "oklch(18% .005 285)",     // --card
  secondary:   "oklch(22% .005 285)",     // --secondary
  muted:       "oklch(25% .005 285)",     // --muted
  border:      "oklch(30% .005 285)",     // --border
  fg:          "oklch(98.5% 0 0)",        // --foreground  (near-white)
  mutedFg:     "oklch(65% .01 285)",      // --muted-foreground
  primary:     "oklch(79.5% .105 85)",    // --primary (gold)
  primaryFg:   "oklch(14.5% .005 285)",   // --primary-foreground (dark on gold)
} as const;

const LOGO = "https://remainclean.com/assets/logo-B_QawJUt.png";
const FONT = "https://cdn.gpteng.co/mcp-widgets/v1/fonts/CameraPlainVariable.woff2";
const ORG_SLUG = "remainclean";

const VEHICLE_TYPES = [
  "Sedan / Coupe",
  "SUV / Crossover",
  "Truck",
  "Minivan",
  "Sports Car",
  "Luxury / Exotic",
  "RV / Motorhome",
];

const BOOK_SERVICES = [
  { icon: "🚿", name: "Express Detail" },
  { icon: "🪥", name: "Full Detail"    },
  { icon: "✨", name: "Premium Detail"  },
];

const services = [
  {
    icon: "🚿",
    name: "Express Detail",
    desc: "Hand Wash, Quick Vacuum, Light Wipe Down, Air Freshener. Starting at $60.",
  },
  {
    icon: "🪥",
    name: "Full Detail",
    desc: "Deep Interior Clean, Steam & Shampoo, Exterior Wash + Protection. Starting at $150.",
  },
  {
    icon: "✨",
    name: "Premium Detail",
    desc: "Clay Bar Treatment, Ceramic Sealant, Stain & Odor Removal, Leather Conditioning. $295.",
  },
];

const areas = ["Fort Lauderdale", "Miami-Dade", "West Palm Beach"];

const testimonials = [
  {
    name: "Marcus J.",
    location: "Fort Lauderdale",
    text: "Hands down the best mobile detail I've ever had. My BMW looked better than the day I drove it off the lot. Will definitely be using them again!",
  },
  {
    name: "Sophia R.",
    location: "Miami-Dade",
    text: "Got the Gold package and it was worth every penny. The interior smells amazing and the paint is gleaming. These guys really care about their work.",
  },
  {
    name: "David T.",
    location: "West Palm Beach",
    text: "I've tried other detailers but nobody comes close to Remain Clean. The Platinum package is a full transformation. My neighbors thought I got a new car!",
  },
  {
    name: "Ashley M.",
    location: "Fort Lauderdale",
    text: "Super professional and on time. They came right to my driveway and had my Audi looking showroom-ready in no time. Highly recommend!",
  },
  {
    name: "Carlos G.",
    location: "Miami-Dade",
    text: "The buff and wax service removed years of sun damage from my truck. The paint looks brand new. Amazing attention to detail.",
  },
  {
    name: "Nicole W.",
    location: "West Palm Beach",
    text: "Love the rewards program! Already on my 6th wash. The consistency is what keeps me coming back — every time feels like the first time.",
  },
];

const navLinks = [
  { label: "Home",     anchor: "top"               },
  { label: "Services", anchor: "services"           },
  { label: "Gallery",  href: "/remainclean/gallery" },
  { label: "Book Now", anchor: "book",   cta: true  },
  { label: "Rewards",  anchor: "rewards"            },
  { label: "Contact",  anchor: "contact"            },
  { label: "Log In",   anchor: "login",  login: true},
];

const footerQuickLinks = [
  { label: "Home",                anchor: "top"      },
  { label: "Services & Pricing",  anchor: "services" },
  { label: "Book Appointment",    anchor: "book"     },
  { label: "Rewards",             anchor: "rewards"  },
  { label: "Contact",             anchor: "contact"  },
];

/* ─────────────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Inline booking form state
  const [bkService,     setBkService]     = useState("");
  const [bkVehicle,     setBkVehicle]     = useState(VEHICLE_TYPES[0]);
  const [bkName,        setBkName]        = useState("");
  const [bkPhone,       setBkPhone]       = useState("");
  const [bkEmail,       setBkEmail]       = useState("");
  const [bkError,       setBkError]       = useState("");
  const bookSectionRef = useRef<HTMLElement>(null);

  const handleInlineBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bkService) { setBkError("Please select a service."); return; }
    if (!bkName.trim()) { setBkError("Please enter your name."); return; }
    if (!bkPhone.trim()) { setBkError("Please enter your phone number."); return; }
    setBkError("");
    const params = new URLSearchParams({
      service:     bkService,
      vehicleType: bkVehicle,
      name:        bkName.trim(),
      phone:       bkPhone.trim(),
      ...(bkEmail.trim() && { email: bkEmail.trim() }),
    });
    navigate(`/book/${ORG_SLUG}?${params.toString()}`);
  };

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    if (id === "top") return window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to inline booking form; navigate is used by the form submit itself
  const bookNow = () => document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  const goToLogin = () => navigate("/login");

  /* shared button styles */
  const btnPrimary: React.CSSProperties = {
    backgroundColor: T.primary,
    color: T.primaryFg,
    borderRadius: "9999px",
    fontWeight: 600,
    padding: "0.75rem 2rem",
    fontSize: "0.875rem",
    transition: "opacity .2s",
    cursor: "pointer",
    border: "none",
    display: "inline-block",
    textDecoration: "none",
  };
  const btnOutline: React.CSSProperties = {
    backgroundColor: "transparent",
    color: T.fg,
    borderRadius: "9999px",
    fontWeight: 600,
    padding: "0.75rem 2rem",
    fontSize: "0.875rem",
    transition: "background-color .2s",
    cursor: "pointer",
    border: `1px solid ${T.border}`,
    display: "inline-block",
    textDecoration: "none",
  };

  return (
    <>
      {/* ── Inject the CameraPlainVariable font ─────────────────────────── */}
      <style>{`
        @font-face {
          font-family: 'CameraPlainVariable';
          src: url('${FONT}') format('woff2');
          font-weight: 100 900;
          font-display: swap;
        }
        .rc-serif {
          font-family: 'CameraPlainVariable', Georgia, serif;
        }
        .rc-btn-primary:hover { opacity: 0.88; }
        .rc-btn-outline:hover  { background-color: oklch(30% .005 285); }
        .rc-nav-link { color: ${T.mutedFg}; background: none; border: none; cursor: pointer; font-size: 0.875rem; transition: color .2s; }
        .rc-nav-link:hover { color: ${T.fg}; }
        .rc-card:hover { background-color: oklch(20% .005 285) !important; }
        .rc-area-pill:hover { background-color: oklch(25% .005 285) !important; }
      `}</style>

      <Seo
        title="Remain Clean Services | Premium Mobile Detailing — Fort Lauderdale, Miami-Dade & West Palm Beach"
        description="Premium mobile detailing — we bring the showroom to you. Serving Fort Lauderdale, Miami-Dade & West Palm Beach. Open 7 days a week 8AM–9PM."
        canonicalPath="/"
      />

      <div style={{ backgroundColor: T.bg, color: T.fg, minHeight: "100vh" }}>

        {/* ── 1. Status Banner ───────────────────────────────────────────── */}
        <div
          style={{
            backgroundColor: T.card,
            borderBottom: `1px solid ${T.border}`,
            textAlign: "center",
            padding: "0.5rem 1rem",
            fontSize: "0.75rem",
            color: T.mutedFg,
            letterSpacing: "0.05em",
          }}
        >
          Open 7 Days a Week&nbsp;&bull;&nbsp;8AM – 9PM
        </div>

        {/* ── 2. Navigation ──────────────────────────────────────────────── */}
        <nav
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            backgroundColor: T.bg,
            borderBottom: `1px solid ${T.border}`,
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              padding: "0.875rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Logo + wordmark */}
            <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
              <img
                src={LOGO}
                alt="Remain Clean Services"
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "9999px",
                  objectFit: "cover",
                  border: `1px solid ${T.border}`,
                }}
              />
              <span
                className="rc-serif"
                style={{ color: T.fg, fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.04em" }}
              >
                Remain Clean Services
              </span>
            </a>

            {/* Desktop links */}
            <div className="rc-desktop-nav" style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
              <style>{`
                @media (max-width: 767px) { .rc-desktop-nav { display: none !important; } }
              `}</style>
              {navLinks.map(({ label, anchor, cta, login, href }: any) =>
                cta ? (
                  <button
                    key={label}
                    onClick={bookNow}
                    className="rc-btn-primary"
                    style={{ ...btnPrimary, padding: "0.5rem 1.25rem" }}
                  >
                    {label}
                  </button>
                ) : login ? (
                  <button
                    key={label}
                    onClick={goToLogin}
                    className="rc-nav-link"
                    style={{ color: T.mutedFg, fontWeight: 500 }}
                  >
                    {label}
                  </button>
                ) : href ? (
                  <button key={label} className="rc-nav-link" onClick={() => navigate(href)}>
                    {label}
                  </button>
                ) : (
                  <button key={label} className="rc-nav-link" onClick={() => scrollTo(anchor)}>
                    {label}
                  </button>
                )
              )}
              <a
                href="tel:9549131307"
                className="rc-nav-link"
                style={{ display: "flex", alignItems: "center", gap: "0.375rem", textDecoration: "none", color: T.mutedFg, fontSize: "0.875rem" }}
              >
                <Phone size={13} />
                Call Now: (954)-913-1307
              </a>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: "none", border: "none", color: T.fg, cursor: "pointer", padding: "0.25rem" }}
              className="rc-mobile-toggle"
              aria-label="Toggle menu"
            >
              <style>{`@media (min-width: 768px) { .rc-mobile-toggle { display: none !important; } }`}</style>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div
              style={{
                backgroundColor: T.card,
                borderTop: `1px solid ${T.border}`,
                padding: "1rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              {navLinks.map(({ label, anchor, cta, login, href }: any) =>
                cta ? (
                  <button
                    key={label}
                    onClick={bookNow}
                    className="rc-btn-primary"
                    style={{ ...btnPrimary, width: "100%", marginTop: "0.5rem" }}
                  >
                    {label}
                  </button>
                ) : login ? (
                  <button
                    key={label}
                    onClick={goToLogin}
                    className="rc-nav-link"
                    style={{ textAlign: "left", padding: "0.625rem 0.5rem", borderRadius: "0.5rem", width: "100%", fontWeight: 500 }}
                  >
                    {label}
                  </button>
                ) : href ? (
                  <button
                    key={label}
                    className="rc-nav-link"
                    style={{ textAlign: "left", padding: "0.625rem 0.5rem", borderRadius: "0.5rem", width: "100%" }}
                    onClick={() => { setMenuOpen(false); navigate(href); }}
                  >
                    {label}
                  </button>
                ) : (
                  <button
                    key={label}
                    className="rc-nav-link"
                    style={{ textAlign: "left", padding: "0.625rem 0.5rem", borderRadius: "0.5rem", width: "100%" }}
                    onClick={() => scrollTo(anchor)}
                  >
                    {label}
                  </button>
                )
              )}
              <a
                href="tel:9549131307"
                style={{ color: T.mutedFg, textDecoration: "none", padding: "0.625rem 0.5rem", fontSize: "0.875rem" }}
              >
                📞 (954)-913-1307
              </a>
            </div>
          )}
        </nav>

        {/* ── 3. Promo Banner ────────────────────────────────────────────── */}
        <div
          style={{
            backgroundColor: T.secondary,
            borderBottom: `1px solid ${T.border}`,
            textAlign: "center",
            padding: "0.625rem 1rem",
            fontSize: "0.8125rem",
            color: T.mutedFg,
          }}
        >
          💰 Use code{" "}
          <strong style={{ color: T.primary }}>MarioWorld4L</strong>
          {" "}for up to $20 off!
        </div>

        {/* ── 4. Hero ────────────────────────────────────────────────────── */}
        <section
          style={{
            minHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "4rem 1rem",
            textAlign: "center",
            background: `linear-gradient(to bottom, ${T.bg}, ${T.bg}, ${T.secondary})`,
          }}
        >
          {/* Logo mark */}
          <img
            src={LOGO}
            alt="Remain Clean Services"
            style={{
              width: "8rem",
              height: "8rem",
              borderRadius: "9999px",
              objectFit: "cover",
              border: `2px solid ${T.border}`,
              boxShadow: `0 8px 32px oklch(79.5% .105 85 / 20%)`,
              marginBottom: "1.75rem",
            }}
          />

          {/* Status pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              backgroundColor: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: "9999px",
              padding: "0.3rem 0.875rem",
              fontSize: "0.75rem",
              color: T.mutedFg,
              marginBottom: "1.5rem",
              letterSpacing: "0.04em",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "9999px", backgroundColor: T.primary, display: "inline-block" }} />
            Open 7 Days a Week • 8AM – 9PM
          </div>

          {/* Main heading */}
          <h1
            className="rc-serif"
            style={{
              fontSize: "clamp(2.5rem, 8vw, 4rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              color: T.fg,
              marginBottom: "1.25rem",
              maxWidth: "700px",
            }}
          >
            REMAIN{" "}
            <span style={{ color: T.primary }}>CLEAN</span>
            {" "}SERVICES
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontSize: "1.125rem",
              color: T.mutedFg,
              maxWidth: "520px",
              marginBottom: "2.5rem",
              lineHeight: 1.65,
            }}
          >
            Premium mobile detailing — we bring the showroom to you.{" "}
            <span style={{ color: T.fg }}>
              Serving Fort Lauderdale, Miami-Dade &amp; West Palm Beach.
            </span>
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem", justifyContent: "center", marginBottom: "2rem" }}>
            <button onClick={bookNow} className="rc-btn-primary" style={{ ...btnPrimary, padding: "0.875rem 2.25rem", fontSize: "1rem" }}>
              Book Appointment
            </button>
            <a href="tel:9549131307" className="rc-btn-outline" style={{ ...btnOutline, padding: "0.875rem 2.25rem", fontSize: "1rem" }}>
              Call (954)-913-1307
            </a>
          </div>

          {/* Stars */}
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={18} style={{ fill: "#facc15", color: "#facc15" }} />
            ))}
          </div>
        </section>

        {/* ── 4.5 Inline Booking Form ──────────────────────────────────── */}
        <section
          id="book"
          ref={bookSectionRef}
          style={{
            backgroundColor: T.card,
            borderTop: `1px solid ${T.border}`,
            borderBottom: `1px solid ${T.border}`,
            padding: "4rem 1rem",
          }}
        >
          <div style={{ maxWidth: "860px", margin: "0 auto" }}>
            <h2
              className="rc-serif"
              style={{
                textAlign: "center",
                fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                fontWeight: 800,
                color: T.fg,
                marginBottom: "0.5rem",
              }}
            >
              Book Your Detail
            </h2>
            <p style={{ textAlign: "center", color: T.mutedFg, marginBottom: "2.5rem", fontSize: "0.9375rem" }}>
              Fill in a few details and we'll take you straight to your appointment.
            </p>

            <form onSubmit={handleInlineBook} noValidate>
              {/* Service selection */}
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ color: T.fg, fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                  Select a Service <span style={{ color: "oklch(57.7% .245 27.325)" }}>*</span>
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.875rem" }}>
                  {BOOK_SERVICES.map((svc) => (
                    <button
                      key={svc.name}
                      type="button"
                      onClick={() => { setBkService(svc.name); setBkError(""); }}
                      style={{
                        backgroundColor: bkService === svc.name ? `oklch(79.5% .105 85 / 12%)` : T.bg,
                        border: `2px solid ${bkService === svc.name ? T.primary : T.border}`,
                        borderRadius: "0.75rem",
                        padding: "1.25rem 1rem",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all .2s",
                        color: T.fg,
                      }}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{svc.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{svc.name}</div>
                      {bkService === svc.name && (
                        <div style={{ color: T.primary, fontSize: "0.75rem", marginTop: "0.375rem", fontWeight: 700 }}>✓ Selected</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle type */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", color: T.fg, fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  Vehicle Type <span style={{ color: "oklch(57.7% .245 27.325)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    value={bkVehicle}
                    onChange={(e) => setBkVehicle(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 2.5rem 0.75rem 1rem",
                      backgroundColor: T.bg,
                      color: T.fg,
                      border: `1px solid ${T.border}`,
                      borderRadius: "0.625rem",
                      fontSize: "0.9375rem",
                      appearance: "none",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {VEHICLE_TYPES.map((v) => (
                      <option key={v} value={v} style={{ backgroundColor: T.card, color: T.fg }}>{v}</option>
                    ))}
                  </select>
                  {/* Chevron */}
                  <span style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", color: T.mutedFg, pointerEvents: "none", fontSize: "0.75rem" }}>▼</span>
                </div>
              </div>

              {/* Name + Phone row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", color: T.fg, fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                    Your Name <span style={{ color: "oklch(57.7% .245 27.325)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="John Smith"
                    value={bkName}
                    onChange={(e) => setBkName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      backgroundColor: T.bg,
                      color: T.fg,
                      border: `1px solid ${T.border}`,
                      borderRadius: "0.625rem",
                      fontSize: "0.9375rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", color: T.fg, fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                    Phone Number <span style={{ color: "oklch(57.7% .245 27.325)" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="(954) 555-0123"
                    value={bkPhone}
                    onChange={(e) => setBkPhone(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      backgroundColor: T.bg,
                      color: T.fg,
                      border: `1px solid ${T.border}`,
                      borderRadius: "0.625rem",
                      fontSize: "0.9375rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Email (optional) */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", color: T.fg, fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  Email <span style={{ color: T.mutedFg, fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={bkEmail}
                  onChange={(e) => setBkEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: T.bg,
                    color: T.fg,
                    border: `1px solid ${T.border}`,
                    borderRadius: "0.625rem",
                    fontSize: "0.9375rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Validation error */}
              {bkError && (
                <div style={{ color: "oklch(57.7% .245 27.325)", fontSize: "0.875rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  ⚠️ {bkError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="rc-btn-primary"
                style={{
                  width: "100%",
                  padding: "1rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  backgroundColor: T.primary,
                  color: T.primaryFg,
                  border: "none",
                  borderRadius: "0.625rem",
                  cursor: "pointer",
                  transition: "opacity .2s",
                  letterSpacing: "0.02em",
                }}
              >
                Book Appointment →
              </button>

              <p style={{ textAlign: "center", color: T.mutedFg, fontSize: "0.75rem", marginTop: "0.875rem" }}>
                No payment now. You'll pick your date/time and pay after service.
              </p>
            </form>
          </div>
        </section>

        {/* ── 5. Services ────────────────────────────────────────────────── */}
        <section id="services" style={{ backgroundColor: T.secondary, padding: "5rem 1rem" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <h2
              className="rc-serif"
              style={{
                textAlign: "center",
                fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                fontWeight: 800,
                color: T.fg,
                marginBottom: "0.5rem",
              }}
            >
              Our Services
            </h2>
            <p style={{ textAlign: "center", color: T.mutedFg, marginBottom: "3rem", fontSize: "0.9375rem" }}>
              Express Detail from $60 · Full Detail from $150 · Premium Detail $295
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
              {services.map((svc) => (
                <div
                  key={svc.name}
                  className="rc-card"
                  style={{
                    backgroundColor: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: "0.75rem",
                    padding: "2rem 1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    transition: "background-color .2s",
                    cursor: "default",
                  }}
                >
                  <span style={{ fontSize: "2.75rem", marginBottom: "1.25rem" }}>{svc.icon}</span>
                  <h3
                    className="rc-serif"
                    style={{ color: T.fg, fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.75rem" }}
                  >
                    {svc.name}
                  </h3>
                  <p style={{ color: T.mutedFg, fontSize: "0.875rem", lineHeight: 1.65 }}>{svc.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
              <button onClick={bookNow} className="rc-btn-primary" style={btnPrimary}>
                View All Packages &amp; Pricing →
              </button>
            </div>
          </div>
        </section>

        {/* ── 6. Service Areas ───────────────────────────────────────────── */}
        <section
          style={{
            backgroundColor: T.bg,
            borderTop: `1px solid ${T.border}`,
            padding: "4rem 1rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <h2
              className="rc-serif"
              style={{ color: T.fg, fontWeight: 800, fontSize: "clamp(1.5rem, 4vw, 2rem)", marginBottom: "0.5rem" }}
            >
              We Come to You
            </h2>
            <p style={{ color: T.mutedFg, marginBottom: "2.5rem", fontSize: "0.9375rem" }}>
              Proudly serving all of South Florida
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem", justifyContent: "center" }}>
              {areas.map((area) => (
                <div
                  key={area}
                  className="rc-area-pill"
                  style={{
                    backgroundColor: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: "9999px",
                    padding: "0.625rem 1.375rem",
                    fontSize: "0.875rem",
                    color: T.fg,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    transition: "background-color .2s",
                    cursor: "default",
                  }}
                >
                  <MapPin size={14} style={{ color: T.primary }} />
                  {area}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. Testimonials ────────────────────────────────────────────── */}
        <section
          id="testimonials"
          style={{ backgroundColor: T.secondary, padding: "5rem 1rem" }}
        >
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <h2
              className="rc-serif"
              style={{
                textAlign: "center",
                fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                fontWeight: 800,
                color: T.fg,
                marginBottom: "0.5rem",
              }}
            >
              What Our Clients Say
            </h2>
            <p style={{ textAlign: "center", color: T.mutedFg, marginBottom: "3rem", fontSize: "0.9375rem" }}>
              Real reviews from satisfied customers across South Florida.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  style={{
                    backgroundColor: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: "0.75rem",
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.2rem", marginBottom: "1rem" }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} style={{ fill: "#facc15", color: "#facc15" }} />
                    ))}
                  </div>
                  <p style={{ color: T.mutedFg, fontSize: "0.875rem", lineHeight: 1.7, flex: 1, marginBottom: "1rem" }}>
                    "{t.text}"
                  </p>
                  <div>
                    <p style={{ color: T.fg, fontWeight: 600, fontSize: "0.875rem" }}>{t.name}</p>
                    <p style={{ color: T.mutedFg, fontSize: "0.75rem" }}>{t.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. Rewards ─────────────────────────────────────────────────── */}
        <section
          id="rewards"
          style={{
            backgroundColor: T.bg,
            borderTop: `1px solid ${T.border}`,
            padding: "4.5rem 1rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏆</div>
            <h2
              className="rc-serif"
              style={{ color: T.fg, fontWeight: 800, fontSize: "clamp(1.5rem, 4vw, 2rem)", marginBottom: "0.75rem" }}
            >
              Rewards Program
            </h2>
            <p style={{ color: T.mutedFg, marginBottom: "2rem", fontSize: "0.9375rem", lineHeight: 1.65 }}>
              Earn points with every detail and redeem them for discounts, free services, and exclusive perks.
              The more you clean, the more you save.
            </p>
            <button onClick={() => navigate("/remainclean/rewards")} className="rc-btn-primary" style={btnPrimary}>
              Join Rewards Program
            </button>
          </div>
        </section>

        {/* ── 9. CTA Banner ──────────────────────────────────────────────── */}
        <section
          style={{
            background: `linear-gradient(135deg, ${T.primary}, oklch(70% .11 85))`,
            padding: "4.5rem 1rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h2
              className="rc-serif"
              style={{
                color: T.primaryFg,
                fontWeight: 800,
                fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                marginBottom: "0.75rem",
              }}
            >
              Ready for a Showroom Finish?
            </h2>
            <p style={{ color: "oklch(20% .005 285 / 75%)", marginBottom: "2rem", fontSize: "0.9375rem" }}>
              Book your mobile detail today. Satisfaction guaranteed.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem", justifyContent: "center" }}>
              <button
                onClick={bookNow}
                className="rc-btn-primary"
                style={{
                  ...btnPrimary,
                  backgroundColor: T.primaryFg,
                  color: T.primary,
                }}
              >
                Book Now
              </button>
              <button
                onClick={() => navigate("/remainclean/rewards")}
                style={{
                  ...btnOutline,
                  borderColor: "oklch(14.5% .005 285 / 40%)",
                  color: T.primaryFg,
                }}
                className="rc-btn-outline"
              >
                Join Rewards Program
              </button>
            </div>
          </div>
        </section>

        {/* ── 10. Footer ─────────────────────────────────────────────────── */}
        <footer
          id="contact"
          style={{
            backgroundColor: T.bg,
            borderTop: `1px solid ${T.border}`,
            padding: "3.5rem 1.5rem",
          }}
        >
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "2.5rem",
            }}
          >
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
                <img
                  src={LOGO}
                  alt="Remain Clean Services"
                  style={{ width: "2rem", height: "2rem", borderRadius: "9999px", objectFit: "cover", border: `1px solid ${T.border}` }}
                />
                <span className="rc-serif" style={{ color: T.fg, fontWeight: 700, fontSize: "0.875rem" }}>
                  REMAIN CLEAN SERVICES
                </span>
              </div>
              <p style={{ color: T.mutedFg, fontSize: "0.8125rem", lineHeight: 1.65 }}>
                Premium mobile detailing serving South Florida.
              </p>
              <p style={{ color: T.border, fontSize: "0.75rem", marginTop: "0.75rem" }}>
                Fort Lauderdale • Miami-Dade • West Palm Beach
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p style={{ color: T.fg, fontWeight: 600, fontSize: "0.8125rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>
                Quick Links
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {footerQuickLinks.map((l) => (
                  <li key={l.label}>
                    <button
                      className="rc-nav-link"
                      style={{ padding: 0 }}
                      onClick={() => scrollTo(l.anchor)}
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Hours */}
            <div>
              <p style={{ color: T.fg, fontWeight: 600, fontSize: "0.8125rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>
                Contact &amp; Hours
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <li>
                  <a href="tel:9549131307" style={{ color: T.mutedFg, textDecoration: "none", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Phone size={14} style={{ color: T.primary, flexShrink: 0 }} />
                    (954)-913-1307
                  </a>
                </li>
                <li>
                  <a href="mailto:Remaincleanservicesllc@yahoo.com" style={{ color: T.mutedFg, textDecoration: "none", fontSize: "0.875rem", display: "flex", alignItems: "flex-start", gap: "0.5rem", wordBreak: "break-all" }}>
                    <Mail size={14} style={{ color: T.primary, flexShrink: 0, marginTop: "0.125rem" }} />
                    Remaincleanservicesllc@yahoo.com
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/remaincleanservice" target="_blank" rel="noopener noreferrer" style={{ color: T.mutedFg, textDecoration: "none", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Instagram size={14} style={{ color: T.primary, flexShrink: 0 }} />
                    @remaincleanservice
                  </a>
                </li>
                <li style={{ marginTop: "0.25rem" }}>
                  <p style={{ color: T.fg, fontWeight: 600, fontSize: "0.8125rem", marginBottom: "0.25rem" }}>Hours of Operation</p>
                  <p style={{ color: T.mutedFg, fontSize: "0.8125rem" }}>Monday – Sunday</p>
                  <p style={{ color: T.mutedFg, fontSize: "0.8125rem" }}>8:00 AM – 9:00 PM</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div
            style={{
              maxWidth: "1100px",
              margin: "2.5rem auto 0",
              paddingTop: "1.5rem",
              borderTop: `1px solid ${T.border}`,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              fontSize: "0.75rem",
              color: T.border,
            }}
          >
            <span>© 2026 Remain Clean Services LLC. All rights reserved.</span>
            <Link to="/privacy-policy" style={{ color: T.mutedFg, textDecoration: "none" }}>
              Privacy Policy
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}

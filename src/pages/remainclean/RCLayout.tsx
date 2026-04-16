import { useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Phone, Mail, Instagram, Menu, X } from "lucide-react";

export const T = {
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

export const LOGO = "https://remainclean.com/assets/logo-B_QawJUt.png";
export const FONT = "https://cdn.gpteng.co/mcp-widgets/v1/fonts/CameraPlainVariable.woff2";

const NAV_LINKS = [
  { l: "Home",     t: "/remainclean" },
  { l: "Services", t: "/remainclean/services" },
  { l: "Gallery",  t: "/remainclean/gallery" },
  { l: "Book Now", t: "/book/remainclean" },
  { l: "Rewards",  t: "/remainclean/rewards" },
  { l: "Contact",  t: "/remainclean#contact" },
];

export function RCGlobalStyles() {
  return (
    <style>{`
      @font-face { font-family:'CameraPlainVariable'; src:url('${FONT}') format('woff2'); font-weight:100 900; font-display:swap; }
      .rc-s { font-family:'CameraPlainVariable',Georgia,serif; }
      .rc-nl { background:none; border:none; cursor:pointer; font-size:.875rem; transition:color .2s; text-decoration:none; }
      .rc-nl:hover { color:oklch(98.5% 0 0)!important; }
      .rc-btn:hover { opacity:.88; }
      .rc-card:hover { border-color:oklch(79.5% .105 85)!important; transform:translateY(-2px); }
      .rc-card { transition: border-color .2s, transform .2s; }
      * { box-sizing: border-box; }
    `}</style>
  );
}

export function RCNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToContact = useCallback(() => {
    setMenuOpen(false);
    if (location.pathname === "/remainclean" || location.pathname === "/remainclean/") {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/remainclean");
      setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, [location.pathname, navigate]);

  return (
    <nav style={{ backgroundColor: T.bg, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0.875rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/remainclean" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
          <img src={LOGO} alt="Remain Clean" style={{ width: "2rem", height: "2rem", borderRadius: "9999px", objectFit: "cover", border: `1px solid ${T.border}` }} />
          <span className="rc-s" style={{ color: T.fg, fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.04em" }}>Remain Clean Services</span>
        </Link>

        <div className="rcnav-d" style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
          <style>{`@media(max-width:767px){.rcnav-d{display:none!important}}`}</style>
          {NAV_LINKS.map(n =>
            n.l === "Book Now"
              ? <Link key={n.l} to={n.t} style={{ backgroundColor: T.primary, color: T.primaryFg, padding: "0.5rem 1.25rem", borderRadius: "9999px", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none" }}>{n.l}</Link>
              : n.l === "Contact"
                ? <button key={n.l} onClick={scrollToContact} className="rc-nl" style={{ color: T.mutedFg }}>{n.l}</button>
                : <Link key={n.l} to={n.t} className="rc-nl" style={{ color: T.mutedFg }}>{n.l}</Link>
          )}
          <a href="tel:9549131307" className="rc-nl" style={{ color: T.mutedFg, display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Phone size={13} />Call Now
          </a>
          <Link to="/login" style={{ color: T.mutedFg, border: `1px solid ${T.border}`, padding: "0.4rem 1rem", borderRadius: "9999px", fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none" }} className="rc-nl">
            Login
          </Link>
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", color: T.fg, cursor: "pointer" }} className="rcnav-m" aria-label="menu">
          <style>{`@media(min-width:768px){.rcnav-m{display:none!important}}`}</style>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div style={{ backgroundColor: T.card, borderTop: `1px solid ${T.border}`, padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {NAV_LINKS.map(n =>
            n.l === "Contact"
              ? <button key={n.l} onClick={scrollToContact} className="rc-nl" style={{ color: T.mutedFg, padding: "0.625rem 0.5rem", textAlign: "left" }}>{n.l}</button>
              : <Link key={n.l} to={n.t} onClick={() => setMenuOpen(false)} className="rc-nl" style={{ color: T.mutedFg, padding: "0.625rem 0.5rem" }}>{n.l}</Link>
          )}
          <a href="tel:9549131307" style={{ color: T.mutedFg, padding: "0.625rem 0.5rem", fontSize: "0.875rem", textDecoration: "none" }}>📞 (954)-913-1307</a>
          <Link to="/login" onClick={() => setMenuOpen(false)} className="rc-nl" style={{ color: T.mutedFg, padding: "0.625rem 0.5rem" }}>Login</Link>
        </div>
      )}
    </nav>
  );
}

export function RCFooter() {
  return (
    <footer id="contact" style={{ backgroundColor: T.bg, borderTop: `1px solid ${T.border}`, padding: "3.5rem 1.5rem" }}>
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
            {[
              { l: "Home",                t: "/remainclean" },
              { l: "Services & Pricing",  t: "/remainclean/services" },
              { l: "Book Appointment",    t: "/book/remainclean" },
              { l: "Rewards",             t: "/remainclean/rewards" },
              { l: "Contact",             t: "/remainclean#contact" },
            ].map(x =>
              x.l === "Contact"
                ? <li key={x.l}><a href={x.t} className="rc-nl" style={{ color: T.mutedFg, padding: 0 }}>{x.l}</a></li>
                : <li key={x.l}><Link to={x.t} className="rc-nl" style={{ color: T.mutedFg, padding: 0 }}>{x.l}</Link></li>
            )}
          </ul>
        </div>

        <div>
          <p style={{ color: T.fg, fontWeight: 600, fontSize: "0.8125rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>Contact &amp; Hours</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <a href="tel:9549131307" style={{ color: T.mutedFg, textDecoration: "none", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Phone size={14} style={{ color: T.primary }} />(954)-913-1307
            </a>
            <a href="mailto:Remaincleanservicesllc@yahoo.com" style={{ color: T.mutedFg, textDecoration: "none", fontSize: "0.875rem", display: "flex", alignItems: "flex-start", gap: "0.5rem", wordBreak: "break-all" }}>
              <Mail size={14} style={{ color: T.primary, flexShrink: 0, marginTop: "0.125rem" }} />Remaincleanservicesllc@yahoo.com
            </a>
            <a href="https://instagram.com/remaincleanservice" target="_blank" rel="noopener noreferrer" style={{ color: T.mutedFg, textDecoration: "none", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Instagram size={14} style={{ color: T.primary }} />@remaincleanservice
            </a>
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
  );
}

export function RCStatusBar() {
  return (
    <div style={{ backgroundColor: T.card, borderBottom: `1px solid ${T.border}`, textAlign: "center", padding: "0.5rem", fontSize: "0.75rem", color: T.mutedFg, letterSpacing: "0.05em" }}>
      ✦ Open 7 Days a Week&nbsp;•&nbsp;8AM – 9PM
    </div>
  );
}

export function RCPromo() {
  return (
    <div style={{ backgroundColor: T.secondary, borderBottom: `1px solid ${T.border}`, textAlign: "center", padding: "0.625rem", fontSize: "0.8125rem", color: T.mutedFg }}>
      💰 Use code <strong style={{ color: T.primary }}>MarioWorld4L</strong> for up to $20 off!
    </div>
  );
}

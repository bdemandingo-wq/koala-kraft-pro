import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Star, Menu, X, Phone, MapPin, Instagram, Mail } from "lucide-react";

const ORG_SLUG = "remainclean";

const services = [
  {
    icon: "🚿",
    name: "Exterior Wash & Shine",
    description:
      "Hand wash, dry, tire shine, and window cleaning for a spotless finish.",
  },
  {
    icon: "🪥",
    name: "Interior Details",
    description:
      "Deep vacuum, wipe-down, dashboard & console detailing, and fresh scent.",
  },
  {
    icon: "✨",
    name: "Buff & Wax",
    description:
      "Professional buffing and wax coating for lasting protection and shine.",
  },
];

const serviceAreas = [
  { icon: "📍", name: "Fort Lauderdale" },
  { icon: "📍", name: "Miami-Dade" },
  { icon: "📍", name: "West Palm Beach" },
];

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

const quickLinks = [
  { label: "Home", anchor: "top" },
  { label: "Services & Pricing", anchor: "services" },
  { label: "Book Appointment", anchor: "book" },
  { label: "Rewards", anchor: "rewards" },
  { label: "Contact", anchor: "contact" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleBookNow = () => {
    navigate(`/book/${ORG_SLUG}`);
  };

  return (
    <div
      className="min-h-screen text-[#c5c1b9]"
      style={{ backgroundColor: "#131313", fontFamily: "'Segoe UI', Roboto, -apple-system, sans-serif" }}
    >
      <Seo
        title="Remain Clean Services | Premium Mobile Detailing — Fort Lauderdale, Miami-Dade & West Palm Beach"
        description="Premium mobile detailing — we bring the showroom to you. Serving Fort Lauderdale, Miami-Dade & West Palm Beach. Open 7 days a week, 8AM–9PM."
        canonicalPath="/"
      />

      {/* ── Status Banner ── */}
      <div
        className="w-full text-center text-xs py-2 px-4 font-medium tracking-wide"
        style={{ backgroundColor: "#1b1b1b", color: "#c5c1b9", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        Open 7 Days a Week&nbsp;•&nbsp;8AM – 9PM
      </div>

      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-50 px-4 py-3"
        style={{ backgroundColor: "rgba(19,19,19,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            className="font-bold text-base tracking-widest uppercase"
            style={{ color: "#dcdad5" }}
          >
            Remain Clean Services
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {[
              { label: "Home", anchor: "top" },
              { label: "Services", anchor: "services" },
              { label: "Gallery", anchor: "gallery" },
              { label: "Rewards", anchor: "rewards" },
              { label: "Contact", anchor: "contact" },
            ].map(({ label, anchor }) => (
              <button
                key={label}
                onClick={() => scrollTo(anchor)}
                className="text-sm transition-colors"
                style={{ color: "#c5c1b9" }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#dcdad5")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#c5c1b9")}
              >
                {label}
              </button>
            ))}
            <a
              href="tel:9549131307"
              className="text-sm flex items-center gap-1.5 transition-colors"
              style={{ color: "#c5c1b9" }}
            >
              <Phone className="h-3.5 w-3.5" />
              Call Now: (954)-913-1307
            </a>
            <button
              onClick={handleBookNow}
              className="text-sm font-semibold px-5 py-2 rounded-full transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#575ECF", color: "#fff" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = "#4a50c0")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = "#575ECF")}
            >
              Book Now
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1"
            style={{ color: "#dcdad5" }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden mt-2 rounded-2xl p-4 space-y-2"
            style={{ backgroundColor: "#1b1b1b", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {[
              { label: "Home", anchor: "top" },
              { label: "Services", anchor: "services" },
              { label: "Gallery", anchor: "gallery" },
              { label: "Rewards", anchor: "rewards" },
              { label: "Contact", anchor: "contact" },
            ].map(({ label, anchor }) => (
              <button
                key={label}
                onClick={() => scrollTo(anchor)}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm"
                style={{ color: "#c5c1b9" }}
              >
                {label}
              </button>
            ))}
            <a
              href="tel:9549131307"
              className="block px-3 py-2 rounded-lg text-sm"
              style={{ color: "#c5c1b9" }}
            >
              📞 (954)-913-1307
            </a>
            <button
              onClick={() => { setMobileMenuOpen(false); handleBookNow(); }}
              className="block w-full text-center py-2.5 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#575ECF", color: "#fff" }}
            >
              Book Now
            </button>
          </div>
        )}
      </nav>

      {/* ── Promo Banner ── */}
      <div
        className="w-full text-center py-2.5 px-4 text-sm font-medium"
        style={{ backgroundColor: "#1b1b1b", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#c5c1b9" }}
      >
        💰 Use code <span style={{ color: "#dcdad5", fontWeight: 700 }}>MarioWorld4L</span> for up to $20 off!
      </div>

      {/* ── Hero ── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center"
        style={{
          background: "linear-gradient(to bottom, #131313 0%, #1a1a1a 100%)",
        }}
      >
        {/* Subtle shimmer overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 30%, rgba(87,94,207,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div
            className="inline-block text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase"
            style={{ backgroundColor: "#1b1b1b", color: "#c5c1b9", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Premium Mobile Detailing
          </div>
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.05] mb-6 tracking-tight uppercase"
            style={{ color: "#dcdad5", fontFamily: "'Arial Black', Impact, sans-serif" }}
          >
            REMAIN CLEAN<br className="hidden sm:block" /> SERVICES
          </h1>
          <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto" style={{ color: "#c5c1b9" }}>
            Premium mobile detailing — we bring the showroom to you.{" "}
            <span style={{ color: "#dcdad5" }}>
              Serving Fort Lauderdale, Miami-Dade &amp; West Palm Beach.
            </span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <button
              onClick={handleBookNow}
              className="font-semibold text-lg px-10 py-4 rounded-full transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#575ECF", color: "#fff" }}
            >
              Book Appointment
            </button>
            <a
              href="tel:9549131307"
              className="font-semibold text-lg px-10 py-4 rounded-full transition-colors text-center"
              style={{
                border: "1px solid rgba(197,193,185,0.3)",
                color: "#dcdad5",
                backgroundColor: "rgba(255,255,255,0.04)",
              }}
            >
              Call (954)-913-1307
            </a>
          </div>
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
      </section>

      {/* ── Services Section ── */}
      <section id="services" className="scroll-mt-20 py-20 px-4" style={{ backgroundColor: "#1a1a1a" }}>
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-black text-center uppercase tracking-tight mb-3"
            style={{ color: "#dcdad5", fontFamily: "'Arial Black', Impact, sans-serif" }}
          >
            Our Services
          </h2>
          <p className="text-center mb-12" style={{ color: "#c5c1b9" }}>
            Three core services. Four luxury packages.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {services.map((svc) => (
              <div
                key={svc.name}
                className="rounded-2xl p-8 flex flex-col items-center text-center transition-all"
                style={{
                  backgroundColor: "#131313",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "#131313")
                }
              >
                <span className="text-5xl mb-5">{svc.icon}</span>
                <h3 className="text-xl font-bold mb-3" style={{ color: "#dcdad5" }}>
                  {svc.name}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#c5c1b9" }}>
                  {svc.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={handleBookNow}
              className="font-semibold px-8 py-3 rounded-full text-sm transition-all"
              style={{ backgroundColor: "#575ECF", color: "#fff" }}
            >
              View All Packages &amp; Pricing →
            </button>
          </div>
        </div>
      </section>

      {/* ── Service Areas ── */}
      <section className="py-16 px-4" style={{ backgroundColor: "#131313", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3"
            style={{ color: "#dcdad5", fontFamily: "'Arial Black', Impact, sans-serif" }}
          >
            We Come to You
          </h2>
          <p className="mb-10" style={{ color: "#c5c1b9" }}>
            Proudly serving all of South Florida
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {serviceAreas.map((area) => (
              <div
                key={area.name}
                className="flex items-center gap-2.5 px-6 py-3 rounded-full"
                style={{
                  backgroundColor: "#1b1b1b",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#dcdad5",
                }}
              >
                <MapPin className="h-4 w-4" style={{ color: "#575ECF" }} />
                <span className="font-medium text-sm">{area.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="scroll-mt-20 py-20 px-4" style={{ backgroundColor: "#1a1a1a" }}>
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-black text-center uppercase tracking-tight mb-3"
            style={{ color: "#dcdad5", fontFamily: "'Arial Black', Impact, sans-serif" }}
          >
            What Our Clients Say
          </h2>
          <p className="text-center mb-12" style={{ color: "#c5c1b9" }}>
            Real reviews from satisfied customers across South Florida.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-6 flex flex-col"
                style={{
                  backgroundColor: "#131313",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: "#c5c1b9" }}>
                  "{t.text}"
                </p>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#dcdad5" }}>
                    {t.name}
                  </p>
                  <p className="text-xs" style={{ color: "#888" }}>
                    {t.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rewards Section ── */}
      <section
        id="rewards"
        className="scroll-mt-20 py-16 px-4 text-center"
        style={{ backgroundColor: "#131313", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-4xl mb-4">🏆</div>
          <h2
            className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3"
            style={{ color: "#dcdad5", fontFamily: "'Arial Black', Impact, sans-serif" }}
          >
            Rewards Program
          </h2>
          <p className="mb-8" style={{ color: "#c5c1b9" }}>
            Earn points with every detail. Redeem for discounts, free services, and exclusive perks.
            The more you clean, the more you save.
          </p>
          <button
            onClick={handleBookNow}
            className="font-semibold px-8 py-3 rounded-full text-sm transition-all"
            style={{ backgroundColor: "#575ECF", color: "#fff" }}
          >
            Join Rewards Program
          </button>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        className="py-16 px-4 text-center"
        style={{
          background: "linear-gradient(135deg, #575ECF 0%, #3d44a8 100%)",
        }}
      >
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3"
            style={{ color: "#fff", fontFamily: "'Arial Black', Impact, sans-serif" }}
          >
            Ready for a Showroom Finish?
          </h2>
          <p className="mb-8" style={{ color: "rgba(255,255,255,0.85)" }}>
            Book your mobile detail today. Satisfaction guaranteed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleBookNow}
              className="font-semibold px-8 py-3 rounded-full transition-colors text-sm active:scale-[0.98]"
              style={{ backgroundColor: "#fff", color: "#575ECF" }}
            >
              Book Now
            </button>
            <button
              onClick={() => document.getElementById("rewards")?.scrollIntoView({ behavior: "smooth" })}
              className="font-semibold px-8 py-3 rounded-full text-sm transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.5)", color: "#fff", backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              Join Rewards Program
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        id="contact"
        className="scroll-mt-20 py-14 px-4"
        style={{ backgroundColor: "#0e0e0e", borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <p
              className="font-bold text-base tracking-widest uppercase mb-3"
              style={{ color: "#dcdad5" }}
            >
              REMAIN CLEAN SERVICES
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#c5c1b9" }}>
              Premium mobile detailing serving South Florida.
            </p>
            <p className="text-xs mt-4" style={{ color: "#666" }}>
              Fort Lauderdale • Miami-Dade • West Palm Beach
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p
              className="font-semibold text-sm mb-4 uppercase tracking-wider"
              style={{ color: "#dcdad5" }}
            >
              Quick Links
            </p>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollTo(link.anchor)}
                    className="text-sm transition-colors"
                    style={{ color: "#c5c1b9" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#dcdad5")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#c5c1b9")}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <p
              className="font-semibold text-sm mb-4 uppercase tracking-wider"
              style={{ color: "#dcdad5" }}
            >
              Contact &amp; Hours
            </p>
            <ul className="space-y-3 text-sm" style={{ color: "#c5c1b9" }}>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" style={{ color: "#575ECF" }} />
                <a href="tel:9549131307" className="hover:text-[#dcdad5] transition-colors">
                  (954)-913-1307
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" style={{ color: "#575ECF" }} />
                <a
                  href="mailto:Remaincleanservicesllc@yahoo.com"
                  className="hover:text-[#dcdad5] transition-colors break-all"
                >
                  Remaincleanservicesllc@yahoo.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Instagram className="h-4 w-4 shrink-0" style={{ color: "#575ECF" }} />
                <a
                  href="https://instagram.com/remaincleanservice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#dcdad5] transition-colors"
                >
                  @remaincleanservice
                </a>
              </li>
              <li className="mt-3">
                <p className="font-medium mb-0.5" style={{ color: "#dcdad5" }}>Hours of Operation</p>
                <p>Monday – Sunday</p>
                <p>8:00 AM – 9:00 PM</p>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="max-w-6xl mx-auto mt-10 pt-6 text-center text-xs"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#555" }}
        >
          © 2026 Remain Clean Services LLC. All rights reserved.
          {" · "}
          <Link to="/privacy-policy" className="hover:text-[#c5c1b9] transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Star, Menu, X } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Seo
        title="Mobile Detailing in Charlotte, NC | WE DETAIL NC"
        description="Mobile detailing, ceramic coating & paint correction in Charlotte — we come to you. Book your detail today."
        canonicalPath="/"
        ogImage="/images/wedetailnc-og.png"
        jsonLd={[
          {
            "@type": "LocalBusiness",
            "name": "WE DETAIL NC",
            "url": "https://wedetailnc.com",
            "description": "Mobile detailing, ceramic coating & paint correction in Charlotte, NC.",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Charlotte",
              "addressRegion": "NC"
            },
            "telephone": "(984) 332-8570"
          }
        ]}
      />

      {/* Nav — dark rounded pill style */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#1a1a1a]/80 backdrop-blur-md rounded-full px-6 py-3 flex items-center justify-between border border-white/5">
            <a href="/" className="font-bold text-lg tracking-wide text-white">
              WE DETAIL NC
            </a>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="text-sm bg-[#e74c5e] hover:bg-[#d43f51] text-white px-5 py-2 rounded-full transition-colors font-medium"
              >
                Book Now
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 bg-[#1a1a1a]/95 backdrop-blur-md rounded-2xl border border-white/10 p-4 space-y-3">
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}
                className="block w-full text-left text-white/70 hover:text-white px-3 py-2 rounded-lg transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/signup"); }}
                className="block w-full text-center bg-[#e74c5e] hover:bg-[#d43f51] text-white px-5 py-2.5 rounded-full transition-colors font-medium"
              >
                Book Now
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero — full viewport with background image */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="Luxury car interior"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] mb-6 tracking-tight uppercase"
            style={{ fontFamily: "'Arial Black', 'Impact', sans-serif" }}
          >
            Mobile Detailing in Charlotte, NC
          </h1>

          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Mobile detailing, ceramic coating & paint correction in Charlotte — we come to you.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => navigate("/signup")}
              className="bg-[#e74c5e] hover:bg-[#d43f51] text-white text-lg font-semibold px-10 py-4 rounded-full transition-colors shadow-lg"
            >
              Book Now
            </button>
            <button
              onClick={() => navigate("/login")}
              className="border border-white/30 hover:border-white/60 text-white text-lg font-semibold px-10 py-4 rounded-full transition-colors backdrop-blur-sm"
            >
              Get a Quote
            </button>
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
      </section>

      {/* Footer — minimal */}
      <footer className="bg-[#1a1a1a] border-t border-white/10 py-6 px-4 text-center">
        <Link
          to="/privacy-policy"
          className="text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}

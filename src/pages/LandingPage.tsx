import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Star, Menu, X, Check, Phone, MapPin, Clock, Shield, Sparkles, Car } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import servicesBg from "@/assets/services-bg.jpg";
import ownerPortrait from "@/assets/owner-portrait.jpg";

const packages = [
  {
    badge: "Quick Clean",
    name: "Express Package",
    price: "$175",
    items: [
      "Prewash, Emblems and Gas Cap Cleaning",
      "Complete Wheel, Tire and Fender Well Cleaning",
      "Bug Removal",
      "Foam Bath",
      "Door Jambs Cleaned",
      "Tires Dressed",
      "Streak Free Windows",
      "Interior Air Blowout",
      "Vacuum",
      "Streak Free Glass",
    ],
  },
  {
    badge: "Most Popular",
    name: "Reset Package",
    price: "$225",
    popular: true,
    items: [
      "Everything in Express Package +",
      "Trim Restored",
      "Spray Sealant (up to 3 months protection)",
      "Dash, Cup Holders and Plastic Trim Cleaned",
      "Leather and Vinyl Cleaned",
    ],
  },
  {
    badge: "Best Value",
    name: "Deluxe Package",
    price: "$350",
    items: [
      "Everything in Reset Package +",
      "Paint Decontamination",
      "Claybar Treatment",
      "Buff on Ceramic Wax",
      "Leather and Vinyl Conditioned",
      "Steam Cleaning",
    ],
  },
  {
    badge: "Removes Swirls",
    name: "Elite Package",
    price: "$480",
    items: [
      "1 Step Paint Correction (Removes 50-70% of swirls)",
      "Prewash, Emblems and Gas Cap Cleaning",
      "Complete Wheel, Tire and Fender Well Cleaning",
      "Bug Removal",
      "Foam Bath",
      "Door Jambs Cleaned",
      "Tires Dressed",
      "Streak Free Windows",
      "Interior Air Blowout",
      "Vacuum",
      "Streak Free Glass",
    ],
  },
  {
    badge: "Ceramic Coating",
    name: "Ultimate Protect",
    price: "$580",
    items: [
      "5 Year Ceramic Coating",
      "Prewash, Emblems and Gas Cap Cleaning",
      "Complete Wheel, Tire and Fender Well Cleaning",
      "Bug Removal",
      "Foam Bath",
      "Door Jambs Cleaned",
      "Tires Dressed",
      "Streak Free Windows",
      "Streak Free Glass",
    ],
  },
  {
    badge: "Membership",
    name: "Maintenance Plan",
    price: "$90/mo",
    items: [
      "Weekly, bi-weekly, or monthly options",
      "Exterior + interior upkeep included",
      "Flexible scheduling",
      "Priority access",
    ],
  },
];

const testimonials = [
  {
    name: "Arlene Green",
    text: "I had the pleasure of having my car detailed by Justus. It was the best experience ever! Justus was very punctual and informative. My car looks brand new!!! My floors and seats look immaculate.",
  },
  {
    name: "Rohan Rudolph",
    text: "The cars look great! You have outdone yourself! Thank you for getting all the pollen, leaves and blossoms off/out of the cars. Justus does great work for a very reasonable price. Very satisfied customer.",
  },
  {
    name: "Danie Pearce",
    text: "Justus did an amazing job on my vehicle. Very professional and thorough. I will definitely be using his services again. Highly recommend!",
  },
  {
    name: "Lisa Rems",
    text: "Outstanding service from start to finish. My SUV has never looked this good. The attention to detail is incredible and the convenience of mobile service is unbeatable.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <Seo
        title="Mobile Detailing in Charlotte, NC | WE DETAIL NC"
        description="Mobile detailing, ceramic coating & paint correction in Charlotte — we come to you. Book your detail today."
        canonicalPath="/"
        ogImage="/images/wedetailnc-og.png"
        jsonLd={[
          {
            "@type": "LocalBusiness",
            name: "WE DETAIL NC",
            url: "https://wedetailnc.com",
            description: "Mobile detailing, ceramic coating & paint correction in Charlotte, NC.",
            address: { "@type": "PostalAddress", addressLocality: "Charlotte", addressRegion: "NC" },
            telephone: "(984) 332-8570",
          },
        ]}
      />

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#111]/80 backdrop-blur-md rounded-full px-6 py-3 flex items-center justify-between border border-white/5">
            <a href="/" className="font-bold text-lg tracking-wide">WE DETAIL NC</a>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollTo("services")} className="text-sm text-white/70 hover:text-white transition-colors">Services</button>
              <button onClick={() => scrollTo("testimonials")} className="text-sm text-white/70 hover:text-white transition-colors">Testimonials</button>
              <button onClick={() => scrollTo("about")} className="text-sm text-white/70 hover:text-white transition-colors">About Us</button>
              <a href="tel:9843328570" className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> (984) 332-8570
              </a>
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-white/70 hover:text-white transition-colors font-medium"
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
            <button className="md:hidden p-1 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 bg-[#111]/95 backdrop-blur-md rounded-2xl border border-white/10 p-4 space-y-2">
              <button onClick={() => scrollTo("services")} className="block w-full text-left text-white/70 hover:text-white px-3 py-2 rounded-lg">Services</button>
              <button onClick={() => scrollTo("testimonials")} className="block w-full text-left text-white/70 hover:text-white px-3 py-2 rounded-lg">Testimonials</button>
              <button onClick={() => scrollTo("about")} className="block w-full text-left text-white/70 hover:text-white px-3 py-2 rounded-lg">About Us</button>
              <a href="tel:9843328570" className="block w-full text-left text-white/70 hover:text-white px-3 py-2 rounded-lg">📞 (984) 332-8570</a>
              <button onClick={() => { setMobileMenuOpen(false); navigate("/login"); }} className="block w-full text-left text-white/70 hover:text-white px-3 py-2 rounded-lg">Log In</button>
              <button onClick={() => { setMobileMenuOpen(false); navigate("/signup"); }} className="block w-full text-center bg-[#e74c5e] hover:bg-[#d43f51] text-white px-5 py-2.5 rounded-full font-medium">Book Now</button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Luxury car interior" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-black/55" />
        </div>
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.05] mb-6 tracking-tight uppercase" style={{ fontFamily: "'Arial Black', 'Impact', sans-serif" }}>
            Mobile Detailing in Charlotte, NC
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Premium mobile detailing, ceramic coating &amp; paint correction — we come to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button onClick={() => navigate("/signup")} className="bg-[#e74c5e] hover:bg-[#d43f51] text-white text-lg font-semibold px-10 py-4 rounded-full transition-colors shadow-lg">
              Book Now
            </button>
            <a href="tel:9843328570" className="border border-white/30 hover:border-white/60 text-white text-lg font-semibold px-10 py-4 rounded-full transition-colors backdrop-blur-sm text-center">
              Get a Quote
            </a>
          </div>
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />)}
          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section className="bg-[#1a1a1a] border-y border-white/5 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center px-4">
          {[
            { icon: Star, label: "5-Star Rated" },
            { icon: Car, label: "Fully Mobile" },
            { icon: Sparkles, label: "Luxury-Level Results" },
            { icon: Clock, label: "Time-Saving Service" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon className="h-6 w-6 text-[#e74c5e]" />
              <span className="text-sm font-medium text-white/90">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services / Packages ── */}
      <section id="services" className="scroll-mt-20">
        <div className="relative py-20 px-4">
          <div className="absolute inset-0">
            <img src={servicesBg} alt="Ceramic coated paint" className="w-full h-full object-cover" loading="lazy" width={1920} height={1080} />
            <div className="absolute inset-0 bg-black/70" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-center uppercase tracking-tight mb-4" style={{ fontFamily: "'Arial Black', 'Impact', sans-serif" }}>
              Detailing Packages
            </h2>
            <p className="text-center text-white/60 mb-12 max-w-lg mx-auto">
              Choose a package that fits your vehicle and goals.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`rounded-2xl border p-6 flex flex-col ${
                    pkg.popular
                      ? "border-[#e74c5e]/50 bg-[#e74c5e]/5 ring-1 ring-[#e74c5e]/20"
                      : "border-white/10 bg-white/5"
                  } backdrop-blur-sm`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${pkg.popular ? "bg-[#e74c5e] text-white" : "bg-white/10 text-white/70"}`}>
                      {pkg.badge}
                    </span>
                    <span className="text-lg font-bold">Starting at {pkg.price}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4">{pkg.name}</h3>
                  <ul className="space-y-2 flex-1 mb-6">
                    {pkg.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-white/80">
                        <Check className="h-4 w-4 text-[#e74c5e] mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate("/signup")}
                    className={`w-full py-3 rounded-full font-semibold transition-colors ${
                      pkg.popular
                        ? "bg-[#e74c5e] hover:bg-[#d43f51] text-white"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    Book Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="scroll-mt-20 bg-[#111] py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center uppercase tracking-tight mb-4" style={{ fontFamily: "'Arial Black', 'Impact', sans-serif" }}>
            Testimonials
          </h2>
          <p className="text-center text-white/60 mb-12 max-w-lg mx-auto">
            Real reviews from real clients. We focus on quality, communication, and results you can see immediately.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-white/80 mb-4 leading-relaxed">"{t.text}"</p>
                <p className="font-semibold">{t.name}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button onClick={() => navigate("/signup")} className="bg-[#e74c5e] hover:bg-[#d43f51] text-white font-semibold px-8 py-3 rounded-full transition-colors">
              Book Your Detail
            </button>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="scroll-mt-20 bg-[#1a1a1a] py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center uppercase tracking-tight mb-12" style={{ fontFamily: "'Arial Black', 'Impact', sans-serif" }}>
            About Us
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5 text-white/80 leading-relaxed">
              <h3 className="text-2xl font-bold text-white">Our Story</h3>
              <p>
                We Detail Charlotte is a premium, fully mobile detailing service in Charlotte NC.
                If you're looking for high-quality car detailing in Charlotte NC, we make it simple
                and convenient by coming directly to you.
              </p>
              <p>
                I gained hands-on experience working on high end vehicles at Rolls-Royce, where
                attention to detail and quality standards are everything. That's the same level of
                care I bring to every vehicle I touch.
              </p>
              <p>
                We come to you anywhere in Charlotte and deliver professional results — from
                maintenance details to deep cleans — so you don't have to waste time driving to a
                shop or waiting around.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white/10">
                <img src={ownerPortrait} alt="Owner of WE DETAIL NC" className="w-full h-full object-cover" loading="lazy" width={512} height={512} />
              </div>
              <p className="font-semibold text-lg">Owner-Operated</p>
              <div className="grid grid-cols-2 gap-4 mt-4 w-full max-w-xs">
                {[
                  { icon: Star, label: "5-Star Rated" },
                  { icon: MapPin, label: "Fully Mobile" },
                  { icon: Sparkles, label: "Luxury Results" },
                  { icon: Shield, label: "Insured" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-white/70">
                    <Icon className="h-4 w-4 text-[#e74c5e]" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#e74c5e] py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4" style={{ fontFamily: "'Arial Black', 'Impact', sans-serif" }}>
            Ready for a Showroom Finish?
          </h2>
          <p className="text-white/90 mb-8">Book your mobile detail today — we come to you anywhere in Charlotte.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate("/signup")} className="bg-white text-[#e74c5e] font-semibold px-8 py-3 rounded-full hover:bg-white/90 transition-colors">
              Book Now
            </button>
            <a href="tel:9843328570" className="border border-white/40 text-white font-semibold px-8 py-3 rounded-full hover:bg-white/10 transition-colors text-center">
              Call (984) 332-8570
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#111] border-t border-white/10 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold tracking-wide">WE DETAIL NC</span>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <a href="tel:9843328570" className="hover:text-white/80 transition-colors">(984) 332-8570</a>
            <Link to="/privacy-policy" className="hover:text-white/80 transition-colors">Privacy Policy</Link>
          </div>
          <span className="text-xs text-white/30">© {new Date().getFullYear()} WE DETAIL NC. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

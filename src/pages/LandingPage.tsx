import { useState, lazy, Suspense, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  BarChart3, 
  Smartphone, 
  Bell, 
  Shield, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Star,
  Menu,
  X,
  Play,
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { TermsOfServiceDialog } from "@/components/legal/TermsOfServiceDialog";

const AIBusinessTools = lazy(() => import("@/components/landing/AIBusinessTools").then(m => ({ default: m.AIBusinessTools })));
const CompetitorComparison = lazy(() => import("@/components/landing/CompetitorComparison").then(m => ({ default: m.CompetitorComparison })));
const BlogSection = lazy(() => import("@/components/landing/BlogSection").then(m => ({ default: m.BlogSection })));
const InteractiveDemo = lazy(() => import("@/components/landing/InteractiveDemo").then(m => ({ default: m.InteractiveDemo })));

const SectionSkeleton = () => (
  <div className="py-16 px-4">
    <div className="max-w-7xl mx-auto">
      <div className="h-8 w-64 bg-muted rounded-lg mx-auto mb-4" />
      <div className="h-4 w-96 bg-muted rounded mx-auto mb-12" />
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-muted rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

const testimonials = [
  {
    quote: "This platform transformed how we run our cleaning business. Bookings increased 40% in the first month!",
    author: "Sarah M.",
    role: "Owner, Sparkle Clean Co.",
    rating: 5,
  },
  {
    quote: "The staff portal is amazing. My team can manage their own schedules and I can track everything in real-time.",
    author: "Michael R.",
    role: "Founder, Fresh Start Services",
    rating: 5,
  },
  {
    quote: "Finally, a platform that understands cleaning businesses. The automated invoicing alone saves me hours every week.",
    author: "Jennifer L.",
    role: "CEO, Elite Home Care",
    rating: 5,
  },
];

const featureChecklist = [
  "Online booking form",
  "Recurring bookings",
  "Staff portal & app",
  "Client portal",
  "GPS check-ins",
  "Quote generator",
  "Lead management",
  "Photo documentation",
  "Review requests",
  "Loyalty tiers & rewards",
  "P&L reports",
  "Revenue forecasting",
  "Multi-location",
  "Demo/Test Mode",
  "In-App SMS inbox",
  "Inventory tracking",
  "Client self-cancellation",
  "Activity analytics",
  "AI intelligence"
];

const baseFeatures = [
  {
    icon: Calendar,
    title: "Smart Scheduling & Online Booking",
    description: "Auto-assign cleaners by location, skills, and availability. Let customers book online 24/7."
  },
  {
    icon: Users,
    title: "Client Portal & Self-Service",
    description: "Clients view bookings, request appointments, cancel with tier-based policies, and track loyalty rewards."
  },
  {
    icon: CreditCard,
    title: "Automated Payments & Invoicing",
    description: "Accept payments with Stripe. Auto-generate invoices, handle deposits, tips, and send quotes in seconds."
  },
  {
    icon: BarChart3,
    title: "Analytics & AI Intelligence",
    description: "Track portal activity, user engagement, churn predictions, and revenue forecasting with AI-powered insights."
  },
  {
    icon: Smartphone,
    title: "Mobile App with GPS Tracking",
    description: "Staff app with GPS check-ins, on-my-way texts, photo documentation, and real-time job updates."
  },
  {
    icon: Bell,
    title: "Loyalty Tiers & Automated Campaigns",
    description: "Reward loyal customers with tiered benefits. Auto-send review requests and win-back campaigns."
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const featuresReveal = useScrollReveal();
  const statsReveal = useScrollReveal();
  const testimonialsReveal = useScrollReveal();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [mobileMenuOpen]);

  const handleGetStarted = () => {
    sessionStorage.setItem("selectedIndustry", "Home Cleaning");
    navigate("/signup");
  };

  const handleStartFreeTrial = () => {
    sessionStorage.setItem("selectedIndustry", "Home Cleaning");
    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Seo 
        title="Cleaning Business Software | TIDYWISE"
        description="Smart scheduling, automated payroll, CRM, GPS tracking & online booking for cleaning businesses. Start your 60-day free trial today."
        canonicalPath="/"
        ogImage="/images/tidywise-og.png"
        jsonLd={[
          {
            "@type": "Organization",
            "name": "TIDYWISE",
            "url": "https://www.jointidywise.com",
            "logo": "https://www.jointidywise.com/images/tidywise-logo.png",
            "sameAs": []
          },
          {
            "@type": "SoftwareApplication",
            "name": "TIDYWISE",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web, iOS, Android",
            "offers": {
              "@type": "Offer",
              "price": "50.00",
              "priceCurrency": "USD",
              "priceValidUntil": "2027-12-31"
            },
            "description": "All-in-one cleaning business management software with scheduling, CRM, payments, and staff management."
          }
        ]}
      />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm' 
          : 'bg-transparent'
      }`}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-18">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl md:text-2xl text-foreground tracking-tight">TIDYWISE</span>
            </div>

            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Features</a>
              <a href="#blog" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Blog</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Testimonials</a>
              <Button variant="ghost" onClick={() => navigate("/pricing")} className="text-sm">Pricing</Button>
              <Button variant="ghost" onClick={() => navigate("/portal")} className="text-sm">Client Portal</Button>
              <Button variant="ghost" onClick={() => navigate("/staff/login")} className="text-sm">Staff Portal</Button>
              <Button variant="ghost" onClick={() => navigate("/login")} className="text-sm">Log In</Button>
              <Button variant="premium" onClick={() => navigate("/signup")} className="text-sm">
                Start Free Trial
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <button 
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="md:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Mobile menu">
              <button type="button" className="absolute inset-0 bg-background/60 backdrop-blur-sm" aria-label="Close menu" onClick={closeMobileMenu} />
              <div className="absolute left-3 right-3 top-[calc(4.25rem+env(safe-area-inset-top))]">
                <div className="rounded-2xl border border-border bg-background shadow-lg">
                  <div className="flex flex-col gap-1 p-2">
                    <a href="#features" onClick={closeMobileMenu} className="px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all">Features</a>
                    <a href="#blog" onClick={closeMobileMenu} className="px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all">Blog</a>
                    <a href="#testimonials" onClick={closeMobileMenu} className="px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all">Testimonials</a>
                    <Button variant="ghost" className="justify-start" onClick={() => { closeMobileMenu(); navigate("/pricing"); }}>Pricing</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { closeMobileMenu(); navigate("/portal"); }}>Client Portal</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { closeMobileMenu(); navigate("/staff/login"); }}>Staff Portal</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { closeMobileMenu(); navigate("/login"); }}>Log In</Button>
                    <Button variant="premium" className="mt-1" onClick={() => { closeMobileMenu(); navigate("/signup"); }}>
                      Start Free Trial
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </nav>

      {/* Hero Section — clean, editorial, no gimmicks */}
      <section className="relative pt-[calc(7rem+env(safe-area-inset-top))] md:pt-[calc(10rem+env(safe-area-inset-top))] pb-20 md:pb-32 px-4 sm:px-6 lg:px-8">
        {/* Subtle background accent — single, static, understated */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-6">
            All-in-one cleaning business software
          </p>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-[1.08] mb-6 tracking-tight">
            Run your maid service{" "}
            <span className="text-primary">like a real business</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Online booking, smart scheduling, automated payroll, CRM, and invoicing — built specifically for cleaning companies. Not another generic field service tool.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Button 
              size="xl" 
              variant="premium"
              onClick={handleGetStarted}
              className="group"
            >
              Start your 60-day free trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button 
              size="xl" 
              variant="outline"
              onClick={() => {
                const demoSection = document.getElementById('demo');
                if (demoSection) demoSection.scrollIntoView({ behavior: 'smooth' });
              }}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Watch Demo
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-5">
            No credit card required · Cancel anytime · $50/mo after trial
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        ref={featuresReveal.ref}
        className={`py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-secondary/30 transition-all duration-700 ${
          featuresReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Everything you need to run your business
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From automated booking to GPS route optimization — TIDYWISE replaces your entire tool stack.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {baseFeatures.map((feature) => (
              <Card 
                key={feature.title}
                variant="feature"
                className="p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-[15px]">{feature.description}</p>
              </Card>
            ))}
          </div>

          <Card variant="glass" className="mt-12 p-8">
            <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
              Built specifically for cleaning businesses
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {featureChecklist.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span className="text-foreground text-sm">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Interactive Demo */}
      <Suspense fallback={<SectionSkeleton />}>
        <InteractiveDemo />
      </Suspense>

      {/* Competitor Comparison */}
      <Suspense fallback={<SectionSkeleton />}>
        <CompetitorComparison />
      </Suspense>

      {/* AI Business Tools */}
      <Suspense fallback={<SectionSkeleton />}>
        <AIBusinessTools />
      </Suspense>

      {/* Why TIDYWISE section */}
      <section 
        ref={statsReveal.ref}
        className={`py-20 md:py-28 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          statsReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">
                Scale from solo cleaner to{" "}
                <span className="text-primary">full operation</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Whether you're just starting or managing a team of 50, TIDYWISE gives you the same tools multi-million dollar cleaning services use.
              </p>
              <div className="space-y-4">
                {[
                  "Set-it-and-forget-it online booking",
                  "GPS route optimization saves 30% travel time",
                  "Automated review requests for Google Guaranteed",
                  "Professional quotes & invoices in seconds"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-3.5 w-3.5 text-success" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '24/7', label: 'Online booking' },
                { value: '60', label: 'Day free trial' },
                { value: '$50', label: 'Per month' },
                { value: '∞', label: 'Unlimited bookings' },
              ].map((stat, i) => (
                <div 
                  key={i}
                  className="bg-card border border-border rounded-2xl p-6 text-center"
                >
                  <p className="text-4xl lg:text-5xl font-bold text-primary mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section 
        id="testimonials" 
        ref={testimonialsReveal.ref}
        className={`py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-secondary/30 transition-all duration-700 ${
          testimonialsReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              What our customers say
            </h2>
            <p className="text-lg text-muted-foreground">
              Real feedback from cleaning business owners using TIDYWISE.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index}
                variant="elevated"
                className="p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed text-[15px]">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-foreground text-sm">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      <Suspense fallback={<SectionSkeleton />}>
        <BlogSection />
      </Suspense>

      {/* Final CTA */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 tracking-tight">
            Ready to grow your cleaning business?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Start your 60-day free trial. No credit card required.
          </p>
          <Button 
            size="xl" 
            variant="secondary"
            onClick={handleStartFreeTrial}
            className="group"
          >
            Get started for free
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-1">
              <span className="font-bold text-xl text-foreground mb-4 block">TIDYWISE</span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The complete platform to grow your cleaning business.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="mailto:support@tidywisecleaning.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
                <li><Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link to="/delete-account" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Delete Account</Link></li>
                <li>
                  <TermsOfServiceDialog>
                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</button>
                  </TermsOfServiceDialog>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Compare</h4>
              <ul className="space-y-3">
                <li><Link to="/compare/jobber" className="text-sm text-muted-foreground hover:text-foreground transition-colors">vs Jobber</Link></li>
                <li><Link to="/compare/booking-koala" className="text-sm text-muted-foreground hover:text-foreground transition-colors">vs Booking Koala</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} TIDYWISE. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

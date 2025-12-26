import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Building2,
  Scissors,
  Car,
  Sparkles,
  Dog,
  Leaf,
  Menu,
  X,
  Wrench,
  Droplets,
  Hammer,
  PaintBucket,
  Shirt,
  Utensils,
  Dumbbell,
  Camera,
  Music,
  Truck
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { PricingImport } from "@/components/landing/PricingImport";

// Industry configurations with customized content
const industryConfigs = {
  "Home Cleaning": {
    icon: Sparkles,
    jobLabel: "Cleans",
    staffLabel: "Cleaners",
    serviceExamples: ["Deep Clean", "Standard Clean", "Move In/Out"],
    dashboardStats: {
      bookings: 12,
      revenue: "$2,450",
      staff: 8
    },
    testimonials: [
      {
        quote: "This platform transformed how we run our cleaning business. Bookings increased 40% in the first month!",
        author: "Sarah M.",
        role: "Owner, Sparkle Clean Co.",
        rating: 5
      },
      {
        quote: "The staff portal is amazing. My team can manage their own schedules and I can track everything in real-time.",
        author: "Michael R.",
        role: "Founder, Fresh Start Services",
        rating: 5
      },
      {
        quote: "Finally, a platform that understands cleaning businesses. The automated invoicing alone saves me hours every week.",
        author: "Jennifer L.",
        role: "CEO, Elite Home Care",
        rating: 5
      },
    ],
    features: [
      "Recurring bookings",
      "Customer portal",
      "Inventory tracking",
      "Lead management",
      "Quote generator",
      "Loyalty programs",
      "GPS check-ins",
      "Photo documentation",
      "Email campaigns",
      "Review requests",
      "Multi-location",
      "Team messaging"
    ]
  },
  "Office Cleaning": {
    icon: Building2,
    jobLabel: "Jobs",
    staffLabel: "Staff",
    serviceExamples: ["Daily Clean", "Weekly Service", "Deep Sanitization"],
    dashboardStats: {
      bookings: 8,
      revenue: "$4,800",
      staff: 12
    },
    testimonials: [
      {
        quote: "Managing multiple office contracts has never been easier. Our efficiency improved by 50%!",
        author: "David K.",
        role: "Owner, ProClean Commercial",
        rating: 5
      },
      {
        quote: "The scheduling system handles complex recurring contracts perfectly. Our clients love the consistency.",
        author: "Lisa T.",
        role: "Operations Manager, CleanOffice Inc.",
        rating: 5
      },
      {
        quote: "Billing and invoicing for commercial accounts is seamless. Saved us from hiring an admin.",
        author: "Robert P.",
        role: "Founder, Corporate Clean Solutions",
        rating: 5
      },
    ],
    features: [
      "Contract management",
      "Commercial invoicing",
      "Multi-site scheduling",
      "Supply inventory",
      "Staff assignments",
      "Quality reports",
      "GPS verification",
      "Client portal",
      "Automated billing",
      "Compliance tracking",
      "Team coordination",
      "Expense tracking"
    ]
  },
  "Pet Grooming": {
    icon: Dog,
    jobLabel: "Appointments",
    staffLabel: "Groomers",
    serviceExamples: ["Full Groom", "Bath & Brush", "Nail Trim"],
    dashboardStats: {
      bookings: 18,
      revenue: "$1,890",
      staff: 4
    },
    testimonials: [
      {
        quote: "Pet parents love being able to book online and see their fur baby's grooming history!",
        author: "Emily W.",
        role: "Owner, Pawfect Grooming",
        rating: 5
      },
      {
        quote: "The before/after photo feature is a hit with our clients. Great for social media too!",
        author: "Marcus J.",
        role: "Founder, Furry Friends Spa",
        rating: 5
      },
      {
        quote: "Managing breed-specific services and groomer specialties is so easy now.",
        author: "Sophia R.",
        role: "Manager, Happy Tails Grooming",
        rating: 5
      },
    ],
    features: [
      "Pet profiles",
      "Breed-specific pricing",
      "Before/after photos",
      "Vaccination tracking",
      "Groomer schedules",
      "Loyalty rewards",
      "Appointment reminders",
      "Pet parent portal",
      "Service packages",
      "Add-on services",
      "Referral program",
      "Review requests"
    ]
  },
  "Lawn Care": {
    icon: Leaf,
    jobLabel: "Jobs",
    staffLabel: "Crew",
    serviceExamples: ["Weekly Mowing", "Fertilization", "Landscaping"],
    dashboardStats: {
      bookings: 24,
      revenue: "$5,200",
      staff: 6
    },
    testimonials: [
      {
        quote: "Route optimization alone saved us 3 hours of drive time daily. Game changer!",
        author: "James B.",
        role: "Owner, Green Thumb Lawns",
        rating: 5
      },
      {
        quote: "Managing seasonal services and upsells has never been more profitable.",
        author: "Carlos M.",
        role: "Founder, ProLawn Services",
        rating: 5
      },
      {
        quote: "Our crews love the mobile app. Weather delays and route changes are seamless.",
        author: "Brian H.",
        role: "Operations, Elite Landscaping",
        rating: 5
      },
    ],
    features: [
      "Route optimization",
      "Seasonal scheduling",
      "Equipment tracking",
      "Weather alerts",
      "Property mapping",
      "Upsell campaigns",
      "Crew management",
      "Before/after photos",
      "Estimate generator",
      "Recurring services",
      "Material tracking",
      "Customer portal"
    ]
  },
  "Hair Salon": {
    icon: Scissors,
    jobLabel: "Appointments",
    staffLabel: "Stylists",
    serviceExamples: ["Haircut", "Color & Highlights", "Styling"],
    dashboardStats: {
      bookings: 32,
      revenue: "$3,200",
      staff: 5
    },
    testimonials: [
      {
        quote: "Clients can see stylist portfolios and book their favorite. Our retention is up 30%!",
        author: "Amanda C.",
        role: "Owner, Style Studio",
        rating: 5
      },
      {
        quote: "Commission tracking and chair rental management is finally automated.",
        author: "Jessica M.",
        role: "Founder, Glamour Hair",
        rating: 5
      },
      {
        quote: "The waitlist feature keeps our chairs full even with cancellations.",
        author: "Nicole P.",
        role: "Manager, Chic Cuts",
        rating: 5
      },
    ],
    features: [
      "Stylist portfolios",
      "Chair rental tracking",
      "Commission management",
      "Service menus",
      "Product sales",
      "Waitlist management",
      "Appointment reminders",
      "Client preferences",
      "Loyalty programs",
      "Online booking",
      "Staff scheduling",
      "Review collection"
    ]
  },
  "Car Wash": {
    icon: Car,
    jobLabel: "Services",
    staffLabel: "Attendants",
    serviceExamples: ["Express Wash", "Full Detail", "Interior Clean"],
    dashboardStats: {
      bookings: 45,
      revenue: "$2,800",
      staff: 8
    },
    testimonials: [
      {
        quote: "Monthly membership management is a breeze. Recurring revenue is up 60%!",
        author: "Tony G.",
        role: "Owner, Shine Auto Spa",
        rating: 5
      },
      {
        quote: "Queue management and wait time estimates keep customers happy.",
        author: "Derek S.",
        role: "Founder, Crystal Clear Wash",
        rating: 5
      },
      {
        quote: "Fleet accounts are so easy to manage now. Our B2B business doubled.",
        author: "Maria L.",
        role: "Manager, Premier Auto Detail",
        rating: 5
      },
    ],
    features: [
      "Membership plans",
      "Queue management",
      "Fleet accounts",
      "Service packages",
      "Upsell prompts",
      "Wait time tracking",
      "Mobile check-in",
      "Loyalty rewards",
      "Prepaid packages",
      "Staff performance",
      "Revenue reports",
      "Customer history"
    ]
  },
  "Pool Service": {
    icon: Droplets,
    jobLabel: "Services",
    staffLabel: "Technicians",
    serviceExamples: ["Weekly Maintenance", "Equipment Repair", "Chemical Balance"],
    dashboardStats: {
      bookings: 35,
      revenue: "$6,500",
      staff: 5
    },
    testimonials: [
      {
        quote: "Route scheduling with chemical reading tracking saves us so much time!",
        author: "Steve M.",
        role: "Owner, Crystal Pools",
        rating: 5
      },
      {
        quote: "Customers love seeing their pool health reports in the portal.",
        author: "Kevin D.",
        role: "Founder, BlueWater Service",
        rating: 5
      },
      {
        quote: "Equipment service reminders keep our maintenance contracts active.",
        author: "Paul R.",
        role: "Manager, Pool Pros",
        rating: 5
      },
    ],
    features: [
      "Chemical tracking",
      "Route optimization",
      "Equipment logs",
      "Service history",
      "Photo documentation",
      "Customer portal",
      "Seasonal scheduling",
      "Part inventory",
      "Automated billing",
      "Health reports",
      "Maintenance alerts",
      "Multi-property"
    ]
  },
  "Handyman": {
    icon: Wrench,
    jobLabel: "Jobs",
    staffLabel: "Technicians",
    serviceExamples: ["Repairs", "Assembly", "Installation"],
    dashboardStats: {
      bookings: 15,
      revenue: "$3,400",
      staff: 4
    },
    testimonials: [
      {
        quote: "Job quoting with material costs is so accurate now. No more undercharging!",
        author: "Mike T.",
        role: "Owner, Fix-It Pro",
        rating: 5
      },
      {
        quote: "Managing multiple service types in one system is exactly what we needed.",
        author: "Dan K.",
        role: "Founder, Handy Solutions",
        rating: 5
      },
      {
        quote: "Before/after photos build trust with new customers instantly.",
        author: "Chris B.",
        role: "Manager, Home Helpers",
        rating: 5
      },
    ],
    features: [
      "Job estimates",
      "Material tracking",
      "Photo documentation",
      "Skill assignments",
      "Service history",
      "Customer portal",
      "Flexible scheduling",
      "Part inventory",
      "Invoicing",
      "Time tracking",
      "Travel logging",
      "Review requests"
    ]
  },
  "Painting": {
    icon: PaintBucket,
    jobLabel: "Projects",
    staffLabel: "Painters",
    serviceExamples: ["Interior Paint", "Exterior Paint", "Cabinet Refinish"],
    dashboardStats: {
      bookings: 6,
      revenue: "$12,500",
      staff: 8
    },
    testimonials: [
      {
        quote: "Project milestone tracking keeps everyone on the same page for big jobs.",
        author: "Tom H.",
        role: "Owner, Perfect Painters",
        rating: 5
      },
      {
        quote: "Color consultation scheduling integrated with estimates. Customers love it!",
        author: "Sarah N.",
        role: "Founder, Color Masters",
        rating: 5
      },
      {
        quote: "Managing crew assignments across multiple job sites is finally simple.",
        author: "Jake W.",
        role: "Operations, Elite Painting",
        rating: 5
      },
    ],
    features: [
      "Project estimates",
      "Color consultation",
      "Milestone tracking",
      "Crew scheduling",
      "Material calculator",
      "Before/after photos",
      "Client approvals",
      "Progress updates",
      "Deposit management",
      "Contract templates",
      "Warranty tracking",
      "Review collection"
    ]
  },
  "Laundry Service": {
    icon: Shirt,
    jobLabel: "Orders",
    staffLabel: "Staff",
    serviceExamples: ["Wash & Fold", "Dry Cleaning", "Pickup & Delivery"],
    dashboardStats: {
      bookings: 28,
      revenue: "$1,950",
      staff: 6
    },
    testimonials: [
      {
        quote: "Pickup and delivery scheduling with route optimization is a lifesaver!",
        author: "Linda M.",
        role: "Owner, Fresh & Clean Laundry",
        rating: 5
      },
      {
        quote: "Subscription management for regular customers drives reliable revenue.",
        author: "Amy T.",
        role: "Founder, Laundry Express",
        rating: 5
      },
      {
        quote: "Order tracking keeps customers informed. Support calls dropped 70%!",
        author: "Grace K.",
        role: "Manager, Quick Wash Co.",
        rating: 5
      },
    ],
    features: [
      "Pickup scheduling",
      "Route optimization",
      "Order tracking",
      "Subscription plans",
      "Weight-based pricing",
      "Special instructions",
      "Delivery windows",
      "Customer portal",
      "SMS notifications",
      "Preference storage",
      "Loyalty rewards",
      "Business accounts"
    ]
  },
  "Personal Training": {
    icon: Dumbbell,
    jobLabel: "Sessions",
    staffLabel: "Trainers",
    serviceExamples: ["1-on-1 Training", "Group Classes", "Online Coaching"],
    dashboardStats: {
      bookings: 40,
      revenue: "$5,600",
      staff: 6
    },
    testimonials: [
      {
        quote: "Session packages with automatic renewals keep clients committed!",
        author: "Ryan F.",
        role: "Owner, FitLife Studio",
        rating: 5
      },
      {
        quote: "Progress tracking features keep clients motivated and coming back.",
        author: "Jessica H.",
        role: "Founder, Transform Fitness",
        rating: 5
      },
      {
        quote: "Managing trainer schedules across multiple locations is seamless.",
        author: "Mark C.",
        role: "Manager, Peak Performance",
        rating: 5
      },
    ],
    features: [
      "Session packages",
      "Progress tracking",
      "Client goals",
      "Workout logging",
      "Class scheduling",
      "Trainer availability",
      "Waitlist management",
      "Package renewals",
      "Client portal",
      "Video sessions",
      "Nutrition notes",
      "Referral rewards"
    ]
  },
  "Photography": {
    icon: Camera,
    jobLabel: "Shoots",
    staffLabel: "Photographers",
    serviceExamples: ["Portrait Session", "Event Coverage", "Product Shots"],
    dashboardStats: {
      bookings: 8,
      revenue: "$6,200",
      staff: 3
    },
    testimonials: [
      {
        quote: "Contract signing and deposit collection are now part of the booking flow!",
        author: "Emma D.",
        role: "Owner, Capture Moments",
        rating: 5
      },
      {
        quote: "Gallery delivery scheduling keeps clients excited about their photos.",
        author: "Alex P.",
        role: "Founder, Lens Studio",
        rating: 5
      },
      {
        quote: "Managing multiple photographers and assistants for events is easy now.",
        author: "Sophie L.",
        role: "Manager, Elite Photography",
        rating: 5
      },
    ],
    features: [
      "Package pricing",
      "Contract signing",
      "Deposit management",
      "Gallery delivery",
      "Session scheduling",
      "Location notes",
      "Second shooter",
      "Client questionnaires",
      "Print orders",
      "Album proofing",
      "Workflow tracking",
      "Referral program"
    ]
  },
};

type IndustryType = keyof typeof industryConfigs;

const industries: { name: IndustryType; icon: typeof Sparkles }[] = [
  { name: "Home Cleaning", icon: Sparkles },
  { name: "Office Cleaning", icon: Building2 },
  { name: "Pet Grooming", icon: Dog },
  { name: "Lawn Care", icon: Leaf },
  { name: "Hair Salon", icon: Scissors },
  { name: "Car Wash", icon: Car },
  { name: "Pool Service", icon: Droplets },
  { name: "Handyman", icon: Wrench },
  { name: "Painting", icon: PaintBucket },
  { name: "Laundry Service", icon: Shirt },
  { name: "Personal Training", icon: Dumbbell },
  { name: "Photography", icon: Camera },
];

const baseFeatures = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Intelligent booking system that automatically assigns the best available staff based on location, skills, and availability."
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Complete staff portal with job assignments, earnings tracking, availability management, and performance reviews."
  },
  {
    icon: CreditCard,
    title: "Seamless Payments",
    description: "Accept payments online with Stripe integration. Handle deposits, tips, and automatic invoicing."
  },
  {
    icon: BarChart3,
    title: "Business Analytics",
    description: "Track revenue, customer lifetime value, staff productivity, and profit margins with real-time dashboards."
  },
  {
    icon: Smartphone,
    title: "Mobile Ready",
    description: "Staff mobile app for check-ins, photo documentation, checklists, and real-time job updates."
  },
  {
    icon: Bell,
    title: "Automated Campaigns",
    description: "Re-engage customers with automated follow-up emails, review requests, and loyalty programs."
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>("Home Cleaning");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentConfig = useMemo(() => industryConfigs[selectedIndustry], [selectedIndustry]);

  const handleGetStarted = () => {
    sessionStorage.setItem("selectedIndustry", selectedIndustry);
    navigate("/auth", { state: { email, industry: selectedIndustry } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo 
        title="TidyWise - The Perfect Platform to Grow Your Service Business"
        description="Complete business management platform for service businesses. Smart scheduling, team management, payments, and analytics."
        canonicalPath="/"
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img 
                src="/images/tidywise-logo.png" 
                alt="TidyWise" 
                className="h-8 w-auto"
              />
              <span className="font-bold text-xl text-foreground">TidyWise</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              <Button variant="ghost" onClick={() => navigate("/auth")}>Log In</Button>
              <Button onClick={() => navigate("/auth")}>Start Free Trial</Button>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
                <Button variant="ghost" className="justify-start" onClick={() => navigate("/auth")}>Log In</Button>
                <Button onClick={() => navigate("/auth")}>Start Free Trial</Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                The perfect platform to grow a{" "}
                <span className="text-primary">service business.</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                We help your business from start to scale by giving your customers the perfect experience while making your life easier. Today, anyone can start a service and compete with multi-million dollar brands in seconds.
              </p>

              {/* Industry selector */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-3">Select your industry:</p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-4">
                  {industries.map((industry) => (
                    <button
                      key={industry.name}
                      onClick={() => setSelectedIndustry(industry.name)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedIndustry === industry.name
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      <industry.icon className="h-4 w-4" />
                      {industry.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Form */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto lg:mx-0">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
                <Button size="lg" className="h-12 px-8" onClick={handleGetStarted}>
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Start free. No credit card required.
              </p>
            </div>

            {/* Right side - Dashboard preview - Dynamic based on industry */}
            <div className="relative">
              <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                <div className="bg-sidebar p-4 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <span className="text-sidebar-foreground/60 text-sm ml-2">{selectedIndustry} Dashboard</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-secondary rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Today's {currentConfig.jobLabel}</p>
                      <p className="text-2xl font-bold text-foreground">{currentConfig.dashboardStats.bookings}</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold text-foreground">{currentConfig.dashboardStats.revenue}</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Active {currentConfig.staffLabel}</p>
                      <p className="text-2xl font-bold text-foreground">{currentConfig.dashboardStats.staff}</p>
                    </div>
                  </div>
                  <div className="bg-secondary rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">Upcoming {currentConfig.jobLabel}</span>
                      <span className="text-xs text-muted-foreground">View all</span>
                    </div>
                    {currentConfig.serviceExamples.map((service, i) => (
                      <div key={i} className="flex items-center gap-3 bg-card rounded-lg p-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <currentConfig.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{service}</p>
                          <p className="text-xs text-muted-foreground">123 Main St • 10:00 AM</p>
                        </div>
                        <div className="px-2 py-1 rounded-full bg-success/10 text-success text-xs">
                          Confirmed
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything you need to run your {selectedIndustry.toLowerCase()} business
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're not just booking software. TidyWise is the complete platform with everything you need to grow your {selectedIndustry.toLowerCase()} business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {baseFeatures.map((feature) => (
              <div 
                key={feature.title}
                className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Industry-specific features list */}
          <div className="mt-16 bg-card rounded-2xl border border-border p-8">
            <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
              Built for {selectedIndustry}...
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentConfig.features.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
                <Shield className="h-4 w-4" />
                Enterprise-grade security
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Compete with multi-million dollar {selectedIndustry.toLowerCase()} services in 60 seconds
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Whether you have a website or not, in less than 60 seconds you can have access to features that will take your {selectedIndustry.toLowerCase()} business to the next level.
              </p>
              <div className="space-y-4">
                {[
                  "Secure payment processing with Stripe",
                  "GDPR compliant data handling",
                  "99.9% uptime guarantee",
                  "Automatic backups & data protection"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                      <Zap className="h-3 w-3 text-success" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card rounded-xl p-6 text-center">
                    <p className="text-4xl font-bold text-primary">20K+</p>
                    <p className="text-sm text-muted-foreground">Active businesses</p>
                  </div>
                  <div className="bg-card rounded-xl p-6 text-center">
                    <p className="text-4xl font-bold text-primary">1M+</p>
                    <p className="text-sm text-muted-foreground">Bookings processed</p>
                  </div>
                  <div className="bg-card rounded-xl p-6 text-center">
                    <p className="text-4xl font-bold text-primary">50+</p>
                    <p className="text-sm text-muted-foreground">Countries</p>
                  </div>
                  <div className="bg-card rounded-xl p-6 text-center">
                    <p className="text-4xl font-bold text-primary">4.9</p>
                    <p className="text-sm text-muted-foreground">Average rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Dynamic based on industry */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Trusted by {selectedIndustry.toLowerCase()} businesses
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of {selectedIndustry.toLowerCase()} businesses already using TidyWise
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {currentConfig.testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Import Section */}
      <PricingImport />

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
            Ready to grow your {selectedIndustry.toLowerCase()} business?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Join thousands of {selectedIndustry.toLowerCase()} businesses that trust TidyWise to manage their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/auth")}
              className="h-12 px-8"
            >
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="h-12 px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/images/tidywise-logo.png" 
                  alt="TidyWise" 
                  className="h-8 w-auto"
                />
                <span className="font-bold text-xl text-foreground">TidyWise</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The complete platform to grow your service business.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Industries</h4>
              <ul className="space-y-2">
                {industries.slice(0, 6).map((industry) => (
                  <li key={industry.name}>
                    <button 
                      onClick={() => setSelectedIndustry(industry.name)}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {industry.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">About</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Blog</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} TidyWise. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

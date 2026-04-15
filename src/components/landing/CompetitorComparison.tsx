import { Check, X, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Feature {
  name: string;
  wedetailnc: boolean | string;
  bookingKoala: boolean | string;
  jobber: boolean | string;
}

const features: Feature[] = [
  { name: "Online Booking Form", wedetailnc: true, bookingKoala: true, jobber: true },
  { name: "Recurring Bookings", wedetailnc: true, bookingKoala: true, jobber: true },
  { name: "Staff Portal & App", wedetailnc: true, bookingKoala: true, jobber: true },
  { name: "Client Portal (Self-Service)", wedetailnc: true, bookingKoala: false, jobber: "Add-on" },
  { name: "GPS Check-ins", wedetailnc: true, bookingKoala: true, jobber: "Add-on" },
  { name: "Stripe Payments", wedetailnc: true, bookingKoala: true, jobber: true },
  { name: "SMS Notifications", wedetailnc: true, bookingKoala: "Add-on", jobber: "Add-on" },
  { name: "Loyalty Tiers & Rewards", wedetailnc: true, bookingKoala: true, jobber: false },
  { name: "Client Self-Cancellation", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Lead Management", wedetailnc: true, bookingKoala: true, jobber: true },
  { name: "Quote Generator", wedetailnc: true, bookingKoala: true, jobber: true },
  { name: "Invoicing & Auto-Reminders", wedetailnc: true, bookingKoala: true, jobber: true },
  { name: "Drag & Drop Scheduler", wedetailnc: true, bookingKoala: false, jobber: true },
  { name: "Payroll Management", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Expense Tracking", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Task Management", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Automated Email Campaigns", wedetailnc: true, bookingKoala: "Premium", jobber: false },
  { name: "Client Feedback Collection", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Automation Center (Workflows)", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Tip & Deposit Collection", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Referral Program", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Data Import / Migration Wizard", wedetailnc: true, bookingKoala: false, jobber: true },
  { name: "Email Template Builder", wedetailnc: true, bookingKoala: true, jobber: true },
  { name: "Extras/Add-on Pricing", wedetailnc: true, bookingKoala: true, jobber: false },
  { name: "Operations Tracker", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Inventory Tracking", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Photo Documentation", wedetailnc: true, bookingKoala: true, jobber: true },
  { name: "Review Requests", wedetailnc: true, bookingKoala: "Premium", jobber: true },
  { name: "Multi-location", wedetailnc: true, bookingKoala: true, jobber: true },
  { name: "Custom Checklists", wedetailnc: true, bookingKoala: true, jobber: true },
  { name: "P&L Reports", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Revenue Forecasting", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Platform Activity Analytics", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "AI Business Intelligence", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Coupon Codes", wedetailnc: true, bookingKoala: true, jobber: true },
  { name: "Sales Tax Automation", wedetailnc: true, bookingKoala: true, jobber: true },
  { name: "Bed/Bath + SqFt Pricing", wedetailnc: true, bookingKoala: true, jobber: false },
  { name: "Home Condition Pricing", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Demo/Test Mode", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "Offline Mode", wedetailnc: true, bookingKoala: false, jobber: false },
  { name: "In-App SMS Inbox", wedetailnc: true, bookingKoala: false, jobber: false },
];

const pricingPlans = [
  {
    name: "WE DETAIL NC",
    tagline: "Built for car detailing businesses",
    price: "$50",
    priceNote: "/month",
    trial: "2 months free",
    highlight: true,
  },
  {
    name: "Booking Koala",
    tagline: "General service booking",
    price: "$197",
    priceNote: "/month",
    trial: "14-day trial",
    highlight: false,
  },
  {
    name: "Jobber",
    tagline: "Field service management",
    price: "$349",
    priceNote: "/month",
    trial: "14-day trial",
    highlight: false,
  },
];

const renderFeatureValue = (value: boolean | string) => {
  if (value === true) {
    return <Check className="h-5 w-5 text-success mx-auto" />;
  }
  if (value === false) {
    return <X className="h-5 w-5 text-destructive/60 mx-auto" />;
  }
  return <span className="text-xs text-warning font-medium">{value}</span>;
};

export function CompetitorComparison() {
  const navigate = useNavigate();

  return (
    <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            WE DETAIL NC vs Booking Koala vs Jobber: Which Cleaning Software Wins?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Looking for Booking Koala alternatives or Jobber alternatives? Compare the best car detailing business software side by side. More features, 75% lower price.
          </p>
        </div>

        {/* Pricing Comparison */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 ${
                plan.highlight
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-card border border-border"
              }`}
            >
              <div className="text-center mb-6">
                <h3 className={`text-xl font-bold ${plan.highlight ? "" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {plan.tagline}
                </p>
              </div>

              <div className={`p-6 rounded-lg text-center ${plan.highlight ? "bg-primary-foreground/10" : "bg-muted"}`}>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-4xl font-bold ${plan.highlight ? "" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {plan.priceNote}
                  </span>
                </div>
                <p className={`text-sm mt-2 font-medium ${plan.highlight ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                  {plan.trial}
                </p>
              </div>

              {plan.highlight && (
                <Button
                  variant="secondary"
                  className="w-full mt-6"
                  onClick={() => navigate("/signup")}
                >
                  Start 2-Month Free Trial
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-xl font-semibold text-foreground">Feature Comparison</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Every feature WE DETAIL NC offers compared to the competition
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-4 font-medium text-foreground">Feature</th>
                  <th className="text-center p-4 font-medium text-primary">WE DETAIL NC</th>
                  <th className="text-center p-4 font-medium text-foreground">Booking Koala</th>
                  <th className="text-center p-4 font-medium text-foreground">Jobber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {features.map((feature, index) => (
                  <tr key={feature.name} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <td className="p-4 text-sm text-foreground">{feature.name}</td>
                    <td className="p-4 text-center">{renderFeatureValue(feature.wedetailnc)}</td>
                    <td className="p-4 text-center">{renderFeatureValue(feature.bookingKoala)}</td>
                    <td className="p-4 text-center">{renderFeatureValue(feature.jobber)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center mt-12">
          <Button size="lg" onClick={() => navigate("/signup")}>
            Try WE DETAIL NC Free — No Credit Card Required
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Trusted by car detailing businesses using WE DETAIL NC
          </p>
        </div>
      </div>
    </section>
  );
}
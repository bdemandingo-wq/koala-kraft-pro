import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Zap, Crown, Download } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for small businesses',
    features: ['Up to 50 bookings/month', '2 staff members', 'Email notifications', 'Basic reports'],
    current: false,
  },
  {
    name: 'Professional',
    price: 79,
    description: 'For growing businesses',
    features: ['Unlimited bookings', 'Up to 10 staff', 'SMS notifications', 'Advanced reports', 'Customer portal'],
    current: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    description: 'For large operations',
    features: ['Everything in Pro', 'Unlimited staff', 'API access', 'Custom branding', 'Priority support'],
    current: false,
  },
];

const invoices = [
  { id: 'INV-001', date: '2024-12-01', amount: 79, status: 'paid' },
  { id: 'INV-002', date: '2024-11-01', amount: 79, status: 'paid' },
  { id: 'INV-003', date: '2024-10-01', amount: 79, status: 'paid' },
];

export default function BillingPage() {
  return (
    <AdminLayout
      title="Billing"
      subtitle="Manage your subscription and billing"
    >
      {/* Current Plan */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Current Plan
              </CardTitle>
              <CardDescription>You are currently on the Professional plan</CardDescription>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">$79<span className="text-lg text-muted-foreground font-normal">/month</span></p>
              <p className="text-sm text-muted-foreground">Next billing date: January 1, 2025</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Cancel Subscription</Button>
              <Button>Upgrade Plan</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.current ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.current && <Badge className="bg-primary">Current</Badge>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-4">${plan.price}<span className="text-lg text-muted-foreground font-normal">/mo</span></p>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full mt-4" 
                variant={plan.current ? 'outline' : 'default'}
                disabled={plan.current}
              >
                {plan.current ? 'Current Plan' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Method */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                VISA
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/2025</p>
              </div>
            </div>
            <Button variant="outline">Update</Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Download your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium">{invoice.id}</p>
                  <p className="text-sm text-muted-foreground">{invoice.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">${invoice.amount}</span>
                  <Badge className="bg-success/20 text-success border-success/30 capitalize">{invoice.status}</Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

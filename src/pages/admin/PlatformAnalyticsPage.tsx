import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Building2, CreditCard, TrendingUp, UserPlus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PlatformAnalytics {
  signups: {
    total: number;
    recent: { id: string; email: string; created_at: string }[];
    last30Days: number;
  };
  organizations: {
    total: number;
    recent: { id: string; name: string; created_at: string }[];
    last30Days: number;
  };
  subscriptions: {
    active: number;
    trialing: number;
    canceled: number;
    list: { id: string; customer_email: string; status: string; created: string; current_period_end: string }[];
  };
}

export default function PlatformAnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('platform-analytics');
      if (error) throw error;
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error fetching platform analytics:', err);
      setError(err.message || 'Failed to load analytics');
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Check if user is platform admin
  if (user?.email !== 'support@tidywisecleaning.com') {
    return (
      <AdminLayout title="Unauthorized" subtitle="You don't have access to this page">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">This page is only accessible to platform administrators.</p>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Platform Analytics" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Platform Analytics" subtitle="Error loading data">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchAnalytics}>Try Again</Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Platform Analytics"
      subtitle="Overview of all signups and subscriptions"
    >
      <div className="space-y-6">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.signups.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{analytics?.signups.last30Days || 0} last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.organizations.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{analytics?.organizations.last30Days || 0} last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.subscriptions.active || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.subscriptions.trialing || 0} in trial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.signups.total 
                  ? Math.round(((analytics.subscriptions.active + analytics.subscriptions.trialing) / analytics.signups.total) * 100) 
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Signups to subscriptions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Recent Signups (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.signups.recent && analytics.signups.recent.length > 0 ? (
              <div className="space-y-3">
                {analytics.signups.recent.map((signup) => (
                  <div key={signup.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-medium">{signup.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(signup.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <Badge variant="secondary">New</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent signups</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Organizations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Recent Organizations (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.organizations.recent && analytics.organizations.recent.length > 0 ? (
              <div className="space-y-3">
                {analytics.organizations.recent.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(org.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <Badge variant="outline">Organization</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent organizations</p>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{analytics?.subscriptions.active || 0}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{analytics?.subscriptions.trialing || 0}</p>
                <p className="text-sm text-muted-foreground">Trialing</p>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{analytics?.subscriptions.canceled || 0}</p>
                <p className="text-sm text-muted-foreground">Canceled</p>
              </div>
            </div>

            {analytics?.subscriptions.list && analytics.subscriptions.list.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Recent Subscriptions</h4>
                {analytics.subscriptions.list.slice(0, 10).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-medium">{sub.customer_email}</p>
                      <p className="text-sm text-muted-foreground">
                        Created: {format(new Date(sub.created), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge 
                      variant={sub.status === 'active' ? 'default' : sub.status === 'trialing' ? 'secondary' : 'destructive'}
                    >
                      {sub.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No subscriptions found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

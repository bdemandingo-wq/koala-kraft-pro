import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { UpcomingBookings } from '@/components/admin/UpcomingBookings';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { useBookings, useCustomers, BookingWithDetails } from '@/hooks/useBookings';
import { Calendar, Users, DollarSign, Clock, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export default function AdminDashboard() {
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const [revenueTab, setRevenueTab] = useState<'month' | 'alltime'>('month');
  const [bookingsTab, setBookingsTab] = useState<'month' | 'alltime'>('month');

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    
    // Get bookings for this month
    const monthBookings = bookings.filter(b => {
      const bookingDate = new Date(b.scheduled_at);
      return isWithinInterval(bookingDate, { start: monthStart, end: monthEnd });
    });
    
    // Get bookings remaining for this week (upcoming, not cancelled/completed)
    const pendingThisWeek = bookings.filter(b => {
      const bookingDate = new Date(b.scheduled_at);
      return isWithinInterval(bookingDate, { start: now, end: weekEnd }) && 
             b.status !== 'cancelled' && 
             b.status !== 'completed';
    });
    
    // Calculate revenue
    const monthRevenue = monthBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

    return {
      monthBookings: monthBookings.length,
      totalBookings: bookings.length,
      pendingThisWeek: pendingThisWeek.length,
      totalCustomers: customers.length,
      monthRevenue,
      totalRevenue,
    };
  }, [bookings, customers]);

  const isLoading = bookingsLoading || customersLoading;

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening today."
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Revenue Card with Tabs */}
        <div className="stat-card animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <Tabs value={revenueTab} onValueChange={(v) => setRevenueTab(v as 'month' | 'alltime')}>
                  <TabsList className="h-6 p-0.5">
                    <TabsTrigger value="month" className="text-xs h-5 px-2">Month</TabsTrigger>
                    <TabsTrigger value="alltime" className="text-xs h-5 px-2">All</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <p className="text-3xl font-bold mt-2">
                ${(revenueTab === 'month' ? stats.monthRevenue : stats.totalRevenue).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {revenueTab === 'month' ? 'This month' : 'All time'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Bookings Card with Tabs */}
        <div className="stat-card animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-muted-foreground">Bookings</p>
                <Tabs value={bookingsTab} onValueChange={(v) => setBookingsTab(v as 'month' | 'alltime')}>
                  <TabsList className="h-6 p-0.5">
                    <TabsTrigger value="month" className="text-xs h-5 px-2">Month</TabsTrigger>
                    <TabsTrigger value="alltime" className="text-xs h-5 px-2">All</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <p className="text-3xl font-bold mt-2">
                {bookingsTab === 'month' ? stats.monthBookings : stats.totalBookings}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {bookingsTab === 'month' ? 'This month' : 'All time'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        <StatCard
          title="Pending This Week"
          value={stats.pendingThisWeek}
          icon={<Clock className="w-6 h-6" />}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={<Users className="w-6 h-6" />}
        />
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RevenueChart bookings={bookings as BookingWithDetails[]} />
        </div>
        <div>
          <UpcomingBookings bookings={bookings as BookingWithDetails[]} />
        </div>
      </div>
    </AdminLayout>
  );
}

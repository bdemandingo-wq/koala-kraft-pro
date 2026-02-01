import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Calendar as CalendarIcon, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Seo } from "@/components/Seo";
import { useClientPortal } from "@/contexts/ClientPortalContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
}

export default function PortalRequestPage() {
  const navigate = useNavigate();
  const { user, customer, loading } = useClientPortal();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedService, setSelectedService] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/portal", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user?.organization_id) return;

    const fetchServices = async () => {
      const { data } = await supabase
        .from("services")
        .select("id, name")
        .eq("organization_id", user.organization_id)
        .eq("is_active", true)
        .order("name");

      setServices(data || []);
    };

    fetchServices();
  }, [user]);

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error("Please select a preferred date");
      return;
    }

    if (!user || !customer) {
      toast.error("Session expired. Please log in again.");
      navigate("/portal");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("client_booking_requests").insert({
        client_user_id: user.id,
        customer_id: user.customer_id,
        organization_id: user.organization_id,
        requested_date: selectedDate.toISOString(),
        service_id: selectedService || null,
        notes: notes.trim() || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Booking request submitted! We'll get back to you soon.");
      navigate("/portal/dashboard");
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user || !customer) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Seo
        title="Request a Booking | Client Portal"
        description="Submit a booking request for your preferred date and service."
        canonicalPath="/portal/request"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/portal/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Request a Booking</h1>
            <p className="text-sm text-muted-foreground">
              Choose your preferred date
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>New Booking Request</CardTitle>
            <CardDescription>
              Submit a request and we'll confirm your appointment within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Preferred Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate
                      ? format(selectedDate, "EEEE, MMMM d, yyyy")
                      : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Service Selection */}
            {services.length > 0 && (
              <div className="space-y-2">
                <Label>Service (Optional)</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or preferences..."
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleSubmit}
              disabled={!selectedDate || submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Request
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

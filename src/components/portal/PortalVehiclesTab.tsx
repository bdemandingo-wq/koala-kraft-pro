import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Calendar, DollarSign, ImageIcon, Video, ChevronDown, ChevronUp, Loader2, Wrench } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClientPortal } from "@/contexts/ClientPortalContext";
import { supabase } from "@/lib/supabase";

interface Vehicle {
  id: string;
  year: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
  vehicle_type: string | null;
}

interface VehicleBooking {
  id: string;
  booking_number: number;
  scheduled_at: string;
  status: string;
  total_amount: number;
  service_name: string | null;
}

interface MediaItem {
  id: string;
  media_type: string;
  file_type: string;
  file_url: string;
  file_name: string;
  notes: string | null;
  uploaded_at: string;
}

export function PortalVehiclesTab() {
  const navigate = useNavigate();
  const { user } = useClientPortal();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  const [vehicleBookings, setVehicleBookings] = useState<Record<string, VehicleBooking[]>>({});
  const [vehicleMedia, setVehicleMedia] = useState<Record<string, MediaItem[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchVehicles = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("customer_vehicles" as any)
        .select("id, year, make, model, color, vehicle_type")
        .eq("customer_id", user.customer_id)
        .order("created_at", { ascending: false });
      setVehicles((data as any[]) || []);
      setLoading(false);
    };
    fetchVehicles();
  }, [user]);

  const toggleVehicle = async (vehicleId: string) => {
    if (expandedVehicle === vehicleId) {
      setExpandedVehicle(null);
      return;
    }
    setExpandedVehicle(vehicleId);

    if (vehicleBookings[vehicleId]) return;

    setLoadingDetails(vehicleId);
    // Fetch bookings for this vehicle
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, booking_number, scheduled_at, status, total_amount, service:services(name)")
      .eq("vehicle_id", vehicleId)
      .order("scheduled_at", { ascending: false })
      .limit(20);

    const transformed = (bookings || []).map((b: any) => ({
      id: b.id,
      booking_number: b.booking_number,
      scheduled_at: b.scheduled_at,
      status: b.status,
      total_amount: b.total_amount,
      service_name: b.service?.name || null,
    }));
    setVehicleBookings((prev) => ({ ...prev, [vehicleId]: transformed }));

    // Fetch media for those bookings
    const bookingIds = transformed.map((b: VehicleBooking) => b.id);
    if (bookingIds.length > 0) {
      const { data: media } = await supabase
        .from("job_media")
        .select("id, media_type, file_type, file_url, file_name, notes, uploaded_at, booking_id")
        .in("booking_id", bookingIds)
        .order("uploaded_at", { ascending: false });
      setVehicleMedia((prev) => ({ ...prev, [vehicleId]: (media as any[]) || [] }));
    }
    setLoadingDetails(null);
  };

  const handleRequestService = (vehicle: Vehicle) => {
    const notes = `Vehicle: ${[vehicle.year, vehicle.make, vehicle.model, vehicle.color].filter(Boolean).join(" ")}`;
    navigate(`/portal/request?notes=${encodeURIComponent(notes)}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No vehicles on file yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your vehicles will appear here after your first service
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {vehicles.map((vehicle) => {
        const isExpanded = expandedVehicle === vehicle.id;
        const bookings = vehicleBookings[vehicle.id] || [];
        const media = vehicleMedia[vehicle.id] || [];
        const label = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");

        return (
          <Card key={vehicle.id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Vehicle header */}
              <button
                className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                onClick={() => toggleVehicle(vehicle.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{label || "Vehicle"}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {vehicle.color && <span>{vehicle.color}</span>}
                      {vehicle.vehicle_type && (
                        <>
                          <span>·</span>
                          <span>{vehicle.vehicle_type}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {loadingDetails === vehicle.id ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {/* Request Service button */}
                      <div className="pt-3">
                        <Button
                          className="w-full gap-2"
                          onClick={() => handleRequestService(vehicle)}
                        >
                          <Wrench className="h-4 w-4" />
                          Request Service for This Vehicle
                        </Button>
                      </div>

                      {/* Service history */}
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Service History
                        </h4>
                        {bookings.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No services yet</p>
                        ) : (
                          <div className="space-y-2">
                            {bookings.map((b) => (
                              <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                <div className="space-y-0.5">
                                  <p className="text-sm font-medium">{b.service_name || "Service"}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(b.scheduled_at), "MMM d, yyyy")}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold">${b.total_amount}</p>
                                  <Badge
                                    variant={b.status === "completed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"}
                                    className="text-[10px]"
                                  >
                                    {b.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Before & After media */}
                      {media.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Before & After
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {/* Before column */}
                            <div>
                              <p className="text-xs font-medium mb-1 text-muted-foreground">Before</p>
                              <div className="space-y-2">
                                {media.filter((m) => m.media_type === "before").slice(0, 4).map((m) => (
                                  <MediaThumbnail key={m.id} item={m} />
                                ))}
                                {media.filter((m) => m.media_type === "before").length === 0 && (
                                  <p className="text-xs text-muted-foreground">No before media</p>
                                )}
                              </div>
                            </div>
                            {/* After column */}
                            <div>
                              <p className="text-xs font-medium mb-1 text-muted-foreground">After</p>
                              <div className="space-y-2">
                                {media.filter((m) => m.media_type === "after").slice(0, 4).map((m) => (
                                  <MediaThumbnail key={m.id} item={m} />
                                ))}
                                {media.filter((m) => m.media_type === "after").length === 0 && (
                                  <p className="text-xs text-muted-foreground">No after media</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function MediaThumbnail({ item }: { item: MediaItem }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    const getUrl = async () => {
      // file_url stores the storage path like org_id/booking_id/filename
      const bucket = item.media_type === "before" ? "job-before-media" : "job-after-media";
      const { data } = await supabase.storage.from(bucket).createSignedUrl(item.file_url, 3600);
      if (data?.signedUrl) setSignedUrl(data.signedUrl);
    };
    getUrl();
  }, [item]);

  if (!signedUrl) {
    return <div className="h-20 rounded-lg bg-muted animate-pulse" />;
  }

  if (item.file_type === "video") {
    return (
      <div className="relative rounded-lg overflow-hidden bg-black">
        <video src={signedUrl} controls className="w-full h-20 object-cover" preload="metadata" />
      </div>
    );
  }

  return (
    <img
      src={signedUrl}
      alt={item.notes || "Service media"}
      className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
      onClick={() => window.open(signedUrl, "_blank")}
    />
  );
}

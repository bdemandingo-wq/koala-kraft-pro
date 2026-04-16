import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check } from 'lucide-react';
import { usePublicOrgPricing } from '@/hooks/usePublicOrgPricing';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { applyPublicBranding, clearPublicBranding } from '@/hooks/useBrandingColors';

const SERVICE_AREAS = [
  'Fort Lauderdale',
  'Miami-Dade',
  'West Palm Beach',
  'Broward County',
  'Other',
];

export default function PublicBookingPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  // Read query params for pre-filling
  const [preSelectedService] = useState(() => new URLSearchParams(window.location.search).get('service') || '');
  const [preFilledName] = useState(() => new URLSearchParams(window.location.search).get('name') || '');
  const [preFilledPhone] = useState(() => new URLSearchParams(window.location.search).get('phone') || '');
  const [preFilledEmail] = useState(() => new URLSearchParams(window.location.search).get('email') || '');
  const [preFilledVehicleType] = useState(() => new URLSearchParams(window.location.search).get('vehicleType') || '');

  const {
    services,
    organizationName,
    organizationId,
    logoUrl,
    primaryColor,
    accentColor,
    loading: pricingLoading,
  } = usePublicOrgPricing(orgSlug);

  // Form state
  const [fullName, setFullName] = useState(preFilledName);
  const [phone, setPhone] = useState(preFilledPhone);
  const [email, setEmail] = useState(preFilledEmail);
  const [vehicle, setVehicle] = useState(() => {
    const vt = preFilledVehicleType;
    return vt || '';
  });
  const [selectedPackage, setSelectedPackage] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState('');

  // Link tracking
  const [trackingRef] = useState(() => new URLSearchParams(window.location.search).get('ref') || null);

  // Pre-select service from query param
  useEffect(() => {
    if (preSelectedService && services.length > 0 && !selectedPackage) {
      const match = services.find(s => s.name.toLowerCase() === preSelectedService.toLowerCase());
      if (match) setSelectedPackage(match.id);
    }
  }, [preSelectedService, services, selectedPackage]);

  // Apply branding
  useEffect(() => {
    if (primaryColor || accentColor) {
      applyPublicBranding(primaryColor, accentColor);
    }
    return () => clearPublicBranding();
  }, [primaryColor, accentColor]);

  // Track link opened
  useEffect(() => {
    if (trackingRef && organizationId) {
      supabase
        .from('booking_link_tracking' as any)
        .update({ link_opened_at: new Date().toISOString(), status: 'opened' })
        .eq('tracking_ref', trackingRef)
        .then(({ error }) => {
          if (error) console.log('Link tracking update skipped:', error.message);
        });
    }
  }, [trackingRef, organizationId]);

  // Abandoned booking tracking
  const sessionTokenRef = useState(() => crypto.randomUUID())[0];
  const abandonedTrackedRef = useState({ tracked: false })[0];

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!fullName.trim()) { toast.error('Please enter your full name.'); return; }
    if (!phone.trim()) { toast.error('Please enter your phone number.'); return; }
    if (!vehicle.trim()) { toast.error('Please enter your vehicle info.'); return; }
    if (!selectedPackage) { toast.error('Please select a package.'); return; }
    if (!serviceArea) { toast.error('Please select a service area.'); return; }
    if (!preferredDate) { toast.error('Please select a preferred date.'); return; }
    if (!preferredTime) { toast.error('Please select a preferred time.'); return; }

    setIsSubmitting(true);

    try {
      const service = services.find(s => s.id === selectedPackage);
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Build scheduled_at from date and time (ensure valid ISO 8601)
      const dateObj = new Date(`${preferredDate}T${preferredTime}:00`);
      if (isNaN(dateObj.getTime())) {
        toast.error('Invalid date or time selected. Please try again.');
        setIsSubmitting(false);
        return;
      }
      const scheduledAt = dateObj.toISOString();

      const { data: webhookResult, error: webhookError } = await supabase.functions.invoke('external-booking-webhook', {
        body: {
          first_name: firstName,
          last_name: lastName,
          email: email || undefined,
          phone: phone,
          address: serviceArea,
          service_name: service?.name || '',
          scheduled_at: scheduledAt,
          duration: service?.duration || 120,
          total_amount: service?.minimumPrice || 0,
          frequency: 'one-time',
          notes: [
            vehicle && `Vehicle: ${vehicle}`,
            `Service Area: ${serviceArea}`,
            notes,
          ].filter(Boolean).join('\n') || undefined,
          organization_id: organizationId || undefined,
          organization_slug: orgSlug || undefined,
        },
      });

      if (webhookError) {
        console.error('Booking creation error:', webhookError);
        toast.error('Failed to submit booking request. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const bookingNumber = webhookResult?.booking_number || '';
      const newConfirmation = bookingNumber ? `BK-${bookingNumber}` : `BK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setConfirmationNumber(newConfirmation);
      setSubmitted(true);

      // Mark abandoned as converted
      if (abandonedTrackedRef.tracked) {
        supabase
          .from('abandoned_bookings')
          .update({ converted: true, converted_at: new Date().toISOString() })
          .eq('session_token', sessionTokenRef)
          .then(() => {});
      }
      if (trackingRef) {
        supabase
          .from('booking_link_tracking' as any)
          .update({ booking_completed_at: new Date().toISOString(), status: 'completed' })
          .eq('tracking_ref', trackingRef)
          .then(() => {});
      }

      toast.success(`Booking request submitted! Confirmation: ${newConfirmation}`);
    } catch (err) {
      console.error('Failed to submit booking:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [fullName, phone, email, vehicle, selectedPackage, serviceArea, preferredDate, preferredTime, notes, services, organizationId, orgSlug, trackingRef, abandonedTrackedRef, sessionTokenRef]);

  // Track abandoned bookings when phone is entered
  useEffect(() => {
    if (phone.trim() && organizationId && !abandonedTrackedRef.tracked) {
      abandonedTrackedRef.tracked = true;
      const nameParts = fullName.trim().split(/\s+/);
      supabase
        .from('abandoned_bookings')
        .insert({
          organization_id: organizationId,
          first_name: nameParts[0] || null,
          last_name: nameParts.slice(1).join(' ') || null,
          email: email || null,
          phone: phone,
          service_id: selectedPackage || null,
          step_reached: 1,
          session_token: sessionTokenRef,
        })
        .then(({ error }) => {
          if (error) console.log('Abandoned tracking skipped:', error.message);
        });
    }
  }, [phone, organizationId]);

  if (pricingLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c9a84c]" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white">
        {/* Header */}
        <header className="border-b border-[#222] bg-[#111]">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={organizationName} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
            ) : null}
            <span className="text-lg font-bold tracking-wider uppercase text-[#c9a84c]">
              {organizationName || 'Book Now'}
            </span>
          </div>
        </header>

        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Booking Request Submitted!
          </h1>
          <p className="text-[#999] mb-6">
            We'll confirm your appointment via phone call within a few hours.
          </p>
          <div className="inline-block bg-[#1a1a1a] border border-[#333] rounded-lg px-6 py-3">
            <p className="text-sm text-[#999]">Confirmation Number</p>
            <p className="text-xl font-bold text-[#c9a84c]">{confirmationNumber}</p>
          </div>
          <div className="mt-8">
            <button
              onClick={() => {
                setSubmitted(false);
                setFullName('');
                setPhone('');
                setEmail('');
                setVehicle('');
                setSelectedPackage('');
                setServiceArea('');
                setPreferredDate('');
                setPreferredTime('');
                setNotes('');
              }}
              className="bg-[#c9a84c] hover:bg-[#b89a40] text-black font-semibold px-8 py-3 rounded transition-colors"
            >
              Book Another Detail
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-[#222] bg-[#111]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={organizationName} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
          ) : null}
          <span className="text-lg font-bold tracking-wider uppercase text-[#c9a84c]">
            {organizationName || 'Book Now'}
          </span>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Book Your Detail
            </h1>
            <p className="text-[#999] text-lg">
              Fill out the form and we'll confirm your appointment.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white text-sm font-medium">
                  Full Name <span className="text-[#c9a84c]">*</span>
                </Label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent border-b border-[#444] text-white placeholder-[#666] py-3 px-2 focus:border-[#c9a84c] focus:outline-none transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white text-sm font-medium">
                  Phone <span className="text-[#c9a84c]">*</span>
                </Label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="(xxx)-xxx-xxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent border-b border-[#444] text-white placeholder-[#666] py-3 px-2 focus:border-[#c9a84c] focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm font-medium">Email</Label>
              <input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-[#444] text-white placeholder-[#666] py-3 px-2 focus:border-[#c9a84c] focus:outline-none transition-colors"
              />
            </div>

            {/* Vehicle */}
            <div className="space-y-2">
              <Label htmlFor="vehicle" className="text-white text-sm font-medium">
                Vehicle (Year, Make, Model) <span className="text-[#c9a84c]">*</span>
              </Label>
              <input
                id="vehicle"
                type="text"
                placeholder="e.g. 2022 BMW X5"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                className="w-full bg-transparent border-b border-[#444] text-white placeholder-[#666] py-3 px-2 focus:border-[#c9a84c] focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Package & Service Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="package" className="text-white text-sm font-medium">
                  Package <span className="text-[#c9a84c]">*</span>
                </Label>
                <select
                  id="package"
                  value={selectedPackage}
                  onChange={(e) => setSelectedPackage(e.target.value)}
                  className="w-full bg-transparent border-b border-[#444] text-white py-3 px-2 focus:border-[#c9a84c] focus:outline-none transition-colors appearance-none cursor-pointer"
                  required
                >
                  <option value="" className="bg-[#1a1a1a]">Select package</option>
                  {services.map(svc => (
                    <option key={svc.id} value={svc.id} className="bg-[#1a1a1a]">
                      {svc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceArea" className="text-white text-sm font-medium">
                  Service Area <span className="text-[#c9a84c]">*</span>
                </Label>
                <select
                  id="serviceArea"
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                  className="w-full bg-transparent border-b border-[#444] text-white py-3 px-2 focus:border-[#c9a84c] focus:outline-none transition-colors appearance-none cursor-pointer"
                  required
                >
                  <option value="" className="bg-[#1a1a1a]">Select area</option>
                  {SERVICE_AREAS.map(area => (
                    <option key={area} value={area} className="bg-[#1a1a1a]">
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="preferredDate" className="text-white text-sm font-medium">
                  Preferred Date <span className="text-[#c9a84c]">*</span>
                </Label>
                <input
                  id="preferredDate"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-transparent border-b border-[#444] text-white py-3 px-2 focus:border-[#c9a84c] focus:outline-none transition-colors"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredTime" className="text-white text-sm font-medium">
                  Preferred Time <span className="text-[#c9a84c]">*</span>
                </Label>
                <input
                  id="preferredTime"
                  type="time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full bg-transparent border-b border-[#444] text-white py-3 px-2 focus:border-[#c9a84c] focus:outline-none transition-colors"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-white text-sm font-medium">Additional Notes</Label>
              <textarea
                id="notes"
                placeholder="Any special requests?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full bg-transparent border border-[#444] rounded text-white placeholder-[#666] py-3 px-3 focus:border-[#c9a84c] focus:outline-none transition-colors resize-y"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#c9a84c] hover:bg-[#b89a40] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-4 rounded transition-colors text-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Booking Request'
              )}
            </button>

            <p className="text-center text-[#666] text-sm">
              We'll confirm your appointment via phone call within a few hours.
            </p>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222] bg-[#111] py-10 mt-auto">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              {logoUrl && (
                <img src={logoUrl} alt={organizationName} className="w-16 h-16 rounded-full object-cover mb-4" loading="lazy" />
              )}
              <h3 className="text-lg font-bold uppercase tracking-wider text-[#c9a84c] mb-2">
                {organizationName || 'Our Services'}
              </h3>
              <p className="text-[#888] text-sm">
                Premium mobile detailing serving South Florida.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-[#c9a84c] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Quick Links
              </h4>
              <ul className="space-y-2 text-[#888] text-sm">
                <li><span className="hover:text-white cursor-pointer transition-colors">Home</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Services & Pricing</span></li>
                <li><span className="text-[#c9a84c]">Book Appointment</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Contact</span></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-semibold text-[#c9a84c] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Contact & Hours
              </h4>
              <div className="space-y-2 text-[#888] text-sm">
                <p className="font-medium text-white mt-4">Hours of Operation</p>
                <p>Monday – Sunday</p>
                <p className="text-[#c9a84c]">8:00 AM – 9:00 PM</p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#222] mt-8 pt-6 text-center text-[#666] text-xs">
            © {new Date().getFullYear()} {organizationName || 'All rights reserved.'}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

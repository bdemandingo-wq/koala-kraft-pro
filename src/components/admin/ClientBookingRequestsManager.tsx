import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare,
  Loader2,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';

interface BookingRequest {
  id: string;
  requested_date: string;
  status: string;
  notes: string | null;
  admin_response_note: string | null;
  created_at: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  } | null;
  service: {
    name: string;
  } | null;
  client_user: {
    username: string;
  } | null;
}

export function ClientBookingRequestsManager() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [responseNote, setResponseNote] = useState('');
  const [responseAction, setResponseAction] = useState<'approved' | 'rejected'>('approved');

  // Fetch booking requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['client-booking-requests', organization?.id, statusFilter],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      let query = supabase
        .from('client_booking_requests')
        .select(`
          id,
          requested_date,
          status,
          notes,
          admin_response_note,
          created_at,
          customer:customers(first_name, last_name, email, phone),
          service:services(name),
          client_user:client_portal_users(username)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BookingRequest[];
    },
    enabled: !!organization?.id,
  });

  // Respond to request mutation
  const respondToRequest = useMutation({
    mutationFn: async ({
      requestId,
      status,
      responseNote,
    }: {
      requestId: string;
      status: 'approved' | 'rejected';
      responseNote: string;
    }) => {
      // Update the request
      const { error: updateError } = await supabase
        .from('client_booking_requests')
        .update({
          status,
          admin_response_note: responseNote.trim() || null,
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Get the request details to create notification
      const request = selectedRequest;
      if (request) {
        // Create notification for the client
        const { data: portalUser } = await supabase
          .from('client_portal_users')
          .select('id')
          .eq('customer_id', request.customer?.first_name ? 
            // Get customer_id from the request
            (await supabase
              .from('client_booking_requests')
              .select('client_user_id')
              .eq('id', requestId)
              .single()).data?.client_user_id 
            : null)
          .maybeSingle();

        // Get client_user_id from the request
        const { data: requestData } = await supabase
          .from('client_booking_requests')
          .select('client_user_id')
          .eq('id', requestId)
          .single();

        if (requestData?.client_user_id) {
          await supabase.from('client_notifications').insert({
            client_user_id: requestData.client_user_id,
            organization_id: organization?.id,
            title: status === 'approved' ? 'Booking Request Approved!' : 'Booking Request Update',
            message: status === 'approved'
              ? `Your booking request for ${format(new Date(request.requested_date), 'MMMM d, yyyy')} has been approved.${responseNote ? ` Note: ${responseNote}` : ''}`
              : `Your booking request for ${format(new Date(request.requested_date), 'MMMM d, yyyy')} could not be accommodated.${responseNote ? ` Note: ${responseNote}` : ''}`,
            type: status,
            is_read: false,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-booking-requests'] });
      toast.success(responseAction === 'approved' ? 'Request approved!' : 'Request rejected');
      setRespondDialogOpen(false);
      setSelectedRequest(null);
      setResponseNote('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to respond to request');
    },
  });

  const openRespondDialog = (request: BookingRequest, action: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setResponseAction(action);
    setResponseNote('');
    setRespondDialogOpen(true);
  };

  const handleRespond = () => {
    if (!selectedRequest) return;
    respondToRequest.mutate({
      requestId: selectedRequest.id,
      status: responseAction,
      responseNote,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-primary"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="flex items-center gap-2">
                Booking Requests
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="rounded-full">
                    {pendingCount}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Review and respond to client booking requests
              </CardDescription>
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No {statusFilter === 'all' ? '' : statusFilter} booking requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {request.customer?.first_name} {request.customer?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{request.customer?.email}</p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Requested Date</p>
                    <p className="font-medium">
                      {format(new Date(request.requested_date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  {request.service && (
                    <div>
                      <p className="text-muted-foreground">Service</p>
                      <p className="font-medium">{(request.service as any)?.name}</p>
                    </div>
                  )}
                </div>

                {request.notes && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Customer Notes</p>
                    <p className="bg-muted p-2 rounded mt-1">{request.notes}</p>
                  </div>
                )}

                {request.admin_response_note && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Your Response</p>
                    <p className="bg-primary/10 p-2 rounded mt-1">{request.admin_response_note}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Submitted {format(new Date(request.created_at), 'MMM d, h:mm a')}
                  </p>
                  
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => openRespondDialog(request, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openRespondDialog(request, 'approved')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Respond Dialog */}
      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === 'approved' ? 'Approve Request' : 'Decline Request'}
            </DialogTitle>
            <DialogDescription>
              {responseAction === 'approved'
                ? 'Confirm this booking request and optionally add a note.'
                : 'Let the customer know why you cannot accommodate this request.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p><strong>{selectedRequest.customer?.first_name} {selectedRequest.customer?.last_name}</strong></p>
                <p>{format(new Date(selectedRequest.requested_date), 'EEEE, MMMM d, yyyy')}</p>
                {selectedRequest.service && <p>{(selectedRequest.service as any)?.name}</p>}
              </div>

              <div className="space-y-2">
                <Label>Response Note (Optional)</Label>
                <Textarea
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  placeholder={
                    responseAction === 'approved'
                      ? "Any details about the confirmed appointment..."
                      : "Explain why you cannot accommodate this request..."
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRespond}
              disabled={respondToRequest.isPending}
              variant={responseAction === 'rejected' ? 'destructive' : 'default'}
            >
              {respondToRequest.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {responseAction === 'approved' ? 'Approve Request' : 'Decline Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

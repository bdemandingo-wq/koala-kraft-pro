import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Building2 } from 'lucide-react';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetch } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !businessName.trim()) return;

    setLoading(true);
    try {
      // Create the organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: businessName.trim(),
          owner_id: user.id,
          slug: businessName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create the membership for the owner
      const { error: memberError } = await supabase
        .from('org_memberships')
        .insert({
          organization_id: orgData.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      // Create default business settings
      await supabase.from('business_settings').insert({
        organization_id: orgData.id,
        company_name: businessName.trim(),
      });

      toast.success('Business created successfully!');
      await refetch();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast.error(error.message || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Set Up Your Business</CardTitle>
          <CardDescription>
            Let's get your cleaning business set up. You can customize everything later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                type="text"
                placeholder="My Cleaning Company"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !businessName.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Business
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

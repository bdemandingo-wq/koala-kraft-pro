/**
 * CLIENT PORTAL AUTH CONTEXT
 * 
 * Manages client portal user authentication (username/password login for customers)
 * This is separate from the admin/staff auth system.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface ClientPortalUser {
  id: string;
  username: string;
  customer_id: string;
  organization_id: string | null;
  is_active: boolean;
  must_change_password: boolean;
}

interface CustomerInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

interface LoyaltyInfo {
  points: number;
  lifetime_points: number;
  tier: string;
}

interface ClientPortalContextType {
  user: ClientPortalUser | null;
  customer: CustomerInfo | null;
  loyalty: LoyaltyInfo | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  refreshData: () => Promise<void>;
}

const ClientPortalContext = createContext<ClientPortalContextType | undefined>(undefined);

const STORAGE_KEY = 'client_portal_session';

export function ClientPortalProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientPortalUser | null>(null);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setCustomer(parsed.customer);
        setLoyalty(parsed.loyalty);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const saveSession = (userData: ClientPortalUser, customerData: CustomerInfo, loyaltyData: LoyaltyInfo | null) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: userData,
      customer: customerData,
      loyalty: loyaltyData,
    }));
  };

  const signIn = async (username: string, password: string): Promise<{ error: string | null }> => {
    try {
      // Call the RPC function to validate credentials
      // Using type assertion since the function is dynamically created
      const { data, error } = await supabase.rpc('validate_client_portal_login' as any, {
        p_username: username.toLowerCase().trim(),
        p_password: password,
      });

      if (error) {
        console.error('Login error:', error);
        return { error: 'Invalid username or password' };
      }

      const result = data as { valid: boolean; reason?: string; user_id?: string } | null;
      
      if (!result || !result.valid) {
        return { error: 'Invalid username or password' };
      }

      // Get the full user record
      const { data: portalUser, error: userError } = await supabase
        .from('client_portal_users')
        .select('id, username, customer_id, organization_id, is_active, must_change_password')
        .eq('username', username.toLowerCase().trim())
        .single();

      if (userError || !portalUser) {
        return { error: 'Failed to load user data' };
      }

      if (!portalUser.is_active) {
        return { error: 'This account has been deactivated' };
      }

      // Get customer info
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone')
        .eq('id', portalUser.customer_id)
        .single();

      if (customerError || !customerData) {
        return { error: 'Failed to load customer data' };
      }

      // Get loyalty info
      const { data: loyaltyData } = await supabase
        .from('customer_loyalty')
        .select('points, lifetime_points, tier')
        .eq('customer_id', portalUser.customer_id)
        .maybeSingle();

      // Update last login
      await supabase
        .from('client_portal_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', portalUser.id);

      setUser(portalUser);
      setCustomer(customerData);
      setLoyalty(loyaltyData);
      saveSession(portalUser, customerData, loyaltyData);

      return { error: null };
    } catch (err: any) {
      console.error('Login error:', err);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = () => {
    setUser(null);
    setCustomer(null);
    setLoyalty(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const refreshData = async () => {
    if (!user) return;

    // Refresh customer info
    const { data: customerData } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone')
      .eq('id', user.customer_id)
      .single();

    // Refresh loyalty info
    const { data: loyaltyData } = await supabase
      .from('customer_loyalty')
      .select('points, lifetime_points, tier')
      .eq('customer_id', user.customer_id)
      .maybeSingle();

    if (customerData) {
      setCustomer(customerData);
      saveSession(user, customerData, loyaltyData);
    }
    if (loyaltyData) {
      setLoyalty(loyaltyData);
    }
  };

  return (
    <ClientPortalContext.Provider
      value={{
        user,
        customer,
        loyalty,
        loading,
        signIn,
        signOut,
        refreshData,
      }}
    >
      {children}
    </ClientPortalContext.Provider>
  );
}

export function useClientPortal() {
  const context = useContext(ClientPortalContext);
  if (context === undefined) {
    throw new Error('useClientPortal must be used within a ClientPortalProvider');
  }
  return context;
}

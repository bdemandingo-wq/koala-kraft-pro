/**
 * UNIFIED SUPABASE CLIENT
 * 
 * Session persistence is now ENABLED for better mobile app experience.
 * Users will stay logged in between app restarts.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Supabase client with session persistence enabled
 * - persistSession: true - Sessions ARE stored in localStorage
 * - autoRefreshToken: true - Tokens ARE auto-refreshed
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,   // Persist sessions for mobile app
    autoRefreshToken: true, // Auto-refresh tokens
    storage: localStorage,  // Use localStorage for persistence
    detectSessionInUrl: true,
  }
});

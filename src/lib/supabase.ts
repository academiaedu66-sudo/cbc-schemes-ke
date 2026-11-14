import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client for public reads (browser / client-side)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Admin client strictly for server-side API routes (avoids duplicate GoTrueClient in browser)
export const supabaseAdmin: SupabaseClient =
  typeof window === 'undefined'
    ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : supabase;

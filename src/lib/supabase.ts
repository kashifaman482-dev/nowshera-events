import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Error: VITE_SUPABASE_URL is missing from environment variables.');
}

if (!supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_ANON_KEY is missing from environment variables.');
}

// Default client with user session persistence and auth
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Dedicated unauthenticated client for public browsing (bypasses session-scoped RLS policy recursion on public queries)
export const supabasePublic = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});


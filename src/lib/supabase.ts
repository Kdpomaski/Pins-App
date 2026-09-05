import { Capacitor } from '@capacitor/core';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Native deep-link scheme for OAuth / magic-link return into Capacitor. */
export const NATIVE_AUTH_SCHEME = 'com.two20tech.pins';
export const NATIVE_AUTH_CALLBACK = `${NATIVE_AUTH_SCHEME}://auth/callback`;

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce',
    },
  },
);

/**
 * OAuth / email confirmation redirect.
 * Native: custom scheme so Safari/Chrome Custom Tab returns into the app.
 * Web: current origin callback route.
 */
export function getAuthRedirectUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return NATIVE_AUTH_CALLBACK;
  }
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${window.location.origin}${base}/auth/callback`;
}

import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

function readAuthParams() {
  const url = new URL(window.location.href);
  const query = url.searchParams;
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));

  return {
    code: query.get('code') ?? hash.get('code'),
    tokenHash: query.get('token_hash') ?? hash.get('token_hash'),
    type: (query.get('type') ?? hash.get('type')) as EmailOtpType | null,
    accessToken: hash.get('access_token'),
    error: query.get('error_description') ?? query.get('error') ?? hash.get('error_description') ?? hash.get('error'),
  };
}

export function hasAuthCallbackParams(): boolean {
  const { code, tokenHash, accessToken, error } = readAuthParams();
  return Boolean(code || tokenHash || accessToken || error);
}

export async function completeAuthFromUrl(): Promise<{ error?: string }> {
  const { code, tokenHash, type, error } = readAuthParams();

  if (error) {
    return { error: decodeURIComponent(error.replace(/\+/g, ' ')) };
  }

  const { data: existing, error: existingError } = await supabase.auth.getSession();
  if (existingError) return { error: existingError.message };
  if (existing.session) return {};

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) return { error: exchangeError.message };
  }

  if (tokenHash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (verifyError) return { error: verifyError.message };
  }

  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { error: sessionError.message };
  if (!data.session) {
    return { error: 'No session found. The confirmation link may have expired — try signing in.' };
  }

  return {};
}

export function clearAuthParamsFromUrl() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const home = base ? `${base}/` : '/';
  window.history.replaceState({}, document.title, home);
}
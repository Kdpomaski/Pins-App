import { getAuthRedirectUrl, supabase } from '@/lib/supabase';

const GOOGLE_CLIENT_SUFFIX = '.apps.googleusercontent.com';

export const GOOGLE_PROVIDER_DASHBOARD =
  'https://supabase.com/dashboard/project/ucijobfqdwkqhdqdffno/auth/providers';

export function googleClientIdLooksValid(clientId: string): boolean {
  const id = clientId.trim();
  return id.endsWith(GOOGLE_CLIENT_SUFFIX) && !id.includes(' ') && id !== GOOGLE_CLIENT_SUFFIX;
}

export function formatInvalidGoogleClientIdError(clientId: string): string {
  return (
    `Google is misconfigured in Supabase. Client ID is currently "${clientId || '(empty)'}" — ` +
    'it must be a Google Cloud Web client ending in .apps.googleusercontent.com. ' +
    `Open ${GOOGLE_PROVIDER_DASHBOARD} → Google, replace Pins.App with the real Client ID + Secret, Save. ` +
    'See GOOGLE-OAUTH.md. Email sign-in still works.'
  );
}

export async function inspectGoogleOAuthClientId(): Promise<{
  clientId: string;
  valid: boolean;
  url?: string;
  error?: string;
}> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthRedirectUrl(),
      skipBrowserRedirect: true,
      scopes: 'email profile',
      queryParams: { prompt: 'select_account' },
    },
  });

  if (error) return { clientId: '', valid: false, error: error.message };
  if (!data.url) return { clientId: '', valid: false, error: 'Google sign-in URL was not returned.' };

  let clientId = '';
  try {
    clientId = new URL(data.url).searchParams.get('client_id') ?? '';
  } catch {
    return { clientId: '', valid: false, error: 'Google sign-in URL was invalid.' };
  }

  return { clientId, valid: googleClientIdLooksValid(clientId), url: data.url };
}

export async function startGoogleSignIn(): Promise<{ error?: string }> {
  const inspected = await inspectGoogleOAuthClientId();
  if (inspected.error && !inspected.clientId) return { error: inspected.error };
  if (!inspected.valid) return { error: formatInvalidGoogleClientIdError(inspected.clientId) };
  if (!inspected.url) return { error: 'Google sign-in URL was not returned.' };

  window.location.assign(inspected.url);
  return {};
}

import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { completeAuthFromUrl, hasAuthCallbackParams } from '@/lib/auth-callback';
import { NATIVE_AUTH_SCHEME, getAuthRedirectUrl, supabase } from '@/lib/supabase';

let listenerReady = false;

/**
 * Listen for OAuth / magic-link returns into the native app.
 * Call once at app boot (AuthProvider).
 */
export function ensureNativeAuthDeepLinkListener(
  onComplete: (result: { error?: string }) => void,
): void {
  if (!Capacitor.isNativePlatform() || listenerReady) return;
  listenerReady = true;

  void App.addListener('appUrlOpen', async ({ url }) => {
    if (!url?.startsWith(`${NATIVE_AUTH_SCHEME}:`)) return;
    try {
      await Browser.close();
    } catch {
      /* browser may already be closed */
    }
    if (!hasAuthCallbackParams(url)) {
      onComplete({ error: 'Sign-in returned without auth params.' });
      return;
    }
    const result = await completeAuthFromUrl(url);
    onComplete(result);
  });
}

/** Open Google OAuth in system browser / SFSafariViewController, return via deep link. */
export async function startGoogleOAuth(): Promise<{ error?: string }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthRedirectUrl(),
      skipBrowserRedirect: true,
      scopes: 'email profile',
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) return { error: error.message };
  if (!data.url) return { error: 'Google sign-in URL was not returned.' };

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: data.url, presentationStyle: 'popover' });
    return {};
  }

  window.location.assign(data.url);
  return {};
}

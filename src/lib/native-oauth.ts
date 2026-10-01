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

type SocialProvider = 'google' | 'apple';

function oauthOptions(provider: SocialProvider) {
  const redirectTo = getAuthRedirectUrl();
  if (provider === 'google') {
    return {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: 'email profile',
      queryParams: { prompt: 'select_account' },
    };
  }
  // Apple provider is configured in Supabase (Services ID com.two20tech.pins.siwa).
  // name + email is the 4.8-equivalent scope and allows Hide My Email. No .p8 in the app.
  return {
    redirectTo,
    skipBrowserRedirect: true,
    scopes: 'name email',
  };
}

/**
 * Open Supabase OAuth in the system browser and return via the native deep link
 * (or same-origin redirect on web). Shared by Google and Sign in with Apple.
 */
async function startSocialOAuth(provider: SocialProvider): Promise<{ error?: string }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: oauthOptions(provider),
  });
  if (error) return { error: error.message };
  if (!data.url) return { error: 'Sign-in URL was not returned.' };

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: data.url, presentationStyle: 'popover' });
    return {};
  }

  window.location.assign(data.url);
  return {};
}

/** Open Google OAuth in system browser / SFSafariViewController, return via deep link. */
export function startGoogleOAuth(): Promise<{ error?: string }> {
  return startSocialOAuth('google');
}

/** Sign in with Apple via the existing Supabase Apple provider and the same deep link. */
export function startAppleOAuth(): Promise<{ error?: string }> {
  return startSocialOAuth('apple');
}

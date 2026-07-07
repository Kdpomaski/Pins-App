/** Pins privacy posture — local-first health data, minimal beta auth profile. */

export const PRIVACY = {
  localFirst: true,
  telemetry: false,
  analytics: false,
  externalApis: true,
  dataLeavesDevice: 'minimal',
} as const;

const ALLOWED_FETCH_HOSTS = [
  'supabase.co',
  'google.com',
  'googleapis.com',
  'gstatic.com',
];

function isAllowedExternalUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return ALLOWED_FETCH_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

/** Warn on unexpected third-party network calls in dev. */
export function assertNoTelemetry() {
  if (!import.meta.env.DEV) return;

  const originalFetch = window.fetch;
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith('http') && !url.startsWith(window.location.origin) && !isAllowedExternalUrl(url)) {
      console.warn('[Pins Privacy] Unexpected external fetch:', url);
    }
    return originalFetch(input, init);
  }) as typeof fetch;
}
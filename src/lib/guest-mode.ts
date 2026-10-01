const GUEST_MODE_KEY = 'pins.guestMode';

/** Local tracker session with no Supabase account. Survives app restarts. */
export function readGuestMode(): boolean {
  try {
    return localStorage.getItem(GUEST_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeGuestMode(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(GUEST_MODE_KEY, '1');
    else localStorage.removeItem(GUEST_MODE_KEY);
  } catch {
    /* private mode / quota */
  }
}

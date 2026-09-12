const KEY = 'pins.shotDueNotifications.enabled';

/** Default ON — OS permission is requested when enabling / first sync. */
export function getShotDueNotificationsEnabled(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw == null) return true;
    return raw === '1' || raw === 'true';
  } catch {
    return true;
  }
}

export function setShotDueNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(KEY, enabled ? '1' : '0');
  } catch {
    /* ignore quota / private mode */
  }
}

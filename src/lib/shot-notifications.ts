import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { addDays, format, isSameDay, setHours, setMinutes, startOfDay } from 'date-fns';
import type { InjectionLog, ScheduledDose } from '@/lib/store';
import { getShotDueNotificationsEnabled } from '@/lib/notification-prefs';

const CHANNEL_ID = 'shot-due';
const HORIZON_DAYS = 14;
const ID_PREFIX = 'pins-shot';

export type ShotNotificationCopy = {
  title: string;
  body: (compound: string, dose: number, unit: string) => string;
};

export const PINS_SHOT_COPY: ShotNotificationCopy = {
  title: 'Time to take the pin',
  body: (compound, dose, unit) => `${compound} · ${dose} ${unit}`,
};

function stableNotificationId(scheduleId: string, ymd: string): number {
  const s = `${ID_PREFIX}:${scheduleId}:${ymd}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2147483646 || 1;
}

function applyTime(day: Date, time: string): Date {
  const [hh, mm] = time.split(':').map((n) => Number(n) || 0);
  return setMinutes(setHours(startOfDay(day), hh), mm);
}

export function upcomingOccurrences(
  dose: ScheduledDose,
  from: Date = new Date(),
  horizonDays = HORIZON_DAYS,
): Date[] {
  if (!dose.active || dose.deletedAt || !dose.days?.length) return [];
  const out: Date[] = [];
  const start = startOfDay(from);
  for (let i = 0; i <= horizonDays; i++) {
    const day = addDays(start, i);
    if (!dose.days.includes(day.getDay())) continue;
    if (!dose.time) continue;
    const at = applyTime(day, dose.time);
    if (at.getTime() <= from.getTime()) continue;
    out.push(at);
  }
  return out;
}

async function ensureChannel(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Shot reminders',
      description: 'Alerts when a scheduled pin is due',
      importance: 5,
      visibility: 1,
      sound: 'default',
    });
  } catch {
    /* channel may already exist */
  }
}

export async function requestShotNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === 'granted') return true;
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === 'granted';
  } catch {
    return false;
  }
}

export async function cancelAllShotNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const pending = await LocalNotifications.getPending();
    const ours = (pending.notifications ?? []).filter((n) =>
      String(n.extra?.kind ?? '') === 'shot-due',
    );
    if (ours.length === 0) {
      // Fallback: cancel everything we might have scheduled if extras missing on platform.
      const all = pending.notifications ?? [];
      if (all.length) await LocalNotifications.cancel({ notifications: all.map((n) => ({ id: n.id })) });
      return;
    }
    await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
  } catch {
    /* ignore */
  }
}

export async function cancelShotNotificationsForCompoundOnDay(
  schedule: ScheduledDose[],
  compound: string,
  day: Date = new Date(),
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const ymd = format(day, 'yyyy-MM-dd');
  const ids = schedule
    .filter((s) => s.compound === compound && !s.deletedAt)
    .map((s) => ({ id: stableNotificationId(s.id, ymd) }));
  if (!ids.length) return;
  try {
    await LocalNotifications.cancel({ notifications: ids });
  } catch {
    /* ignore */
  }
}

export async function rescheduleShotDueNotifications(options: {
  schedule: ScheduledDose[];
  logs: InjectionLog[];
  copy?: ShotNotificationCopy;
  enabled?: boolean;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const enabled = options.enabled ?? getShotDueNotificationsEnabled();
  if (!enabled) {
    await cancelAllShotNotifications();
    return;
  }

  const granted = await requestShotNotificationPermission();
  if (!granted) {
    await cancelAllShotNotifications();
    return;
  }

  await ensureChannel();
  await cancelAllShotNotifications();

  const copy = options.copy ?? PINS_SHOT_COPY;
  const now = new Date();
  const notifications: {
    id: number;
    title: string;
    body: string;
    schedule: { at: Date; allowWhileIdle: boolean };
    channelId?: string;
    extra: Record<string, string>;
  }[] = [];

  for (const dose of options.schedule) {
    if (!dose.active || dose.deletedAt) continue;
    for (const at of upcomingOccurrences(dose, now)) {
      const taken = options.logs.some(
        (log) =>
          !log.deletedAt &&
          log.compound === dose.compound &&
          isSameDay(new Date(log.timestamp), at),
      );
      if (taken) continue;

      const ymd = format(at, 'yyyy-MM-dd');
      notifications.push({
        id: stableNotificationId(dose.id, ymd),
        title: copy.title,
        body: copy.body(dose.compound, dose.dose, dose.unit),
        schedule: { at, allowWhileIdle: true },
        channelId: Capacitor.getPlatform() === 'android' ? CHANNEL_ID : undefined,
        extra: {
          kind: 'shot-due',
          scheduleId: dose.id,
          compound: dose.compound,
          ymd,
        },
      });
    }
  }

  if (!notifications.length) return;

  // Avoid exact-alarm permission prompt; inexact is fine for dose reminders.
  await LocalNotifications.schedule({
    notifications: notifications.map((n) => ({
      ...n,
      isExactNotification: false,
    })),
  });
}

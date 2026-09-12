import { useEffect, useRef } from 'react';
import { usePinsStore } from '@/lib/store';
import {
  cancelShotNotificationsForCompoundOnDay,
  rescheduleShotDueNotifications,
} from '@/lib/shot-notifications';
import { getShotDueNotificationsEnabled } from '@/lib/notification-prefs';

/** Keeps native local notifications aligned with calendar schedule + taken logs. */
export function ShotDueNotificationsSync() {
  const { data } = usePinsStore();
  const prevLogIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    void rescheduleShotDueNotifications({
      schedule: data.schedule,
      logs: data.logs,
      enabled: getShotDueNotificationsEnabled(),
    });
  }, [data.schedule, data.logs]);

  // When a new log is added, cancel today's reminder for that compound immediately.
  useEffect(() => {
    const current = new Set(data.logs.filter((l) => !l.deletedAt).map((l) => l.id));
    const added = data.logs.filter((l) => !l.deletedAt && !prevLogIds.current.has(l.id));
    prevLogIds.current = current;
    for (const log of added) {
      void cancelShotNotificationsForCompoundOnDay(data.schedule, log.compound, new Date(log.timestamp));
    }
  }, [data.logs, data.schedule]);

  return null;
}

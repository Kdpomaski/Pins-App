export const PERIOD_TIMES = {
  AM: '08:00',
  PM: '20:00',
};

const HHMM = /^(\d{2}):(\d{2})$/;

export function isHhmm(time) {
  return Boolean(time && HHMM.test(time));
}

export function periodFromHour(hour) {
  return hour < 12 ? 'AM' : 'PM';
}

export function periodFromTime(time) {
  if (!isHhmm(time)) return null;
  return periodFromHour(Number(time.slice(0, 2)));
}

export function timeFromPeriod(period) {
  return PERIOD_TIMES[period];
}

export function resolveInventoryDoseTime(item) {
  if (isHhmm(item?.doseTime)) return item.doseTime;
  if (item?.dosePeriod === 'AM' || item?.dosePeriod === 'PM') return timeFromPeriod(item.dosePeriod);
  return undefined;
}

export function periodFromTimestamp(iso) {
  return periodFromHour(new Date(iso).getHours());
}

export function hhmmFromTimestamp(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function loggedPeriodDiffersFromSchedule(scheduleTime, logIso) {
  const scheduled = periodFromTime(scheduleTime);
  if (!scheduled) return false;
  return scheduled !== periodFromTimestamp(logIso);
}

export function formatDoseTimeLabel(time) {
  if (!isHhmm(time)) return null;
  const hh = Number(time.slice(0, 2));
  const mm = time.slice(3, 5);
  const period = periodFromHour(hh);
  const hour12 = hh % 12 || 12;
  return `${hour12}:${mm} ${period}`;
}

export function plusTwelveHours(time) {
  if (!isHhmm(time)) return time;
  const hh = (Number(time.slice(0, 2)) + 12) % 24;
  return `${String(hh).padStart(2, '0')}:${time.slice(3, 5)}`;
}

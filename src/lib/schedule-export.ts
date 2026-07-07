import {
  addDays,
  addMonths,
  addWeeks,
  differenceInDays,
  format,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns';
import type { InjectionLog, InventoryItem, PinsData } from '@/lib/store';

export type ExportFormat = 'calendar' | 'text';

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function applyTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  return setMinutes(setHours(startOfDay(date), h || 8), m || 0);
}

function doseInInventoryUnits(
  dose: number,
  doseUnit: 'mg' | 'mcg',
  itemUnit: 'mg' | 'mcg',
): number {
  if (itemUnit === doseUnit) return dose;
  if (itemUnit === 'mg' && doseUnit === 'mcg') return dose / 1000;
  return dose * 1000;
}

export function remainingDoses(
  item: InventoryItem,
  dose: number,
  unit: 'mg' | 'mcg',
): number {
  if (!dose || dose <= 0) return 0;
  const perDose = doseInInventoryUnits(dose, unit, item.unit);
  const total = item.remainingVolume * item.concentration;
  return Math.max(0, Math.floor(total / perDose));
}

function defaultWeekdays(frequency: string): number[] {
  const f = frequency.toLowerCase();
  if (f.includes('3x/week')) return [1, 3, 5];
  if (f.includes('2x/week')) return [1, 4];
  if (f === 'weekly' || f === 'bi-weekly' || f === 'monthly') return [1];
  return [0, 1, 2, 3, 4, 5, 6];
}

function generateDoseDates(
  count: number,
  frequency: string,
  start: Date,
  time: string,
  weekdays: number[],
): Date[] {
  const results: Date[] = [];
  const freq = frequency.toLowerCase();

  if (freq === 'daily') {
    for (let i = 0; i < count; i++) results.push(applyTime(addDays(start, i), time));
    return results;
  }

  if (freq === '2x/day') {
    for (let i = 0; results.length < count; i++) {
      const day = addDays(start, Math.floor(i / 2));
      results.push(applyTime(day, i % 2 === 0 ? '08:00' : '20:00'));
    }
    return results;
  }

  if (freq === 'every other day') {
    for (let i = 0; i < count; i++) results.push(applyTime(addDays(start, i * 2), time));
    return results;
  }

  if (freq === 'monthly') {
    for (let i = 0; i < count; i++) results.push(applyTime(addMonths(start, i), time));
    return results;
  }

  if (freq === 'bi-weekly') {
    for (let i = 0; i < count; i++) {
      const weekStart = addWeeks(start, i * 2);
      const targetDay = weekdays[0] ?? 1;
      const offset = (targetDay - weekStart.getDay() + 7) % 7;
      results.push(applyTime(addDays(weekStart, offset), time));
    }
    return results;
  }

  let cursor = start;
  const maxDays = count * 21;
  while (results.length < count && differenceInDays(cursor, start) <= maxDays) {
    if (weekdays.includes(cursor.getDay())) {
      results.push(applyTime(cursor, time));
    }
    cursor = addDays(cursor, 1);
  }

  return results;
}

type PlannedDose = { at: Date; compound: string; dose: number; unit: 'mg' | 'mcg' };

export function buildFutureDoses(
  compounds: string[],
  data: PinsData,
  start = startOfDay(new Date()),
): PlannedDose[] {
  const planned: PlannedDose[] = [];

  for (const compound of compounds) {
    const item = data.inventory.find((i) => i.name === compound);
    if (!item) continue;

    const schedule = data.schedule.find((s) => s.compound === compound && s.active);
    const dose = schedule?.dose ?? item.defaultDose ?? 0;
    const unit = schedule?.unit ?? item.unit;
    const time = schedule?.time ?? '08:00';
    const frequency = item.frequency ?? 'Weekly';
    const weekdays = schedule?.days?.length ? schedule.days : defaultWeekdays(frequency);

    const total = remainingDoses(item, dose, unit);
    if (!total || !dose) continue;

    const dates = generateDoseDates(total, frequency, start, time, weekdays);
    dates.forEach((at) => planned.push({ at, compound, dose, unit }));
  }

  return planned.sort((a, b) => a.at.getTime() - b.at.getTime());
}

function icsDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss");
}

export function buildIcsCalendar(compounds: string[], data: PinsData): string {
  const doses = buildFutureDoses(compounds, data);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pins App//Schedule Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  doses.forEach((dose, index) => {
    const end = new Date(dose.at.getTime() + 15 * 60 * 1000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:pins-${dose.compound.replace(/\s/g, '')}-${index}-${dose.at.getTime()}@pins.app`,
      `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(dose.at)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${dose.compound} - ${dose.dose} ${dose.unit}`,
      `DESCRIPTION:Scheduled dose of ${dose.compound} (${dose.dose} ${dose.unit}). Import into Google or Apple Calendar.`,
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function buildAdministrationText(compounds: string[], data: PinsData): string {
  const logs = data.logs
    .filter((l) => compounds.includes(l.compound))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const header = [
    'PINS — Administration Log',
    `Exported: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
    `Compounds: ${compounds.join(', ')}`,
    '',
  ];

  if (logs.length === 0) {
    return [...header, 'No administrations recorded for selected compounds.'].join('\n');
  }

  const body = logs.map((log: InjectionLog) => {
    const when = format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm');
    const site = log.siteId.replace(/-/g, ' ');
    return `${when} | ${log.compound} | ${log.dose} ${log.unit} | Site: ${site}${log.notes ? ` | Notes: ${log.notes}` : ''}`;
  });

  return [...header, ...body].join('\n');
}

export function exportSchedule(
  formatType: ExportFormat,
  compounds: string[],
  data: PinsData,
) {
  if (compounds.length === 0) return;

  const stamp = format(new Date(), 'yyyy-MM-dd');

  if (formatType === 'calendar') {
    downloadBlob(buildIcsCalendar(compounds, data), `pins-schedule-${stamp}.ics`, 'text/calendar;charset=utf-8');
    return;
  }

  downloadBlob(buildAdministrationText(compounds, data), `pins-admin-log-${stamp}.txt`, 'text/plain;charset=utf-8');
}

export function allCompoundNames(data: PinsData): string[] {
  const names = new Set<string>();
  data.inventory.forEach((i) => names.add(i.name));
  data.schedule.forEach((s) => names.add(s.compound));
  data.logs.forEach((l) => names.add(l.compound));
  return Array.from(names).sort();
}
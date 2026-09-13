import { resolveInventoryDoseTime, type DosePeriod } from '@/lib/dose-time';
import { defaultWeekdays } from '@/lib/schedule-export';
import type { InventoryItem, ScheduledDose } from '@/lib/store';

/** Upsert / deactivate calendar schedule rows when inventory protocol changes. */
export function syncScheduleWithInventory(
  schedule: ScheduledDose[],
  inventory: InventoryItem[],
): ScheduledDose[] {
  const now = new Date().toISOString();
  const byCompound = new Map<string, InventoryItem>();
  for (const item of inventory) {
    if (item.deletedAt) continue;
    const existing = byCompound.get(item.name);
    if (!existing) {
      byCompound.set(item.name, item);
      continue;
    }
    // Prefer the vial that has protocol fields filled in.
    if ((item.frequency || item.defaultDose != null) && !existing.frequency && existing.defaultDose == null) {
      byCompound.set(item.name, item);
    }
  }

  const next = [...schedule];
  const seen = new Set<string>();

  for (const [compound, item] of byCompound) {
    const freq = item.frequency?.trim();
    const dose = item.defaultDose;
    if (!freq || dose == null || dose <= 0) continue;
    if (freq.toLowerCase() === 'as needed') continue;

    const time = resolveInventoryDoseTime(item);
    const idx = next.findIndex((s) => s.compound === compound && !s.deletedAt);

    if (idx >= 0) {
      seen.add(compound);
      const prev = next[idx];
      next[idx] = {
        ...prev,
        dose,
        unit: item.unit,
        days: defaultWeekdays(freq),
        time: time || prev.time,
        active: true,
        deletedAt: null,
        updatedAt: now,
      };
      continue;
    }

    // New schedule rows only when the user picked AM/PM (or an explicit time).
    if (!time) continue;

    seen.add(compound);
    next.push({
      id: crypto.randomUUID(),
      compound,
      dose,
      unit: item.unit,
      time,
      days: defaultWeekdays(freq),
      active: true,
      updatedAt: now,
      deletedAt: null,
    });
  }

  return next.map((s) => {
    if (s.deletedAt) return s;
    if (seen.has(s.compound)) return s;
    // Compound still in inventory but protocol cleared → deactivate (keep history).
    if (byCompound.has(s.compound) && s.active) {
      return { ...s, active: false, updatedAt: now };
    }
    return s;
  });
}

export function applyFutureShotTime(
  schedule: ScheduledDose[],
  inventory: InventoryItem[],
  compound: string,
  time: string,
  period: DosePeriod,
  now = new Date().toISOString(),
): { schedule: ScheduledDose[]; inventory: InventoryItem[] } {
  return {
    schedule: schedule.map((dose) =>
      dose.compound === compound && !dose.deletedAt
        ? { ...dose, time, active: true, updatedAt: now }
        : dose,
    ),
    inventory: inventory.map((item) =>
      item.name === compound && !item.deletedAt
        ? { ...item, doseTime: time, dosePeriod: period, updatedAt: now }
        : item,
    ),
  };
}

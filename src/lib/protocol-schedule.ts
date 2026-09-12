import { defaultWeekdays } from '@/lib/schedule-export';
import type { InventoryItem, ScheduledDose } from '@/lib/store';

const DEFAULT_TIME = '08:00';

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

    seen.add(compound);
    const days = defaultWeekdays(freq);
    const idx = next.findIndex((s) => s.compound === compound && !s.deletedAt);
    if (idx >= 0) {
      const prev = next[idx];
      next[idx] = {
        ...prev,
        dose,
        unit: item.unit,
        days,
        time: prev.time || DEFAULT_TIME,
        active: true,
        deletedAt: null,
        updatedAt: now,
      };
    } else {
      next.push({
        id: crypto.randomUUID(),
        compound,
        dose,
        unit: item.unit,
        time: DEFAULT_TIME,
        days,
        active: true,
        updatedAt: now,
        deletedAt: null,
      });
    }
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

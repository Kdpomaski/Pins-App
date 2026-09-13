import { resolveInventoryDoseTime } from './dose-time.mjs';

function defaultWeekdays(frequency) {
  const f = frequency.toLowerCase();
  if (f.includes('3x/week')) return [1, 3, 5];
  if (f.includes('2x/week')) return [1, 4];
  if (f === 'weekly' || f === 'bi-weekly' || f === 'monthly') return [1];
  return [0, 1, 2, 3, 4, 5, 6];
}

export function syncScheduleWithInventory(schedule, inventory, randomId = () => 'new-id') {
  const now = '2026-09-12T12:00:00.000Z';
  const byCompound = new Map();
  for (const item of inventory) {
    if (item.deletedAt) continue;
    const existing = byCompound.get(item.name);
    if (!existing) {
      byCompound.set(item.name, item);
      continue;
    }
    if ((item.frequency || item.defaultDose != null) && !existing.frequency && existing.defaultDose == null) {
      byCompound.set(item.name, item);
    }
  }

  const next = [...schedule];
  const seen = new Set();

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

    if (!time) continue;

    seen.add(compound);
    next.push({
      id: randomId(),
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
    if (byCompound.has(s.compound) && s.active) {
      return { ...s, active: false, updatedAt: now };
    }
    return s;
  });
}

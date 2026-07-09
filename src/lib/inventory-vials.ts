import type { InventoryItem } from '@/lib/store';

export const DEPLETED_THRESHOLD_ML = 0.001;

export function isVialActive(item: InventoryItem): boolean {
  return item.remainingVolume > DEPLETED_THRESHOLD_ML;
}

/** Active vials first; FIFO by reconstitution date (unreconstituted vials queue last). */
export function sortVialsForCompound(vials: InventoryItem[]): InventoryItem[] {
  return [...vials].sort((a, b) => {
    const aActive = isVialActive(a);
    const bActive = isVialActive(b);
    if (aActive !== bActive) return aActive ? -1 : 1;

    const aDate = a.reconstitutedAt ? new Date(a.reconstitutedAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.reconstitutedAt ? new Date(b.reconstitutedAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aDate - bDate;
  });
}

export function removeDepletedVials(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter(isVialActive);
}

export function deductVolumeFromCompound(
  inventory: InventoryItem[],
  compound: string,
  dose: number,
  doseUnit: 'mg' | 'mcg',
  now: string,
): InventoryItem[] {
  const compoundVials = sortVialsForCompound(inventory.filter((v) => v.name === compound));
  const target = compoundVials.find(isVialActive);
  if (!target) return inventory;

  let doseInVialUnits = dose;
  if (target.unit === 'mg' && doseUnit === 'mcg') doseInVialUnits = dose / 1000;
  if (target.unit === 'mcg' && doseUnit === 'mg') doseInVialUnits = dose * 1000;

  const volumeUsed = doseInVialUnits / target.concentration;

  const updated = inventory.map((item) => {
    if (item.id !== target.id) return item;
    return {
      ...item,
      remainingVolume: Math.max(0, item.remainingVolume - volumeUsed),
      updatedAt: now,
    };
  });

  return removeDepletedVials(updated);
}

export function scheduleForRemainingInventory(
  schedule: { compound: string }[],
  inventory: InventoryItem[],
) {
  const compounds = new Set(inventory.map((v) => v.name));
  return schedule.filter((dose) => compounds.has(dose.compound));
}
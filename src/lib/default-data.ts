import type { InventoryItem, PinsData } from '@/lib/store';

/** Fresh installs start empty — no EXAMPLE / demo peptide catalog. */
export const DEFAULT_DATA: PinsData = {
  logs: [],
  inventory: [],
  schedule: [],
};

/** Seed vial shipped in earlier builds (name EXAMPLE, unused). */
export function isSeedExampleItem(item: InventoryItem): boolean {
  return (
    item.name === 'EXAMPLE' &&
    item.concentration === 10 &&
    item.totalVolume === 2 &&
    item.unit === 'mg' &&
    item.color.toLowerCase() === '#94a3b8'
  );
}

/** Drop unused EXAMPLE seed vials so existing installs match empty inventory. */
export function stripSeedExampleInventory(data: PinsData): PinsData {
  const hasExampleLogs = data.logs.some((log) => log.compound === 'EXAMPLE' && !log.deletedAt);
  if (hasExampleLogs) return data;

  const inventory = data.inventory.filter((item) => !isSeedExampleItem(item));
  if (inventory.length === data.inventory.length) return data;

  const compounds = new Set(inventory.map((item) => item.name));
  return {
    ...data,
    inventory,
    schedule: data.schedule.filter((dose) => compounds.has(dose.compound)),
  };
}

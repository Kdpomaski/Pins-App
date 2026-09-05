import type { PinsData } from '@/lib/store';

/** Fresh installs: one labeled EXAMPLE vial only — no demo peptide catalog. */
export const DEFAULT_DATA: PinsData = {
  logs: [],
  inventory: [
    {
      id: crypto.randomUUID(),
      name: 'EXAMPLE',
      concentration: 10,
      totalVolume: 2,
      remainingVolume: 2,
      unit: 'mg',
      color: '#94a3b8',
      updatedAt: new Date().toISOString(),
    },
  ],
  schedule: [],
};

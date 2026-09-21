import { concentrationFromRecon, convertDoseUnits, type DoseUnit } from '@/lib/dose-volume';

export type BlendAmountUnit = 'mg' | 'mcg' | '%';

export type BlendComponent = {
  name: string;
  amount: number;
  unit: BlendAmountUnit;
};

export function formatBlendBreakdown(components: BlendComponent[] | undefined): string {
  if (!components?.length) return '';
  return components.map((c) => `${c.name} ${c.amount}${c.unit}`).join(' + ');
}

export function formatBlendRecord(
  name: string,
  components: BlendComponent[] | undefined,
): string {
  const breakdown = formatBlendBreakdown(components);
  return breakdown ? `${name} (${breakdown})` : name;
}

export function resolveBlendComponents(
  record: { compound: string; blendComponents?: BlendComponent[] },
  inventory: { name: string; isBlend?: boolean; blendComponents?: BlendComponent[] }[],
): BlendComponent[] | undefined {
  if (record.blendComponents?.length) return record.blendComponents;
  const item = inventory.find((i) => i.name === record.compound);
  if (item?.isBlend && item.blendComponents?.length) return item.blendComponents;
  return undefined;
}

export function parseBlendComponents(
  drafts: { name: string; amount: string; unit: BlendAmountUnit }[],
): { ok: true; components: BlendComponent[] } | { ok: false; error: string } {
  const components: BlendComponent[] = [];
  for (const row of drafts) {
    const name = row.name.trim();
    const amount = Number(row.amount);
    if (!name && !row.amount.trim()) continue;
    if (!name) return { ok: false, error: 'Each blend component needs a name.' };
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: 'Each blend component needs a positive amount (mg, mcg, or %).' };
    }
    components.push({ name, amount, unit: row.unit });
  }
  if (components.length < 2) {
    return { ok: false, error: 'A blend needs at least two components.' };
  }
  return { ok: true, components };
}

/**
 * Sum blend component peptide mass into the vial's unit.
 * Returns null when any component uses % (not convertible to mass) or none are mass.
 */
export function blendTotalMass(
  components: BlendComponent[] | undefined,
  targetUnit: DoseUnit,
): number | null {
  if (!components?.length) return null;
  let total = 0;
  let sawMass = false;
  for (const c of components) {
    if (c.unit === '%') return null;
    const converted = convertDoseUnits(c.amount, c.unit, targetUnit);
    if (converted == null) return null;
    total += converted;
    sawMass = true;
  }
  if (!sawMass || !Number.isFinite(total) || total <= 0) return null;
  return total;
}

export type ConcentrationSource = {
  concentration?: number | null;
  totalVolume?: number | null;
  unit: DoseUnit;
  isBlend?: boolean;
  blendComponents?: BlendComponent[];
};

/**
 * Effective mg/ml (or mcg/ml) for dose math.
 * Blends with mass components: sum(components) / totalVolume (recon path) —
 * fixes KLOW-style vials where the Concentration field was filled with vial total mg.
 * Otherwise: stored concentration (already mg/ml).
 */
export function resolveInventoryConcentration(item: ConcentrationSource): number | null {
  const volume = item.totalVolume;
  if (item.isBlend && volume != null && volume > 0) {
    const vialAmount = blendTotalMass(item.blendComponents, item.unit);
    if (vialAmount != null) {
      return concentrationFromRecon(vialAmount, volume);
    }
  }
  const conc = item.concentration;
  if (conc == null || !Number.isFinite(conc) || conc <= 0) return null;
  return conc;
}

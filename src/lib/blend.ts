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

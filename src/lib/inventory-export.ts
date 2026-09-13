import { format } from 'date-fns';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { formatBlendBreakdown } from '@/lib/blend';
import type { InventoryItem } from '@/lib/store';

export type InventoryExportFormat = 'csv' | 'text';

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Write + share via Capacitor on native; anchor download on web. */
async function deliverExport(content: string, filename: string, mime: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    downloadBlob(content, filename, mime);
    return;
  }

  const written = await Filesystem.writeFile({
    path: filename,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
    recursive: true,
  });

  await Share.share({
    title: filename,
    text: filename,
    url: written.uri,
    dialogTitle: 'Export inventory',
  });
}

function csvEscape(value: string | number | boolean | undefined | null): string {
  if (value == null) return '';
  const raw = String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function activeInventory(items: InventoryItem[]): InventoryItem[] {
  return items.filter((item) => !item.deletedAt);
}

export function buildInventoryCsv(items: InventoryItem[]): string {
  const rows = activeInventory(items);
  const header = [
    'name',
    'concentration',
    'unit',
    'total_volume_ml',
    'remaining_volume_ml',
    'frequency',
    'default_dose',
    'dose_period',
    'dose_time',
    'lot_number',
    'reconstituted_at',
    'is_blend',
    'blend_components',
    'color',
    'id',
  ];

  const body = rows.map((item) =>
    [
      csvEscape(item.name),
      csvEscape(item.concentration),
      csvEscape(item.unit),
      csvEscape(item.totalVolume),
      csvEscape(item.remainingVolume),
      csvEscape(item.frequency ?? ''),
      csvEscape(item.defaultDose ?? ''),
      csvEscape(item.dosePeriod ?? ''),
      csvEscape(item.doseTime ?? ''),
      csvEscape(item.lotNumber ?? ''),
      csvEscape(item.reconstitutedAt ?? ''),
      csvEscape(item.isBlend ? 'yes' : 'no'),
      csvEscape(formatBlendBreakdown(item.blendComponents)),
      csvEscape(item.color),
      csvEscape(item.id),
    ].join(','),
  );

  return [header.join(','), ...body].join('\n');
}

export function buildInventoryText(items: InventoryItem[]): string {
  const rows = activeInventory(items);
  const header = [
    'PINS — Inventory Export',
    `Exported: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
    `Items: ${rows.length}`,
    '',
  ];

  if (rows.length === 0) {
    return [...header, 'No inventory items to export.'].join('\n');
  }

  const body = rows.map((item, index) => {
    const blend = formatBlendBreakdown(item.blendComponents);
    const lines = [
      `${index + 1}. ${item.name}${item.isBlend ? ' [blend]' : ''}`,
      `   Conc: ${item.concentration} ${item.unit}/ml`,
      `   Volume: ${item.remainingVolume} / ${item.totalVolume} ml`,
    ];
    if (item.frequency) lines.push(`   Frequency: ${item.frequency}`);
    if (item.defaultDose != null) lines.push(`   Default dose: ${item.defaultDose} ${item.unit}`);
    if (item.dosePeriod || item.doseTime) {
      lines.push(`   Time of day: ${item.dosePeriod ?? item.doseTime}`);
    }
    if (item.lotNumber) lines.push(`   Lot: ${item.lotNumber}`);
    if (item.reconstitutedAt) {
      lines.push(`   Reconstituted: ${format(new Date(item.reconstitutedAt), 'yyyy-MM-dd')}`);
    } else {
      lines.push('   Reconstituted: not yet');
    }
    if (blend) lines.push(`   Blend: ${blend}`);
    return lines.join('\n');
  });

  return [...header, ...body].join('\n');
}

export async function exportInventory(
  formatType: InventoryExportFormat,
  items: InventoryItem[],
): Promise<void> {
  const rows = activeInventory(items);
  const stamp = format(new Date(), 'yyyy-MM-dd');

  if (formatType === 'csv') {
    await deliverExport(
      buildInventoryCsv(rows),
      `pins-inventory-${stamp}.csv`,
      'text/csv;charset=utf-8',
    );
    return;
  }

  await deliverExport(
    buildInventoryText(rows),
    `pins-inventory-${stamp}.txt`,
    'text/plain;charset=utf-8',
  );
}

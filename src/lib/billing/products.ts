/**
 * Pins Pro product catalog stubs + Free vs Pro matrix helpers.
 *
 * Source: /workspace/bus/decisions/2026-09-03-app-monetization.md
 *
 * DO NOT create these SKUs in App Store Connect or Google Play Console
 * until Kevin approves the money gate. Display prices are UI stubs only.
 */

export type ProductPeriod = 'monthly' | 'yearly' | 'lifetime';

export type ProductStub = {
  id: string;
  period: ProductPeriod;
  /** Display price string for UI stubs (not live store pricing). */
  displayPrice: string;
  /** USD numeric hint for docs / UI only. */
  priceUsd: number | null;
  /** Highlight as the primary offer. */
  primary?: boolean;
  /** TestFlight founding / early-supporter offer. */
  founding?: boolean;
  /** Hide from plan picker until Kevin locks display price. */
  hidden?: boolean;
  label: string;
  /** pins = single-app; bundle = Pins + Pets shared entitlement. */
  scope: 'pins' | 'bundle';
};

/** Locked Pins single-app product IDs. */
export const PINS_PRODUCT_IDS = {
  monthly: 'com.two20tech.pins.pro.monthly',
  yearly: 'com.two20tech.pins.pro.yearly',
  lifetime: 'com.two20tech.pins.pro.lifetime',
} as const;

/** Locked cross-app bundle product IDs (shared Pins + Pets Pro). */
export const BUNDLE_PRODUCT_IDS = {
  monthly: 'com.two20tech.bundle.pro.monthly',
  yearly: 'com.two20tech.bundle.pro.yearly',
  lifetime: 'com.two20tech.bundle.pro.lifetime',
} as const;

export const PINS_PRODUCTS: ProductStub[] = [
  {
    id: PINS_PRODUCT_IDS.monthly,
    period: 'monthly',
    displayPrice: '$4.99/mo',
    priceUsd: 4.99,
    label: 'Monthly',
    scope: 'pins',
  },
  {
    id: PINS_PRODUCT_IDS.yearly,
    period: 'yearly',
    displayPrice: '$49.99/yr',
    priceUsd: 49.99,
    primary: true,
    label: 'Annual',
    scope: 'pins',
  },
  {
    id: PINS_PRODUCT_IDS.lifetime,
    period: 'lifetime',
    displayPrice: '$99',
    priceUsd: 99,
    label: 'Lifetime',
    scope: 'pins',
  },
];

/** Bundle stubs — founding lifetime display $39.99 (TestFlight). Monthly/yearly TBD. */
export const BUNDLE_PRODUCTS: ProductStub[] = [
  {
    id: BUNDLE_PRODUCT_IDS.monthly,
    period: 'monthly',
    displayPrice: 'TBD',
    priceUsd: null,
    label: 'Bundle Monthly',
    scope: 'bundle',
    hidden: true,
  },
  {
    id: BUNDLE_PRODUCT_IDS.yearly,
    period: 'yearly',
    displayPrice: 'TBD',
    priceUsd: null,
    label: 'Bundle Annual',
    scope: 'bundle',
    hidden: true,
  },
  {
    id: BUNDLE_PRODUCT_IDS.lifetime,
    period: 'lifetime',
    displayPrice: '$39.99',
    priceUsd: 39.99,
    founding: true,
    label: 'Founding Lifetime (Pins + Pets)',
    scope: 'bundle',
  },
];

export const ALL_PRODUCTS: ProductStub[] = [...PINS_PRODUCTS, ...BUNDLE_PRODUCTS];

export const PRIMARY_PRODUCT_ID = PINS_PRODUCT_IDS.yearly;

export const FREE_PROTOCOL_LIMIT = 2;

/** @deprecated Full map history is Free (Kevin 2026-09-05). Kept for callers; filter is a no-op. */
export const FREE_MAP_HISTORY_DAYS = Number.POSITIVE_INFINITY;

export type FeatureId =
  | 'log_doses'
  | 'reminders'
  | 'protocols'
  | 'basic_recon'
  | 'basic_site_rotation'
  | 'local_storage'
  | 'full_map_history'
  | 'photos_labs_trends'
  | 'cloud_sync'
  | 'export_pdf'
  | 'advanced_inventory';

export type FeatureTier = 'free' | 'pro';

export type FeatureDef = {
  id: FeatureId;
  label: string;
  tier: FeatureTier;
  freeLimit?: number;
};

/**
 * Free vs Pro capability matrix (Pins).
 * Free keeps: log / reminders / 2 protocols / full map history / basic recon / basic rotation / local storage.
 * Pro unlocks: unlimited protocols, export/PDF, cloud sync, advanced inventory, photos/labs/trends.
 */
export const FEATURE_MATRIX: FeatureDef[] = [
  { id: 'log_doses', label: 'Log doses', tier: 'free' },
  { id: 'reminders', label: 'Reminders', tier: 'free' },
  { id: 'protocols', label: 'Protocols', tier: 'free', freeLimit: FREE_PROTOCOL_LIMIT },
  { id: 'basic_recon', label: 'Basic reconstitution calculator', tier: 'free' },
  { id: 'basic_site_rotation', label: 'Basic site rotation', tier: 'free' },
  { id: 'local_storage', label: 'Local encrypted storage', tier: 'free' },
  { id: 'full_map_history', label: 'Full map history', tier: 'free' },
  { id: 'photos_labs_trends', label: 'Photos / labs / trends', tier: 'pro' },
  { id: 'cloud_sync', label: 'Cloud sync', tier: 'pro' },
  { id: 'export_pdf', label: 'Export / PDF', tier: 'pro' },
  { id: 'advanced_inventory', label: 'Advanced inventory', tier: 'pro' },
];

export type AccessResult =
  | { allowed: true; reason?: string }
  | { allowed: false; reason: string; feature: FeatureId };

const ALWAYS_FREE: FeatureId[] = [
  'log_doses',
  'reminders',
  'basic_recon',
  'basic_site_rotation',
  'local_storage',
  'full_map_history',
];

export function getProductById(id: string): ProductStub | undefined {
  return ALL_PRODUCTS.find((p) => p.id === id);
}

/** Soft offers shown in the paywall (Pins single-app only). Annual first. */
export function listPinsOfferProducts(): ProductStub[] {
  return [...PINS_PRODUCTS].sort((a, b) => Number(Boolean(b.primary)) - Number(Boolean(a.primary)));
}

/** Founding TF lifetime bundle ($39.99) — shown when VITE_FOUNDING_LIFETIME=true. */
export function getFoundingBundleProduct(): ProductStub | undefined {
  return getProductById(BUNDLE_PRODUCT_IDS.lifetime);
}

export function getFeature(id: FeatureId): FeatureDef | undefined {
  return FEATURE_MATRIX.find((f) => f.id === id);
}

export function isAlwaysFreeFeature(feature: FeatureId): boolean {
  return ALWAYS_FREE.includes(feature);
}

/**
 * Soft gate from Free vs Pro matrix.
 * Basic dose log / site rotation are never hard-blocked.
 */
export function canAccessFeature(
  feature: FeatureId,
  opts?: { protocolCount?: number; isPro?: boolean },
): AccessResult {
  const isPro = opts?.isPro ?? false;
  const def = getFeature(feature);

  if (ALWAYS_FREE.includes(feature)) {
    return { allowed: true, reason: 'Included on Free' };
  }

  if (feature === 'protocols') {
    const limit = def?.freeLimit ?? FREE_PROTOCOL_LIMIT;
    const count = opts?.protocolCount ?? 0;
    if (isPro || count < limit) {
      return { allowed: true };
    }
    return {
      allowed: false,
      feature,
      reason: `Free includes ${limit} protocols. Upgrade to Pro for unlimited protocols.`,
    };
  }

  if (def?.tier === 'pro' && !isPro) {
    return {
      allowed: false,
      feature,
      reason: `${def.label} is a Pro feature.`,
    };
  }

  return { allowed: true };
}

export function shouldPromptUpgrade(
  feature: FeatureId,
  opts?: { protocolCount?: number; isPro?: boolean },
): boolean {
  return !canAccessFeature(feature, opts).allowed;
}

/** Count distinct active schedule compounds as "protocols". */
export function countProtocols(
  schedule: { compound: string; active?: boolean; deletedAt?: string | null }[],
): number {
  const names = new Set<string>();
  for (const row of schedule) {
    if (row.deletedAt) continue;
    if (row.active === false) continue;
    if (row.compound?.trim()) names.add(row.compound.trim().toLowerCase());
  }
  return names.size;
}

/** Filter map history for free tier when paywall enforcement is on. */
export function filterMapHistoryLogs<T extends { time?: string; timestamp?: string }>(
  logs: T[],
  _opts: { isPro: boolean; enforce: boolean; now?: number },
): T[] {
  // Kevin 2026-09-05: full map history is Free — never truncate.
  return logs;
}

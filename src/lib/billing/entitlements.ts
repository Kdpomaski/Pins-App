/**
 * Local entitlement state + stub Supabase upsert/fetch.
 *
 * Bundle entitlement model (locked decision 2026-09-03):
 * - Bundle (or single-app Pro) unlocks Pro in BOTH Pins and Pins Pets when the
 *   user is signed in to the same Supabase account.
 * - After StoreKit 2 / Play Billing purchase or Restore: set local Pro flag,
 *   then upsert entitlement for the signed-in user (user_metadata stub and/or
 *   `user_entitlements` table when present).
 * - Each app on launch / Restore: refresh native receipts → upsert → gate from
 *   shared account record.
 * - Offline / no account: keep local entitlement; on next sign-in, merge/restore
 *   so both apps see the bundle.
 * - Restore Purchases must be available in each app and re-validate against
 *   Apple/Google, then sync to Supabase when signed in.
 *
 * v1 does NOT invent full server-side receipt verification — stub hooks only.
 */

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { BUNDLE_PRODUCT_IDS, PINS_PRODUCT_IDS } from './products';

const LOCAL_KEY = 'pins_pro_entitlement_v1';
const FIRST_DOSE_PAYWALL_KEY = 'pins.paywall.firstDoseShown';

export type EntitlementSource = 'local' | 'store' | 'supabase' | 'mock' | 'bundle' | 'none';

export type EntitlementRecord = {
  isPro: boolean;
  productId: string | null;
  source: EntitlementSource;
  updatedAt: string | null;
  /** True when product is a Pins+Pets bundle SKU. */
  isBundle?: boolean;
};

/** Alias used by contexts. */
export type EntitlementState = EntitlementRecord;

const EMPTY: EntitlementRecord = {
  isPro: false,
  productId: null,
  source: 'none',
  updatedAt: null,
  isBundle: false,
};

let memoryFirstDoseShown = false;

export function readLocalEntitlement(): EntitlementRecord {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<EntitlementRecord>;
    return {
      isPro: Boolean(parsed.isPro),
      productId: parsed.productId ?? null,
      source: parsed.source ?? 'local',
      updatedAt: parsed.updatedAt ?? null,
      isBundle: Boolean(parsed.isBundle),
    };
  } catch {
    return { ...EMPTY };
  }
}

export function getEntitlement(): EntitlementState {
  return readLocalEntitlement();
}

export function isProUser(): boolean {
  return getEntitlement().isPro;
}

export function writeLocalEntitlement(
  partial: Partial<EntitlementRecord> & { isPro: boolean },
): EntitlementRecord {
  const next: EntitlementRecord = {
    isPro: partial.isPro,
    productId: partial.productId ?? null,
    source: partial.source ?? 'local',
    updatedAt: partial.updatedAt ?? new Date().toISOString(),
    isBundle: Boolean(partial.isBundle),
  };
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('[billing] Failed to persist local entitlement', err);
  }
  return next;
}

/** @deprecated Prefer writeLocalEntitlement */
export function setLocalEntitlement(
  input: Partial<EntitlementRecord> & { isPro: boolean },
): EntitlementState {
  if (!input.isPro) {
    clearLocalEntitlement();
    return { ...EMPTY };
  }
  return writeLocalEntitlement(input);
}

export function clearLocalEntitlement(): void {
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* ignore */
  }
}

/** DEV / mock helper. */
export function mockUnlockProForDev(productId: string = PINS_PRODUCT_IDS.yearly): EntitlementRecord {
  return writeLocalEntitlement({
    isPro: true,
    productId,
    source: 'mock',
    isBundle: productId.startsWith('com.two20tech.bundle.'),
  });
}

/**
 * Stub upsert of shared entitlement for signed-in Supabase user.
 * Writes user_metadata.entitlements (always available) and best-effort upserts
 * `public.user_entitlements` when that table exists (see supabase/schema.sql).
 * Bundle unlocks Pro in Pins AND Pets via the same signed-in account + Restore.
 */
export async function upsertSupabaseEntitlement(
  record: EntitlementRecord,
  userId?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase not configured' };
  }
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = userId ?? session?.user?.id;
    if (!uid || !session) {
      return { ok: false, error: 'Not signed in' };
    }

    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        entitlements: {
          pins_pro: record.isPro,
          pets_pro: record.isPro && (record.isBundle || Boolean(record.productId?.includes('bundle'))),
          bundle: Boolean(record.isBundle),
          product_id: record.productId,
          updated_at: record.updatedAt,
          source: record.source,
        },
      },
    });
    if (metaError) {
      console.warn('[billing] entitlements metadata upsert failed', metaError.message);
    }

    // Best-effort table upsert (shared with Pets). Ignore if table absent.
    try {
      const { error: tableError } = await supabase.from('user_entitlements').upsert(
        {
          user_id: uid,
          is_pro: record.isPro,
          plan: record.productId ?? 'none',
          product_id: record.productId,
          source_app: record.isBundle ? 'bundle' : 'pins',
          updated_at: record.updatedAt ?? new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (tableError) {
        console.warn(
          '[billing] user_entitlements table upsert stub failed (table may be absent)',
          tableError.message,
        );
      }
    } catch (err) {
      console.warn('[billing] user_entitlements upsert threw', err);
    }

    return metaError ? { ok: false, error: metaError.message } : { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function fetchSupabaseEntitlement(
  userId?: string | null,
): Promise<EntitlementRecord | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return null;
    if (userId && user.id !== userId) return null;

    // Prefer dedicated table when present.
    try {
      const { data, error } = await supabase
        .from('user_entitlements')
        .select('is_pro, product_id, updated_at, source_app')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error && data?.is_pro) {
        return {
          isPro: true,
          productId: data.product_id ?? null,
          source: data.source_app === 'bundle' ? 'bundle' : 'supabase',
          updatedAt: data.updated_at ?? null,
          isBundle: data.source_app === 'bundle',
        };
      }
    } catch {
      /* table may be absent */
    }

    const meta = (user.user_metadata?.entitlements ?? null) as
      | {
          pins_pro?: boolean;
          pets_pro?: boolean;
          bundle?: boolean;
          product_id?: string | null;
          updated_at?: string | null;
          source?: EntitlementSource;
        }
      | null;

    if (!meta) return null;
    const isPro = Boolean(meta.pins_pro || meta.pets_pro || meta.bundle);
    if (!isPro) return null;
    return {
      isPro: true,
      productId: meta.product_id ?? null,
      source: meta.bundle ? 'bundle' : meta.source ?? 'supabase',
      updatedAt: meta.updated_at ?? null,
      isBundle: Boolean(meta.bundle),
    };
  } catch {
    return null;
  }
}

export function mergeEntitlements(
  local: EntitlementRecord,
  remote: EntitlementRecord | null,
): EntitlementRecord {
  if (!remote) return local;
  if (!local.isPro && !remote.isPro) return local;
  if (local.isPro && !remote.isPro) return local;
  if (!local.isPro && remote.isPro) return remote;

  const localTs = local.updatedAt ? Date.parse(local.updatedAt) : 0;
  const remoteTs = remote.updatedAt ? Date.parse(remote.updatedAt) : 0;
  return remoteTs >= localTs ? remote : local;
}

/** Refresh local (+ optional remote) entitlement snapshot. */
export async function refreshEntitlement(userId?: string | null): Promise<EntitlementState> {
  const local = readLocalEntitlement();
  const remote = await fetchSupabaseEntitlement(userId);
  const merged = mergeEntitlements(local, remote);
  if (merged.isPro && (merged !== local || !local.isPro)) {
    writeLocalEntitlement(merged);
  }
  // If local Pro and signed in, push stub so Pets can see bundle/account Pro.
  if (merged.isPro && userId) {
    void upsertSupabaseEntitlement(merged, userId);
  }
  return merged;
}

export function hasShownFirstDosePaywall(): boolean {
  try {
    if (localStorage.getItem(FIRST_DOSE_PAYWALL_KEY) === '1') return true;
  } catch {
    /* ignore */
  }
  return memoryFirstDoseShown;
}

export function markFirstDosePaywallShown(): void {
  memoryFirstDoseShown = true;
  try {
    localStorage.setItem(FIRST_DOSE_PAYWALL_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function resetFirstDosePaywallFlag(): void {
  memoryFirstDoseShown = false;
  try {
    localStorage.removeItem(FIRST_DOSE_PAYWALL_KEY);
  } catch {
    /* ignore */
  }
}

export const KNOWN_PRO_PRODUCT_IDS: string[] = [
  ...Object.values(PINS_PRODUCT_IDS),
  ...Object.values(BUNDLE_PRODUCT_IDS),
];

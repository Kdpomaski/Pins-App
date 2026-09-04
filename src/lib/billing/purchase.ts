/**
 * Capacitor-friendly StoreKit 2 / Play Billing stubs.
 *
 * Native plugins are NOT wired yet. Web / mock path sets local Pro when
 * VITE_BILLING_MOCK=true. Live IAP products must NOT be created in ASC/Play
 * until Kevin's money gate.
 */

import {
  BUNDLE_PRODUCT_IDS,
  PINS_PRODUCT_IDS,
  PRIMARY_PRODUCT_ID,
  type ProductStub,
  getProductById,
} from './products';
import { isBillingMockEnabled } from './feature-flags';
import {
  KNOWN_PRO_PRODUCT_IDS,
  type EntitlementRecord,
  upsertSupabaseEntitlement,
  writeLocalEntitlement,
  readLocalEntitlement,
} from './entitlements';

export type BillingPlatform = 'ios' | 'android' | 'web' | 'unknown';

export type PurchaseResult =
  | { ok: true; productId: string; entitlement: EntitlementRecord; mocked: boolean }
  | { ok: false; error: string; code?: 'cancelled' | 'unavailable' | 'failed' | 'not_configured' };

export type RestoreResult =
  | { ok: true; entitlement: EntitlementRecord; mocked: boolean; restored: boolean; restoredProductIds: string[] }
  | { ok: false; error: string; code?: 'none_found' | 'unavailable' | 'failed' | 'not_configured' };

/** StoreKit 2–shaped purchase request (stub). */
export type StoreKit2PurchaseRequest = {
  productId: string;
  appAccountToken?: string;
};

/** Play Billing–shaped purchase request (stub). */
export type PlayBillingPurchaseRequest = {
  productId: string;
  obfuscatedAccountId?: string;
};

export function detectBillingPlatform(): BillingPlatform {
  if (typeof window === 'undefined') return 'unknown';
  const w = window as Window & { Capacitor?: { getPlatform?: () => string } };
  const platform = w.Capacitor?.getPlatform?.();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  if (platform === 'web') return 'web';
  return 'web';
}

/**
 * Purchase stub. When mock is on, grants local Pro immediately (+ optional Supabase upsert).
 * Otherwise returns not_configured (native bridge not wired yet).
 */
export type PurchaseRequest = { productId: string; userId?: string | null };
export type RestoreRequest = { userId?: string | null };

export async function purchaseProduct(
  arg: string | PurchaseRequest,
): Promise<PurchaseResult> {
  const productId = typeof arg === 'string' ? arg : arg.productId;
  const userId = typeof arg === 'string' ? undefined : arg.userId;
  const product = getProductById(productId);
  if (!product) {
    return { ok: false, error: `Unknown product: ${productId}`, code: 'failed' };
  }

  if (isBillingMockEnabled()) {
    const entitlement = writeLocalEntitlement({
      isPro: true,
      productId,
      source: 'mock',
      isBundle: product.scope === 'bundle',
    });
    void upsertSupabaseEntitlement(entitlement, userId);
    return { ok: true, productId, entitlement, mocked: true };
  }

  const platform = detectBillingPlatform();
  if (platform === 'ios') {
    return {
      ok: false,
      error: 'StoreKit 2 bridge not configured (stub). Enable VITE_BILLING_MOCK for local testing.',
      code: 'not_configured',
    };
  }
  if (platform === 'android') {
    return {
      ok: false,
      error: 'Play Billing bridge not configured (stub). Enable VITE_BILLING_MOCK for local testing.',
      code: 'not_configured',
    };
  }
  return {
    ok: false,
    error: 'In-app purchases are not available on web. Enable VITE_BILLING_MOCK for local testing.',
    code: 'unavailable',
  };
}

export async function purchasePrimaryAnnual(): Promise<PurchaseResult> {
  return purchaseProduct(PRIMARY_PRODUCT_ID);
}

export async function purchaseFoundingBundle(): Promise<PurchaseResult> {
  return purchaseProduct(BUNDLE_PRODUCT_IDS.lifetime);
}

/**
 * Restore stub. Mock restores prior local Pro if present; otherwise none_found.
 * Native path returns not_configured until StoreKit 2 / Play Billing land.
 */
export async function restorePurchases(arg?: RestoreRequest): Promise<RestoreResult> {
  const userId = arg?.userId;
  if (isBillingMockEnabled()) {
    const existing = readLocalEntitlement();
    if (existing.isPro) {
      void upsertSupabaseEntitlement(existing, userId);
      return {
        ok: true,
        entitlement: existing,
        mocked: true,
        restored: true,
        restoredProductIds: existing.productId ? [existing.productId] : [PINS_PRODUCT_IDS.yearly],
      };
    }
    return {
      ok: false,
      error: 'No mock purchases to restore. Purchase with VITE_BILLING_MOCK first.',
      code: 'none_found',
    };
  }

  const platform = detectBillingPlatform();
  if (platform === 'ios' || platform === 'android') {
    return {
      ok: false,
      error: 'Native restore bridge not configured (stub).',
      code: 'not_configured',
    };
  }
  return {
    ok: false,
    error: 'Restore is not available on web without VITE_BILLING_MOCK.',
    code: 'unavailable',
  };
}

/** Interface sketch for a future native plugin. */
export interface NativeBillingBridge {
  getProducts(ids: string[]): Promise<ProductStub[]>;
  purchase(req: StoreKit2PurchaseRequest | PlayBillingPurchaseRequest): Promise<PurchaseResult>;
  restore(): Promise<RestoreResult>;
}

export function listStubProductIds(): string[] {
  return [...KNOWN_PRO_PRODUCT_IDS];
}

export { listPinsOfferProducts, getFoundingBundleProduct } from './products';

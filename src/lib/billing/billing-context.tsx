/**
 * Unified billing + soft-paywall React bridge (Pins).
 * Soft paywall shows only when VITE_PAYWALL_ENABLED=true.
 * Purchase helpers are stubs (no live IAP until Kevin money gate).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  getEntitlement,
  hasShownFirstDosePaywall,
  markFirstDosePaywallShown,
  refreshEntitlement,
  type EntitlementState,
} from '@/lib/billing/entitlements';
import { isPaywallEnabled } from '@/lib/billing/feature-flags';
import {
  BUNDLE_PRODUCT_IDS,
  PINS_PRODUCT_IDS,
  PRIMARY_PRODUCT_ID,
  canAccessFeature,
  countProtocols,
  type FeatureId,
  type AccessResult,
} from '@/lib/billing/products';
import {
  purchaseProduct,
  restorePurchases,
  type PurchaseResult,
  type RestoreResult,
} from '@/lib/billing/purchase';
import type { PinsData } from '@/lib/store';

export type PaywallReason =
  | 'after_first_log'
  | 'second_protocol'
  | 'export_locked'
  | 'generic_pro'
  | 'manual';

type BillingContextValue = {
  entitlement: EntitlementState;
  isPro: boolean;
  paywallEnabled: boolean;
  paywallOpen: boolean;
  paywallReason: PaywallReason;
  refresh: () => Promise<void>;
  openPaywall: (reason?: PaywallReason) => void;
  closePaywall: () => void;
  checkFeature: (feature: FeatureId, opts?: { protocolCount?: number }) => AccessResult;
  /**
   * After a successful real dose log: optionally open soft paywall once
   * (never blocks logging). priorLogCount===0 → show after THIS first log.
   */
  maybeShowSoftPaywallAfterFirstLog: (priorLogCount: number) => void;
  /** Soft-gate a Pro action: opens paywall when blocked & flag on; returns whether action may proceed. */
  requirePro: (
    feature: FeatureId,
    opts?: { protocolCount?: number; reason?: PaywallReason },
  ) => boolean;
  protocolCountFromData: (data: PinsData) => number;
  purchaseAnnual: () => Promise<PurchaseResult>;
  purchaseMonthly: () => Promise<PurchaseResult>;
  purchaseLifetime: () => Promise<PurchaseResult>;
  purchaseFounding: () => Promise<PurchaseResult>;
  restore: () => Promise<RestoreResult>;
};

const BillingContext = createContext<BillingContextValue | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entitlement, setEntitlement] = useState<EntitlementState>(() => getEntitlement());
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>('manual');
  const paywallEnabled = isPaywallEnabled();

  const refresh = useCallback(async () => {
    const next = await refreshEntitlement(user?.id ?? null);
    setEntitlement(next);
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openPaywall = useCallback(
    (reason: PaywallReason = 'manual') => {
      if (!paywallEnabled) return;
      if (entitlement.isPro) return;
      setPaywallReason(reason);
      setPaywallOpen(true);
    },
    [paywallEnabled, entitlement.isPro],
  );

  const closePaywall = useCallback(() => {
    setPaywallOpen(false);
  }, []);

  const checkFeature = useCallback(
    (feature: FeatureId, opts?: { protocolCount?: number }): AccessResult => {
      return canAccessFeature(feature, {
        isPro: entitlement.isPro,
        protocolCount: opts?.protocolCount,
      });
    },
    [entitlement.isPro],
  );

  const maybeShowSoftPaywallAfterFirstLog = useCallback(
    (priorLogCount: number) => {
      // Soft prompt AFTER first real dose log — not a day-0 hard wall.
      if (!paywallEnabled || entitlement.isPro) return;
      if (priorLogCount !== 0) return;
      if (hasShownFirstDosePaywall()) return;
      markFirstDosePaywallShown();
      setPaywallReason('after_first_log');
      setPaywallOpen(true);
    },
    [paywallEnabled, entitlement.isPro],
  );

  const requirePro = useCallback(
    (
      feature: FeatureId,
      opts?: { protocolCount?: number; reason?: PaywallReason },
    ): boolean => {
      const access = checkFeature(feature, { protocolCount: opts?.protocolCount });
      if (access.allowed) return true;
      if (!paywallEnabled) {
        // Flag off (TestFlight free): do not block Pro-only UI yet.
        return true;
      }
      openPaywall(
        opts?.reason ??
          (feature === 'export_pdf'
            ? 'export_locked'
            : feature === 'protocols'
              ? 'second_protocol'
              : 'generic_pro'),
      );
      return false;
    },
    [checkFeature, openPaywall, paywallEnabled],
  );

  const protocolCountFromData = useCallback(
    (data: PinsData) => countProtocols(data.schedule),
    [],
  );

  const purchaseAnnual = useCallback(async () => {
    const result = await purchaseProduct({
      productId: PRIMARY_PRODUCT_ID,
      userId: user?.id,
    });
    if (result.ok) await refresh();
    return result;
  }, [user?.id, refresh]);

  const purchaseMonthly = useCallback(async () => {
    const result = await purchaseProduct({
      productId: PINS_PRODUCT_IDS.monthly,
      userId: user?.id,
    });
    if (result.ok) await refresh();
    return result;
  }, [user?.id, refresh]);

  const purchaseLifetime = useCallback(async () => {
    const result = await purchaseProduct({
      productId: PINS_PRODUCT_IDS.lifetime,
      userId: user?.id,
    });
    if (result.ok) await refresh();
    return result;
  }, [user?.id, refresh]);

  const purchaseFounding = useCallback(async () => {
    const result = await purchaseProduct({
      productId: BUNDLE_PRODUCT_IDS.lifetime,
      userId: user?.id,
    });
    if (result.ok) await refresh();
    return result;
  }, [user?.id, refresh]);

  const restore = useCallback(async () => {
    const result = await restorePurchases({ userId: user?.id });
    if (result.ok) await refresh();
    return result;
  }, [user?.id, refresh]);

  const value = useMemo<BillingContextValue>(
    () => ({
      entitlement,
      isPro: entitlement.isPro,
      paywallEnabled,
      paywallOpen,
      paywallReason,
      refresh,
      openPaywall,
      closePaywall,
      checkFeature,
      maybeShowSoftPaywallAfterFirstLog,
      requirePro,
      protocolCountFromData,
      purchaseAnnual,
      purchaseMonthly,
      purchaseLifetime,
      purchaseFounding,
      restore,
    }),
    [
      entitlement,
      paywallEnabled,
      paywallOpen,
      paywallReason,
      refresh,
      openPaywall,
      closePaywall,
      checkFeature,
      maybeShowSoftPaywallAfterFirstLog,
      requirePro,
      protocolCountFromData,
      purchaseAnnual,
      purchaseMonthly,
      purchaseLifetime,
      purchaseFounding,
      restore,
    ],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling(): BillingContextValue {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error('useBilling must be used within BillingProvider');
  return ctx;
}

export function useBillingOptional(): BillingContextValue | null {
  return useContext(BillingContext);
}

/** @deprecated Prefer BillingProvider / useBilling — kept for transitional imports. */
export const EntitlementProvider = BillingProvider;
/** @deprecated Prefer useBilling */
export const useEntitlements = useBilling;
/** @deprecated Prefer useBillingOptional */
export const useEntitlementsOptional = useBillingOptional;

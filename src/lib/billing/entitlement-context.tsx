/**
 * Billing / Pro entitlement context for Pins.
 * Soft gates only — never blocks basic dose log or site rotation.
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
  type EntitlementRecord,
  fetchSupabaseEntitlement,
  mergeEntitlements,
  readLocalEntitlement,
  writeLocalEntitlement,
  hasShownFirstDosePaywall,
  markFirstDosePaywallShown,
} from './entitlements';
import { isPaywallEnabled } from './feature-flags';
import {
  canAccessFeature,
  countProtocols,
  type FeatureId,
  type AccessResult,
} from './products';
import {
  purchaseFoundingBundle,
  purchasePrimaryAnnual,
  purchaseProduct,
  restorePurchases,
  type PurchaseResult,
  type RestoreResult,
} from './purchase';
import type { PinsData } from '@/lib/store';
import { PINS_PRODUCT_IDS } from './products';

export type PaywallReason =
  | SoftPaywallReason;

export type SoftPaywallReason =
  | 'hero'
  | 'after_first_log'
  | 'second_protocol'
  | 'export_locked'
  | 'generic_pro'
  | 'manual';

type EntitlementContextValue = {
  ready: boolean;
  isPro: boolean;
  entitlement: EntitlementRecord;
  paywallEnabled: boolean;
  paywallOpen: boolean;
  paywallReason: SoftPaywallReason;
  openPaywall: (reason?: SoftPaywallReason) => void;
  closePaywall: () => void;
  refresh: () => Promise<void>;
  refreshEntitlement: () => Promise<void>;
  purchaseAnnual: () => Promise<PurchaseResult>;
  purchaseMonthly: () => Promise<PurchaseResult>;
  purchaseLifetime: () => Promise<PurchaseResult>;
  purchaseFounding: () => Promise<PurchaseResult>;
  purchaseById: (productId: string) => Promise<PurchaseResult>;
  restore: () => Promise<RestoreResult>;
  checkFeature: (
    feature: FeatureId,
    opts?: { protocolCount?: number },
  ) => AccessResult;
  maybePromptAfterFirstLog: (logCountAfterSave: number) => void;
  maybeShowSoftPaywallAfterFirstLog: (priorLogCount: number) => void;
  requirePro: (
    feature: FeatureId,
    opts?: { protocolCount?: number; reason?: SoftPaywallReason },
  ) => boolean;
  protocolCountFromData: (data: PinsData) => number;
};

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [entitlement, setEntitlement] = useState<EntitlementRecord>(() =>
    readLocalEntitlement(),
  );
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<SoftPaywallReason>('hero');
  const paywallEnabled = isPaywallEnabled();

  const refreshEntitlement = useCallback(async () => {
    const local = readLocalEntitlement();
    const remote = await fetchSupabaseEntitlement(user?.id);
    const merged = mergeEntitlements(local, remote);
    if (merged.isPro && (!local.isPro || merged.source === 'supabase' || merged.source === 'bundle')) {
      writeLocalEntitlement(merged);
    }
    setEntitlement(merged);
    setReady(true);
  }, [user?.id]);

  useEffect(() => {
    void refreshEntitlement();
  }, [refreshEntitlement]);

  const openPaywall = useCallback(
    (reason: SoftPaywallReason = 'hero') => {
      if (!paywallEnabled) return;
      if (entitlement.isPro) return;
      setPaywallReason(reason);
      setPaywallOpen(true);
    },
    [paywallEnabled, entitlement.isPro],
  );

  const closePaywall = useCallback(() => setPaywallOpen(false), []);

  const applyPurchase = useCallback(async (result: PurchaseResult) => {
    if (result.ok) {
      setEntitlement(result.entitlement);
      setPaywallOpen(false);
    }
    return result;
  }, []);

  const purchaseAnnual = useCallback(
    () => purchasePrimaryAnnual().then(applyPurchase),
    [applyPurchase],
  );
  const purchaseMonthly = useCallback(
    () => purchaseProduct(PINS_PRODUCT_IDS.monthly).then(applyPurchase),
    [applyPurchase],
  );
  const purchaseLifetime = useCallback(
    () => purchaseProduct(PINS_PRODUCT_IDS.lifetime).then(applyPurchase),
    [applyPurchase],
  );
  const purchaseFounding = useCallback(
    () => purchaseFoundingBundle().then(applyPurchase),
    [applyPurchase],
  );
  const purchaseById = useCallback(
    (productId: string) => purchaseProduct(productId).then(applyPurchase),
    [applyPurchase],
  );

  const restore = useCallback(async () => {
    const result = await restorePurchases();
    if (result.ok) {
      setEntitlement(result.entitlement);
      if (result.restoredProductIds.length > 0) setPaywallOpen(false);
    }
    return result;
  }, []);

  const checkFeature = useCallback(
    (feature: FeatureId, opts?: { protocolCount?: number }): AccessResult => {
      if (!paywallEnabled) return { allowed: true, reason: 'Paywall disabled' };
      return canAccessFeature(feature, {
        isPro: entitlement.isPro,
        protocolCount: opts?.protocolCount,
      });
    },
    [paywallEnabled, entitlement.isPro],
  );

  const maybePromptAfterFirstLog = useCallback(
    (logCountAfterSave: number) => {
      if (!paywallEnabled || entitlement.isPro) return;
      if (logCountAfterSave !== 1) return;
      if (hasShownFirstDosePaywall()) return;
      markFirstDosePaywallShown();
      setPaywallReason('after_first_log');
      setPaywallOpen(true);
    },
    [paywallEnabled, entitlement.isPro],
  );

  const maybeShowSoftPaywallAfterFirstLog = useCallback(
    (priorLogCount: number) => {
      maybePromptAfterFirstLog(priorLogCount + 1);
    },
    [maybePromptAfterFirstLog],
  );

  const requirePro = useCallback(
    (
      feature: FeatureId,
      opts?: { protocolCount?: number; reason?: SoftPaywallReason },
    ): boolean => {
      const access = checkFeature(feature, { protocolCount: opts?.protocolCount });
      if (access.allowed) return true;
      if (!paywallEnabled) return true;
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

  const value = useMemo<EntitlementContextValue>(
    () => ({
      ready,
      isPro: entitlement.isPro,
      entitlement,
      paywallEnabled,
      paywallOpen,
      paywallReason,
      openPaywall,
      closePaywall,
      refresh: refreshEntitlement,
      refreshEntitlement,
      purchaseAnnual,
      purchaseMonthly,
      purchaseLifetime,
      purchaseFounding,
      purchaseById,
      restore,
      checkFeature,
      maybePromptAfterFirstLog,
      maybeShowSoftPaywallAfterFirstLog,
      requirePro,
      protocolCountFromData,
    }),
    [
      ready,
      entitlement,
      paywallEnabled,
      paywallOpen,
      paywallReason,
      openPaywall,
      closePaywall,
      refreshEntitlement,
      purchaseAnnual,
      purchaseMonthly,
      purchaseLifetime,
      purchaseFounding,
      purchaseById,
      restore,
      checkFeature,
      maybePromptAfterFirstLog,
      maybeShowSoftPaywallAfterFirstLog,
      requirePro,
      protocolCountFromData,
    ],
  );

  return (
    <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>
  );
}

/** Alias so SoftPaywall / older imports can use BillingProvider naming. */
export const BillingProvider = EntitlementProvider;

export function useEntitlements(): EntitlementContextValue {
  const ctx = useContext(EntitlementContext);
  if (!ctx) throw new Error('useEntitlements must be used within EntitlementProvider');
  return ctx;
}

export function useBilling(): EntitlementContextValue {
  return useEntitlements();
}

export function useEntitlementsOptional(): EntitlementContextValue | null {
  return useContext(EntitlementContext);
}

export function useBillingOptional(): EntitlementContextValue | null {
  return useContext(EntitlementContext);
}

export { countProtocols };

/**
 * Compatibility re-export — use entitlement-context (BillingProvider alias).
 */
export {
  EntitlementProvider as BillingProvider,
  useEntitlements as useBilling,
  useEntitlementsOptional as useBillingOptional,
  type SoftPaywallReason,
  type PaywallReason,
} from './entitlement-context';

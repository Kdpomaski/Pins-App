/**
 * Alias module — canonical provider lives in entitlement-context.tsx.
 * SoftPaywall / call sites may import BillingProvider / useBilling from here.
 */
export {
  EntitlementProvider,
  EntitlementProvider as BillingProvider,
  useEntitlements,
  useEntitlements as useBilling,
  useEntitlementsOptional,
  useEntitlementsOptional as useBillingOptional,
  type PaywallReason,
  type SoftPaywallReason,
} from './entitlement-context';

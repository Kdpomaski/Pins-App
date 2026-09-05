/**
 * Soft paywall / upgrade copy — Pins.
 * Source: /workspace/bus/drafts/2026-09-03-paywall-ui-strings.md
 * No medical claims. No in-app peptide sales.
 * Website catalog CTAs deferred (Kevin 2026-09-05).
 */

export const PAYWALL_COPY = {
  headline: 'Unlock Pins Pro',
  subhead: 'Unlimited protocols, sync, exports, and advanced inventory. Basic logging and map history stay free.',
  reassure:
    'You can still log doses, keep 2 protocols, full map history, reminders, basic reconstitution, and site rotation without upgrading.',
  ctaPrimary: 'Continue — $49.99/year',
  ctaPrimarySub: 'Best value · about $4.17/mo · cancel anytime',
  ctaMonthly: 'Monthly — $4.99/mo',
  ctaLifetime: 'Lifetime — $99 once',
  ctaFounding: 'Unlock both apps — $39.99 lifetime',
  foundingBadge: 'Founding · TestFlight · Both apps',
  foundingBlurb:
    'One $39.99 lifetime unlock for both Pins and Pins Pets on TestFlight. Annual Pro is still the best everyday plan.',
  restore: 'Restore purchases',
  restoreHint:
    'Pro follows your signed-in account. Restore in each app after reinstall or on a new device.',
  restoreBundleHint:
    'Bundle unlocks Pro in both Pins and Pins Pets on the same signed-in account. Restore purchases in either app if Pro does not show.',
  continueFree: 'Not now',
  continueFreeAlt: 'Continue with Free',
  dismiss: 'Not now',
  legalRow:
    'Auto-renewing subscriptions billed by Apple or Google. Cancel anytime in your store account settings. Pins is a personal organization tool — not a medical device and not medical advice.',
  disclaimer:
    'Pins is a personal organization tool from 220 Tech LLC. It is not a medical device and does not provide medical advice. Always consult a qualified clinician. Nothing in this app sells products or offers medical treatment.',
  noInAppSales: 'Nothing in this app sells products or offers medical treatment.',
} as const;

export const PRO_BULLETS = [
  'Unlimited protocols (Free includes 2)',
  'Photos, labs & trends',
  'Cloud sync',
  'Export / PDF',
  'Advanced inventory',
] as const;

export const FREE_BULLETS = [
  'Log doses',
  'Reminders',
  '2 protocols',
  'Full map history',
  'Basic reconstitution',
  'Basic site rotation',
  'Local encrypted storage',
] as const;

export const BUNDLE_COPY = {
  headline: 'Founding: Pins + Pets Pro',
  subhead:
    'One $39.99 lifetime unlock for both apps on TestFlight. Annual Pro is still the best everyday plan.',
  bullets: [
    'Pro in Pins and Pins Pets',
    'Unlimited protocols (and unlimited pets in Pets)',
    'Sync, export / PDF, advanced inventory, photos & labs',
    'Founding price — TestFlight only',
  ] as const,
  cta: 'Unlock both apps — $39.99 lifetime',
  badge: 'Founding · TestFlight · Both apps',
  pushAnnual: 'Or go annual in this app — $49.99/year',
  entitlement:
    'Bundle unlocks Pro in both Pins and Pins Pets on the same signed-in account. Restore purchases in each app after reinstall; Pro follows the account, not just one device.',
} as const;

export const CONTEXT_COPY = {
  afterFirstLog: {
    title: 'Unlock Pins Pro',
    body: 'Unlimited protocols, sync, exports, and advanced inventory. Basic logging and map history stay free.',
    cta: 'See Pro plans',
    dismiss: 'Not now',
  },
  secondProtocol: {
    title: 'Need another protocol?',
    body: 'Free includes 2 protocols. Pins Pro unlocks unlimited protocols, sync, and exports.',
    cta: 'See Pro plans',
    dismiss: 'Keep 2 protocols',
  },
  exportLocked: {
    title: 'Export with Pins Pro',
    body: 'Download calendar (.ics), text, or PDF when you want a backup or handoff.',
    cta: 'Unlock exports — from $49.99/yr',
    dismiss: 'Not now',
  },
  genericPro: {
    title: 'This is a Pro feature',
    body: 'Sync, photos, labs, trends, and advanced inventory are included with Pins Pro.',
    cta: 'Unlock Pro',
    dismiss: 'Continue with Free',
  },
} as const;

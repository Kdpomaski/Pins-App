/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Soft paywall + Pro gating UI. Default false (TestFlight free). */
  readonly VITE_PAYWALL_ENABLED?: string;
  /** Show founding $39.99 Pins+Pets bundle offer. Default false. */
  readonly VITE_FOUNDING_LIFETIME?: string;
  /** Mock StoreKit/Play: purchase/restore set local Pro. Default false. DEV only. */
  readonly VITE_BILLING_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import type { PinsData } from '@/lib/store';
import { canAccessFeature } from '@/lib/billing/products';
import { isProUser } from '@/lib/billing/entitlements';
import { isPaywallEnabled } from '@/lib/billing/feature-flags';

/** Schema version for forward-compatible local + future sync migrations. */
export const SCHEMA_VERSION = 1;

export type SyncEnvelope = {
  schemaVersion: typeof SCHEMA_VERSION;
  deviceId: string;
  lastModified: string;
  lastSyncedAt: string | null;
  data: PinsData;
};

/** Encrypted payload ready for future E2E sync relay (ciphertext only leaves device). */
export type E2ESyncPayload = {
  schemaVersion: typeof SCHEMA_VERSION;
  deviceId: string;
  sentAt: string;
  /** AES-GCM ciphertext of SyncEnvelope JSON — decryptable only with user key. */
  encryptedBlob: import('@/lib/crypto').EncryptedBlob;
  recordCount: number;
};

export interface SyncAdapter {
  /** Push encrypted blob to sync relay (stub — no network yet). */
  push(payload: E2ESyncPayload): Promise<{ ok: boolean; error?: string }>;
  /** Pull encrypted blobs from relay (stub). */
  pull(since: string | null): Promise<E2ESyncPayload[]>;
}

/** No-op adapter until E2E sync backend exists. Cloud sync is a Pro capability. */
export const syncAdapter: SyncAdapter = {
  async push() {
    if (isPaywallEnabled() && !canAccessFeature('cloud_sync', { isPro: isProUser() }).allowed) {
      return { ok: false, error: 'Cloud sync is a Pins Pro feature.' };
    }
    return { ok: false, error: 'E2E sync not configured — local-first only.' };
  },
  async pull() {
    if (isPaywallEnabled() && !canAccessFeature('cloud_sync', { isPro: isProUser() }).allowed) {
      return [];
    }
    return [];
  },
};

export function buildSyncEnvelope(deviceId: string, data: PinsData): SyncEnvelope {
  return {
    schemaVersion: SCHEMA_VERSION,
    deviceId,
    lastModified: new Date().toISOString(),
    lastSyncedAt: null,
    data,
  };
}
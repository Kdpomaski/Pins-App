import type { PinsData } from '@/lib/store';

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

/** No-op adapter until E2E sync backend exists. */
export const syncAdapter: SyncAdapter = {
  async push() {
    return { ok: false, error: 'E2E sync not configured — local-first only.' };
  },
  async pull() {
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
import {
  decryptString,
  deriveDeviceKey,
  deriveKey,
  encryptString,
  hashVerifier,
  randomSalt,
  saltFromString,
  saltToString,
  type EncryptedBlob,
} from '@/lib/crypto';
import { getDeviceId } from '@/lib/device';
import { pinsDataSchema } from '@/lib/schemas';
import { buildSyncEnvelope, SCHEMA_VERSION, type SyncEnvelope } from '@/lib/sync';
import { DEFAULT_DATA } from '@/lib/default-data';
import type { PinsData } from '@/lib/store';

const SECURE_KEY = 'pins_secure_v1';
const LEGACY_KEY = 'pins_data';

export function readLegacyPlaintext(): PinsData | null {
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return null;
  try {
    const parsed = pinsDataSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function clearLegacyPlaintext() {
  localStorage.removeItem(LEGACY_KEY);
}

export async function loadEncrypted(key: CryptoKey): Promise<SyncEnvelope | null> {
  const raw = localStorage.getItem(SECURE_KEY);
  if (!raw) return null;

  try {
    const blob = JSON.parse(raw) as EncryptedBlob;
    const json = await decryptString(blob, key);
    const envelope = JSON.parse(json) as SyncEnvelope;
    const parsed = pinsDataSchema.safeParse(envelope.data);
    if (!parsed.success) return null;

    return { ...envelope, data: parsed.data };
  } catch {
    return null;
  }
}

export async function saveEncrypted(envelope: SyncEnvelope, key: CryptoKey): Promise<void> {
  const payload: SyncEnvelope = {
    ...envelope,
    schemaVersion: SCHEMA_VERSION,
    lastModified: new Date().toISOString(),
  };
  const blob = await encryptString(JSON.stringify(payload), key);
  localStorage.setItem(SECURE_KEY, JSON.stringify(blob));
  clearLegacyPlaintext();
}

export async function loadWithDeviceKey(): Promise<SyncEnvelope | null> {
  const config = getSecurityConfig();
  const key = await deriveDeviceKey(getDeviceId(), saltFromString(config.salt));
  return loadEncrypted(key);
}

export async function saveWithDeviceKey(envelope: SyncEnvelope): Promise<void> {
  const config = getSecurityConfig();
  const key = await deriveDeviceKey(getDeviceId(), saltFromString(config.salt));
  await saveEncrypted(envelope, key);
}

export type SecurityConfig = {
  mode: 'device' | 'passphrase';
  salt: string;
  verifier?: string;
};

const CONFIG_KEY = 'pins_security_config';

export function getSecurityConfig(): SecurityConfig {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as SecurityConfig;
    } catch {
      /* fall through */
    }
  }
  const salt = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const config: SecurityConfig = { mode: 'device', salt };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  return config;
}

export function saveSecurityConfig(config: SecurityConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export async function bootstrapPinsData(cryptoKey: CryptoKey): Promise<PinsData> {
  const encrypted = await loadEncrypted(cryptoKey);
  if (encrypted) return encrypted.data;

  const legacy = readLegacyPlaintext();
  if (legacy) {
    const envelope = await migrateToEncrypted(legacy);
    return envelope.data;
  }

  const deviceEnvelope = await loadWithDeviceKey();
  if (deviceEnvelope) return deviceEnvelope.data;

  const fresh = buildSyncEnvelope(getDeviceId(), DEFAULT_DATA);
  await saveWithDeviceKey(fresh);
  return DEFAULT_DATA;
}

export async function migrateToEncrypted(initial: PinsData): Promise<SyncEnvelope> {
  const envelope: SyncEnvelope = {
    schemaVersion: SCHEMA_VERSION,
    deviceId: getDeviceId(),
    lastModified: new Date().toISOString(),
    lastSyncedAt: null,
    data: initial,
  };
  await saveWithDeviceKey(envelope);
  clearLegacyPlaintext();
  return envelope;
}

/** Re-encrypt stored data from device-bound key to user passphrase (one-way upgrade). */
export async function migrateToPassphrase(passphrase: string): Promise<SecurityConfig> {
  const oldConfig = getSecurityConfig();
  const deviceKey = await deriveDeviceKey(getDeviceId(), saltFromString(oldConfig.salt));

  let envelope = await loadEncrypted(deviceKey);
  if (!envelope) {
    const legacy = readLegacyPlaintext();
    envelope = buildSyncEnvelope(getDeviceId(), legacy ?? DEFAULT_DATA);
  }

  const newSalt = randomSalt();
  const verifier = await hashVerifier(passphrase, newSalt);
  const passphraseKey = await deriveKey(passphrase, newSalt);

  await saveEncrypted(envelope, passphraseKey);

  const next: SecurityConfig = {
    mode: 'passphrase',
    salt: saltToString(newSalt),
    verifier,
  };
  saveSecurityConfig(next);
  clearLegacyPlaintext();
  return next;
}
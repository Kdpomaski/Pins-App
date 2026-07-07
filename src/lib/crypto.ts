const PBKDF2_ITERATIONS = 310_000;

export type EncryptedBlob = {
  v: 1;
  iv: string;
  ciphertext: string;
};

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  const saltBytes = new Uint8Array(salt);

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function deriveDeviceKey(deviceId: string, salt: Uint8Array): Promise<CryptoKey> {
  return deriveKey(`pins-device:${deviceId}`, salt);
}

export async function hashVerifier(passphrase: string, salt: Uint8Array): Promise<string> {
  const key = await deriveKey(passphrase, salt);
  const raw = await crypto.subtle.exportKey('raw', key);
  return toBase64(new Uint8Array(raw));
}

export async function verifyPassphrase(
  passphrase: string,
  salt: Uint8Array,
  expected: string,
): Promise<boolean> {
  const hash = await hashVerifier(passphrase, salt);
  return hash === expected;
}

export async function encryptString(plaintext: string, key: CryptoKey): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  return {
    v: 1,
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(cipher)),
  };
}

export async function decryptString(blob: EncryptedBlob, key: CryptoKey): Promise<string> {
  const iv = new Uint8Array(fromBase64(blob.iv));
  const data = new Uint8Array(fromBase64(blob.ciphertext));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(plain);
}

export function randomSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

export function saltToString(salt: Uint8Array): string {
  return toBase64(salt);
}

export function saltFromString(s: string): Uint8Array {
  return fromBase64(s);
}
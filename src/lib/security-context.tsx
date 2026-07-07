import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  deriveDeviceKey,
  deriveKey,
  saltFromString,
  verifyPassphrase,
} from '@/lib/crypto';
import { getDeviceId } from '@/lib/device';
import {
  getSecurityConfig,
  migrateToPassphrase,
  type SecurityConfig,
} from '@/lib/storage';

type SecurityStatus = 'loading' | 'unlock' | 'ready';

type SecurityContextValue = {
  status: SecurityStatus;
  encryptionMode: SecurityConfig['mode'];
  cryptoKey: CryptoKey | null;
  unlock: (passphrase: string) => Promise<boolean>;
  enablePassphrase: (passphrase: string) => Promise<void>;
  lock: () => void;
  isEncrypted: boolean;
};

const SecurityContext = createContext<SecurityContextValue | null>(null);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SecurityStatus>('loading');
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [config, setConfig] = useState<SecurityConfig>(() => getSecurityConfig());

  const initDeviceKey = useCallback(async () => {
    const key = await deriveDeviceKey(getDeviceId(), saltFromString(config.salt));
    setCryptoKey(key);
    setStatus('ready');
  }, [config.salt]);

  useEffect(() => {
    (async () => {
      if (config.mode === 'passphrase') {
        setStatus('unlock');
        return;
      }
      await initDeviceKey();
    })();
  }, [config.mode, initDeviceKey]);

  const unlock = useCallback(
    async (passphrase: string) => {
      if (!config.verifier) return false;
      const salt = saltFromString(config.salt);
      const valid = await verifyPassphrase(passphrase, salt, config.verifier);
      if (!valid) return false;
      const key = await deriveKey(passphrase, salt);
      setCryptoKey(key);
      setStatus('ready');
      return true;
    },
    [config],
  );

  const enablePassphrase = useCallback(async (passphrase: string) => {
    const next = await migrateToPassphrase(passphrase);
    const key = await deriveKey(passphrase, saltFromString(next.salt));
    setConfig(next);
    setCryptoKey(key);
    setStatus('ready');
  }, []);

  const lock = useCallback(() => {
    setCryptoKey(null);
    if (config.mode === 'passphrase') setStatus('unlock');
  }, [config.mode]);

  const value = useMemo(
    () => ({
      status,
      encryptionMode: config.mode,
      cryptoKey,
      unlock,
      enablePassphrase,
      lock,
      isEncrypted: true,
    }),
    [status, config.mode, cryptoKey, unlock, enablePassphrase, lock],
  );

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error('useSecurity must be used within SecurityProvider');
  return ctx;
}
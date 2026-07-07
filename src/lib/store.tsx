import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_DATA } from '@/lib/default-data';
import { getDeviceId } from '@/lib/device';
import {
  newInjectionLogSchema,
  newInventoryItemSchema,
  pinsDataSchema,
  formatZodError,
} from '@/lib/schemas';
import { useSecurity } from '@/lib/security-context';
import { buildSyncEnvelope } from '@/lib/sync';
import { bootstrapPinsData, saveEncrypted, saveWithDeviceKey } from '@/lib/storage';

export type InjectionLog = {
  id: string;
  siteId: string;
  compound: string;
  dose: number;
  unit: 'mg' | 'mcg';
  timestamp: string;
  notes?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type InventoryItem = {
  id: string;
  name: string;
  concentration: number;
  totalVolume: number;
  remainingVolume: number;
  unit: 'mg' | 'mcg';
  color: string;
  frequency?: string;
  defaultDose?: number;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type ScheduledDose = {
  id: string;
  compound: string;
  dose: number;
  unit: 'mg' | 'mcg';
  time: string;
  days: number[];
  active: boolean;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type PinsData = {
  logs: InjectionLog[];
  inventory: InventoryItem[];
  schedule: ScheduledDose[];
};

export { DEFAULT_DATA };

type PinsStoreContextType = {
  data: PinsData;
  ready: boolean;
  addLog: (log: Omit<InjectionLog, 'id' | 'updatedAt'>) => { ok: true } | { ok: false; error: string };
  updateInventory: (id: string, updates: Partial<InventoryItem>) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => { ok: true } | { ok: false; error: string };
  deleteInventoryItem: (id: string) => void;
};

const PinsStoreContext = createContext<PinsStoreContextType | null>(null);

export function PinsProvider({ children }: { children: ReactNode }) {
  const { cryptoKey, encryptionMode, status } = useSecurity();
  const [data, setData] = useState<PinsData>(DEFAULT_DATA);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== 'ready' || !cryptoKey) return;

    let cancelled = false;
    (async () => {
      const loaded = await bootstrapPinsData(cryptoKey);
      if (!cancelled) {
        setData(loaded);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, cryptoKey]);

  const persist = useCallback(
    (next: PinsData) => {
      const parsed = pinsDataSchema.safeParse(next);
      if (!parsed.success) return;

      const envelope = buildSyncEnvelope(getDeviceId(), parsed.data);

      const run = async () => {
        if (encryptionMode === 'passphrase' && cryptoKey) {
          await saveEncrypted(envelope, cryptoKey);
        } else {
          await saveWithDeviceKey(envelope);
        }
      };
      void run();
    },
    [cryptoKey, encryptionMode],
  );

  useEffect(() => {
    if (!ready) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(data), 400);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, ready, persist]);

  const addLog = (log: Omit<InjectionLog, 'id' | 'updatedAt'>) => {
    const parsed = newInjectionLogSchema.safeParse(log);
    if (!parsed.success) return { ok: false as const, error: formatZodError(parsed.error) };

    const now = new Date().toISOString();
    const newLog: InjectionLog = { ...parsed.data, id: crypto.randomUUID(), updatedAt: now };

    setData((prev) => {
      const inventory = prev.inventory.map((item) => {
        if (item.name === newLog.compound) {
          let doseInVialUnits = newLog.dose;
          if (item.unit === 'mg' && newLog.unit === 'mcg') doseInVialUnits = newLog.dose / 1000;
          if (item.unit === 'mcg' && newLog.unit === 'mg') doseInVialUnits = newLog.dose * 1000;
          const volumeUsed = doseInVialUnits / item.concentration;
          return {
            ...item,
            remainingVolume: Math.max(0, item.remainingVolume - volumeUsed),
            updatedAt: now,
          };
        }
        return item;
      });

      return {
        ...prev,
        logs: [newLog, ...prev.logs].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
        inventory,
      };
    });

    return { ok: true as const };
  };

  const updateInventory = (id: string, updates: Partial<InventoryItem>) => {
    setData((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item,
      ),
    }));
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => {
    const parsed = newInventoryItemSchema.safeParse(item);
    if (!parsed.success) return { ok: false as const, error: formatZodError(parsed.error) };

    setData((prev) => ({
      ...prev,
      inventory: [
        ...prev.inventory,
        { ...parsed.data, id: crypto.randomUUID(), updatedAt: new Date().toISOString() },
      ],
    }));
    return { ok: true as const };
  };

  const deleteInventoryItem = (id: string) => {
    setData((prev) => {
      const item = prev.inventory.find((entry) => entry.id === id);
      if (!item) return prev;

      return {
        ...prev,
        inventory: prev.inventory.filter((entry) => entry.id !== id),
        schedule: prev.schedule.filter((dose) => dose.compound !== item.name),
      };
    });
  };

  if (!ready) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-muted-foreground text-sm">
        Loading encrypted data…
      </div>
    );
  }

  return (
    <PinsStoreContext.Provider
      value={{ data, ready, addLog, updateInventory, addInventoryItem, deleteInventoryItem }}
    >
      {children}
    </PinsStoreContext.Provider>
  );
}

export const usePinsStore = () => {
  const context = useContext(PinsStoreContext);
  if (!context) throw new Error('usePinsStore must be used within PinsProvider');
  return context;
};
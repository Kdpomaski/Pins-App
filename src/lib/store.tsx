import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { BlendComponent } from '@/lib/blend';
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
import {
  deductVolumeFromCompound,
  scheduleForRemainingInventory,
} from '@/lib/inventory-vials';
import { applyFutureShotTime, syncScheduleWithInventory } from '@/lib/protocol-schedule';
import { periodFromTime, type DosePeriod } from '@/lib/dose-time';

export type InjectionLog = {
  id: string;
  siteId: string;
  compound: string;
  dose: number;
  unit: 'mg' | 'mcg';
  timestamp: string;
  notes?: string;
  blendComponents?: BlendComponent[];
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
  dosePeriod?: DosePeriod;
  doseTime?: string;
  reconstitutedAt?: string;
  lotNumber?: string;
  isBlend?: boolean;
  blendComponents?: BlendComponent[];
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
  updateLog: (
    id: string,
    updates: Omit<InjectionLog, 'id' | 'updatedAt' | 'deletedAt'>,
  ) => { ok: true } | { ok: false; error: string };
  updateInventory: (id: string, updates: Partial<InventoryItem>) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => { ok: true } | { ok: false; error: string };
  addInventoryItems: (
    items: Array<Omit<InventoryItem, 'id' | 'updatedAt'>>,
  ) => { ok: true } | { ok: false; error: string };
  deleteInventoryItem: (id: string) => void;
  updateFutureShotTime: (compound: string, time: string) => void;
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
        setData({
          ...loaded,
          schedule: syncScheduleWithInventory(loaded.schedule, loaded.inventory),
        });
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
      const inventory = deductVolumeFromCompound(
        prev.inventory,
        newLog.compound,
        newLog.dose,
        newLog.unit,
        now,
      );

      return {
        ...prev,
        logs: [newLog, ...prev.logs].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
        inventory,
        schedule: scheduleForRemainingInventory<ScheduledDose>(prev.schedule, inventory),
      };
    });

    return { ok: true as const };
  };

  const updateLog = (id: string, updates: Omit<InjectionLog, 'id' | 'updatedAt' | 'deletedAt'>) => {
    const parsed = newInjectionLogSchema.safeParse(updates);
    if (!parsed.success) return { ok: false as const, error: formatZodError(parsed.error) };
    if (!data.logs.some((log) => log.id === id)) {
      return { ok: false as const, error: 'Shot not found.' };
    }

    const now = new Date().toISOString();
    setData((prev) => {
      if (!prev.logs.some((log) => log.id === id)) return prev;
      return {
        ...prev,
        logs: prev.logs
          .map((log) =>
            log.id === id
              ? { ...log, ...parsed.data, id: log.id, updatedAt: now, deletedAt: log.deletedAt }
              : log,
          )
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      };
    });

    return { ok: true as const };
  };

  const updateInventory = (id: string, updates: Partial<InventoryItem>) => {
    setData((prev) => {
      const inventory = prev.inventory.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item,
      );
      const touchesProtocol =
        'frequency' in updates ||
        'defaultDose' in updates ||
        'unit' in updates ||
        'name' in updates ||
        'dosePeriod' in updates ||
        'doseTime' in updates;
      return {
        ...prev,
        inventory,
        schedule: touchesProtocol ? syncScheduleWithInventory(prev.schedule, inventory) : prev.schedule,
      };
    });
  };

  const addInventoryItems = (items: Array<Omit<InventoryItem, 'id' | 'updatedAt'>>) => {
    if (items.length === 0) return { ok: false as const, error: 'No inventory items to add.' };

    const parsedItems: Array<Omit<InventoryItem, 'id' | 'updatedAt'>> = [];
    for (const item of items) {
      const parsed = newInventoryItemSchema.safeParse(item);
      if (!parsed.success) return { ok: false as const, error: formatZodError(parsed.error) };
      parsedItems.push(parsed.data);
    }

    const now = new Date().toISOString();
    setData((prev) => {
      const inventory = [
        ...prev.inventory,
        ...parsedItems.map((entry) => ({
          ...entry,
          id: crypto.randomUUID(),
          updatedAt: now,
        })),
      ];
      return {
        ...prev,
        inventory,
        schedule: syncScheduleWithInventory(prev.schedule, inventory),
      };
    });
    return { ok: true as const };
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => addInventoryItems([item]);

  const updateFutureShotTime = (compound: string, time: string) => {
    const period = periodFromTime(time);
    if (!period) return;
    setData((prev) => {
      const next = applyFutureShotTime(prev.schedule, prev.inventory, compound, time, period);
      return { ...prev, ...next };
    });
  };

  const deleteInventoryItem = (id: string) => {
    setData((prev) => {
      const item = prev.inventory.find((entry) => entry.id === id);
      if (!item) return prev;

      const remainingVials = prev.inventory.filter(
        (entry) => entry.name === item.name && entry.id !== id,
      );

      return {
        ...prev,
        inventory: prev.inventory.filter((entry) => entry.id !== id),
        schedule:
          remainingVials.length === 0
            ? prev.schedule.filter((dose) => dose.compound !== item.name)
            : prev.schedule,
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
      value={{
        data,
        ready,
        addLog,
        updateLog,
        updateInventory,
        addInventoryItem,
        addInventoryItems,
        deleteInventoryItem,
        updateFutureShotTime,
      }}
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
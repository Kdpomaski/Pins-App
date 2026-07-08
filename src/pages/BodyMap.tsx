import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePinsStore, type InventoryItem } from '@/lib/store';

interface InjectionLog {
  id: string;
  siteId: string;
  region: string;
  compound: string;
  dose: number;
  time: string;
}

type Region = {
  id: string;
  label: string;
  view: 'front' | 'back';
  x: number;
  y: number;
};

const allRegions: Region[] = [
  { id: 'left-deltoid', label: 'Left Deltoid', view: 'front', x: 37, y: 23 },
  { id: 'right-deltoid', label: 'Right Deltoid', view: 'front', x: 63, y: 23 },
  { id: 'upper-left-abdomen', label: 'Upper Left Abdomen', view: 'front', x: 47, y: 33 },
  { id: 'upper-right-abdomen', label: 'Upper Right Abdomen', view: 'front', x: 53, y: 33 },
  { id: 'mid-left-abdomen', label: 'Mid Left Abdomen', view: 'front', x: 47, y: 38 },
  { id: 'mid-right-abdomen', label: 'Mid Right Abdomen', view: 'front', x: 53, y: 38 },
  { id: 'lower-left-abdomen', label: 'Lower Left Abdomen', view: 'front', x: 47, y: 42 },
  { id: 'lower-right-abdomen', label: 'Lower Right Abdomen', view: 'front', x: 53, y: 42 },
  { id: 'left-flank', label: 'Left Flank', view: 'front', x: 40, y: 45 },
  { id: 'right-flank', label: 'Right Flank', view: 'front', x: 60, y: 45 },
  { id: 'left-wrist', label: 'Left Wrist', view: 'front', x: 22, y: 45 },
  { id: 'right-wrist', label: 'Right Wrist', view: 'front', x: 78, y: 45 },
  { id: 'left-quadriceps', label: 'Left Quadriceps', view: 'front', x: 44, y: 53 },
  { id: 'right-quadriceps', label: 'Right Quadriceps', view: 'front', x: 58, y: 53 },
  { id: 'left-knee', label: 'Left Knee', view: 'front', x: 42, y: 60 },
  { id: 'right-knee', label: 'Right Knee', view: 'front', x: 58, y: 60 },
  { id: 'left-ankle', label: 'Left Ankle', view: 'front', x: 42, y: 82 },
  { id: 'right-ankle', label: 'Right Ankle', view: 'front', x: 58, y: 82 },
  { id: 'left-triceps', label: 'Left Triceps', view: 'back', x: 35, y: 25 },
  { id: 'right-triceps', label: 'Right Triceps', view: 'back', x: 65, y: 25 },
  { id: 'left-glute', label: 'Left Glute', view: 'back', x: 42, y: 46 },
  { id: 'right-glute', label: 'Right Glute', view: 'back', x: 57, y: 46 },
  { id: 'left-knee', label: 'Left Knee', view: 'back', x: 42, y: 64 },
  { id: 'right-knee', label: 'Right Knee', view: 'back', x: 58, y: 64 },
  { id: 'left-ankle', label: 'Left Ankle', view: 'back', x: 42, y: 85 },
  { id: 'right-ankle', label: 'Right Ankle', view: 'back', x: 58, y: 85 },
];

const NEUTRAL_PIN = 'rgba(255, 255, 255, 0.12)';

const BodyMap: React.FC<{
  onLogInjection?: (siteId: string, compoundName?: string) => void;
  logs?: InjectionLog[];
}> = ({
  onLogInjection,
  logs = [],
}) => {
  const { data } = usePinsStore();
  const [view, setView] = useState<'front' | 'back'>('front');
  const [selectedCompound, setSelectedCompound] = useState<InventoryItem | null>(null);

  const compoundTabs = useMemo(() => {
    const seen = new Map<string, InventoryItem>();
    for (const item of data.inventory) {
      if (!seen.has(item.name)) seen.set(item.name, item);
    }
    return Array.from(seen.values());
  }, [data.inventory]);

  const filteredLogs = useMemo(
    () =>
      selectedCompound
        ? logs.filter((l) => l.compound === selectedCompound.name)
        : logs,
    [logs, selectedCompound],
  );

  const getSiteLogs = (siteId: string) =>
    filteredLogs
      .filter((l) => l.siteId === siteId)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const getLastDate = (siteId: string) => {
    const siteLogs = getSiteLogs(siteId);
    return siteLogs.length ? format(new Date(siteLogs[0].time), 'MMM d, yyyy') : null;
  };

  const getStatusColor = (siteLogs: InjectionLog[]) => {
    if (selectedCompound && siteLogs.length === 0) return NEUTRAL_PIN;

    if (siteLogs.length === 0) return 'rgba(74, 222, 128, 0.5)';

    const hoursAgo = (Date.now() - new Date(siteLogs[0].time).getTime()) / (1000 * 60 * 60);

    if (hoursAgo <= 24) return '#ef4444';
    if (hoursAgo <= 72) return '#eab308';
    return 'rgba(74, 222, 128, 0.5)';
  };

  const regions = allRegions.filter((r) => r.view === view);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 pt-6 px-4">
      <Card className="p-4 sm:p-6 bg-card border border-border max-w-4xl mx-auto shadow-sm">
        <div className="flex justify-between items-center mb-4 sm:mb-6 gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Body Map</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tap a spot to log
              <span className="hidden sm:inline"> · hover for dates</span>
              <span className="sm:hidden"> · dates show on pins & in popup</span>
            </p>
          </div>
          <Button
            variant="outline"
            className="border-border text-base px-5 py-5 h-auto min-h-[48px]"
            onClick={() => setView(view === 'front' ? 'back' : 'front')}
          >
            {view === 'front' ? 'Back' : 'Front'}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Compound tabs */}
          <aside className="md:w-44 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Compounds
            </p>
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCompound(null)}
                className={`shrink-0 md:w-full text-left px-4 py-3 rounded-xl border text-base font-medium transition-colors min-h-[48px] ${
                  selectedCompound === null
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                }`}
              >
                All compounds
              </button>
              {compoundTabs.map((item) => {
                const vialCount = data.inventory.filter((v) => v.name === item.name).length;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() =>
                      setSelectedCompound((prev) => (prev?.name === item.name ? null : item))
                    }
                    className={`shrink-0 md:w-full text-left px-4 py-3 rounded-xl border text-base font-medium transition-colors flex items-center gap-2 min-h-[48px] ${
                      selectedCompound?.name === item.name
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate flex-1">{item.name}</span>
                    {vialCount > 1 && (
                      <span className="text-xs font-mono text-muted-foreground shrink-0">{vialCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {data.inventory.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">Add vials in Inventory to filter by compound.</p>
            )}
          </aside>

          {/* Map */}
          <div className="flex-1 min-w-0">
            {selectedCompound && (
              <p className="text-sm text-muted-foreground mb-3">
                Showing pins for <span className="font-medium text-foreground">{selectedCompound.name}</span>
                {' '}— other sites are neutral.
                <span className="block sm:hidden mt-1">Dates appear under each pin on mobile.</span>
              </p>
            )}

            <div className="relative rounded-2xl overflow-hidden border border-border aspect-[2/3] bg-black">
              {view === 'front' ? (
                <img
                  src="/body-map/front.jpeg"
                  alt="Front body map"
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />
              ) : (
                <img
                  src="/body-map/back-full.jpeg"
                  alt="Back body map"
                  className="absolute top-0 h-full w-[200%] max-w-none object-contain"
                  style={{ left: '-100%' }}
                  draggable={false}
                />
              )}

              {regions.map((r) => {
                const siteLogs = getSiteLogs(r.id);
                const color = getStatusColor(siteLogs);
                const lastDate = getLastDate(r.id);
                const hasFilteredPin = siteLogs.length > 0;

                const title = selectedCompound
                  ? `${r.label} — ${lastDate ?? 'Never'}`
                  : lastDate
                    ? `${r.label} — Last: ${lastDate}`
                    : r.label;

                return (
                  <button
                    key={`${r.view}-${r.id}`}
                    type="button"
                    onClick={() => onLogInjection?.(r.id, selectedCompound?.name)}
                    aria-label={title}
                    title={title}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 focus:outline-none focus:ring-4 focus:ring-primary/50 group touch-manipulation"
                    style={{
                      left: `${r.x}%`,
                      top: `${r.y}%`,
                      width: '6%',
                      height: '6%',
                      minWidth: '28px',
                      minHeight: '28px',
                      backgroundColor: color,
                      borderColor: hasFilteredPin || !selectedCompound ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)',
                      boxShadow: hasFilteredPin ? '0 0 6px rgba(0,0,0,0.4)' : 'none',
                      cursor: 'pointer',
                      opacity: selectedCompound && !hasFilteredPin ? 0.7 : 1,
                    }}
                  >
                    {selectedCompound && lastDate && (
                      <span className="pointer-events-none absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded bg-black/85 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-semibold text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                        {lastDate}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-semibold uppercase tracking-wider border border-border rounded-xl p-3 bg-muted/30">
              {selectedCompound ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: NEUTRAL_PIN, border: '1px solid rgba(255,255,255,0.25)' }} />
                    No pin for {selectedCompound.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(74,222,128,0.5)' }} />
                    Injected (7+ days)
                  </span>
                  <span className="flex items-center gap-1.5 text-yellow-600">
                    <span className="w-3 h-3 rounded-full bg-yellow-500" /> ≤ 3 days
                  </span>
                  <span className="flex items-center gap-1.5 text-red-600">
                    <span className="w-3 h-3 rounded-full bg-red-500" /> ≤ 24h
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(74,222,128,0.5)' }} />
                    Safe (7+ days)
                  </span>
                  <span className="flex items-center gap-1.5 text-yellow-600">
                    <span className="w-3 h-3 rounded-full bg-yellow-500" /> Caution (≤ 3 days)
                  </span>
                  <span className="flex items-center gap-1.5 text-red-600">
                    <span className="w-3 h-3 rounded-full bg-red-500" /> Recent (≤ 24h)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BodyMap;
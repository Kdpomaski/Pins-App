import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
  // Front
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
  // Back
  { id: 'left-triceps', label: 'Left Triceps', view: 'back', x: 35, y: 25 },
  { id: 'right-triceps', label: 'Right Triceps', view: 'back', x: 65, y: 25 },
  { id: 'left-glute', label: 'Left Glute', view: 'back', x: 42, y: 46 },
  { id: 'right-glute', label: 'Right Glute', view: 'back', x: 57, y: 46 },
  { id: 'left-knee', label: 'Left Knee', view: 'back', x: 42, y: 64 },
  { id: 'right-knee', label: 'Right Knee', view: 'back', x: 58, y: 64 },
  { id: 'left-ankle', label: 'Left Ankle', view: 'back', x: 42, y: 85 },
  { id: 'right-ankle', label: 'Right Ankle', view: 'back', x: 58, y: 85 },
];

const BodyMap: React.FC<{ onLogInjection?: (siteId: string) => void; logs?: InjectionLog[] }> = ({
  onLogInjection,
  logs = [],
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');

  const getSiteLogs = (siteId: string) =>
    logs
      .filter((l) => l.siteId === siteId)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const getStatusColor = (siteLogs: InjectionLog[]) => {
    if (siteLogs.length === 0) return 'rgba(74, 222, 128, 0.5)'; // Green 50% - no shot in 7 days

    const hoursAgo = (Date.now() - new Date(siteLogs[0].time).getTime()) / (1000 * 60 * 60);

    if (hoursAgo <= 24) return '#ef4444';      // Red - within 24h
    if (hoursAgo <= 72) return '#eab308';      // Yellow - within 3 days
    return 'rgba(74, 222, 128, 0.5)';          // Green - older than 3 days
  };

  const regions = allRegions.filter((r) => r.view === view);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 pt-6 px-4">
      <Card className="p-6 bg-card border border-border max-w-2xl mx-auto shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Body Map</h2>
          <Button variant="outline" className="border-border" onClick={() => setView(view === 'front' ? 'back' : 'front')}>
            {view === 'front' ? 'Back View' : 'Front View'}
          </Button>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-border aspect-[2/3] bg-black">
          {view === 'front' ? (
            <img src="/body-map/front.jpeg" alt="Front body map" className="absolute inset-0 w-full h-full object-contain" draggable={false} />
          ) : (
            <img src="/body-map/back-full.jpeg" alt="Back body map" className="absolute top-0 h-full w-[200%] max-w-none object-contain" style={{ left: '-100%' }} draggable={false} />
          )}

          {regions.map((r) => {
            const siteLogs = getSiteLogs(r.id);
            const color = getStatusColor(siteLogs);

            return (
              <button
                key={`${r.view}-${r.id}`}
                type="button"
                onClick={() => onLogInjection?.(r.id)}
                aria-label={`Log injection at ${r.label}`}
                title={r.label}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 focus:outline-none focus:ring-2 focus:ring-primary"
                style={{
                  left: `${r.x}%`,
                  top: `${r.y}%`,
                  width: '3.8%',           // ~10% smaller than before
                  height: '3.8%',
                  backgroundColor: color,
                  boxShadow: '0 0 6px rgba(0,0,0,0.4)',
                  cursor: 'pointer',
                }}
              />
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-semibold uppercase tracking-wider border border-border rounded-xl p-3 bg-muted/30">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: 'rgba(74,222,128,0.5)' }} /> Safe (7+ days)</span>
          <span className="flex items-center gap-1.5 text-yellow-600"><span className="w-3 h-3 rounded-full bg-yellow-500" /> Caution (≤ 3 days)</span>
          <span className="flex items-center gap-1.5 text-red-600"><span className="w-3 h-3 rounded-full bg-red-500" /> Recent (≤ 24h)</span>
        </div>
      </Card>
    </div>
  );
};

export default BodyMap;
// src/components/BodyMap.tsx  ← REPLACE ENTIRE FILE CONTENT WITH THIS
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface InjectionLog {
  id: string;
  region: string;
  compound: string;
  dose: number;
  time: string;
}

const BodyMap: React.FC = () => {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [logs, setLogs] = useState<InjectionLog[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  // All regions - expand as needed
  const allRegions = [
    // Front
    { id: 'left-deltoid', label: 'Left Deltoid', x: 25, y: 22, view: 'front' as const },
    { id: 'right-deltoid', label: 'Right Deltoid', x: 75, y: 22, view: 'front' as const },

    // Abdominal tiers (3 per side)
    { id: 'left-upper-abdomen', label: 'Left Upper Abdomen', x: 35, y: 42, view: 'front' as const },
    { id: 'right-upper-abdomen', label: 'Right Upper Abdomen', x: 65, y: 42, view: 'front' as const },
    { id: 'left-middle-abdomen', label: 'Left Middle Abdomen', x: 35, y: 50, view: 'front' as const },
    { id: 'right-middle-abdomen', label: 'Right Middle Abdomen', x: 65, y: 50, view: 'front' as const },
    { id: 'left-lower-abdomen', label: 'Left Lower Abdomen', x: 35, y: 58, view: 'front' as const },
    { id: 'right-lower-abdomen', label: 'Right Lower Abdomen', x: 65, y: 58, view: 'front' as const },

    // Back examples - add more
    { id: 'left-glute', label: 'Left Glute', x: 32, y: 75, view: 'back' as const },
    { id: 'right-glute', label: 'Right Glute', x: 68, y: 75, view: 'back' as const },
  ];

  const regions = allRegions.filter(r => r.view === view);

  const handleRegionClick = (regionLabel: string) => {
    setSelected(regionLabel);
    // TODO: Open your logger form here (prefill region)
    console.log('Selected for logging:', regionLabel);
  };

  const getStatusColor = (regionId: string) => {
    const recent = logs.some(l => l.region.toLowerCase().includes(regionId.split('-').pop() || ''));
    return recent ? '#eab308' : '#22c55e';
  };

  return (
    <Card className="p-6 bg-zinc-950 border-zinc-800 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Body Map</h2>
        <Button 
          variant="outline" 
          onClick={() => setView(view === 'front' ? 'back' : 'front')}
        >
          {view === 'front' ? '↔ Back View' : '↔ Front View'}
        </Button>
      </div>

      <div className="relative bg-black rounded-2xl overflow-hidden border border-zinc-700 aspect-[2/3]">
        <svg viewBox="0 0 100 150" className="w-full h-full">
          {regions.map((r) => (
            <g key={r.id} onClick={() => handleRegionClick(r.label)}>
              <circle
                cx={r.x}
                cy={r.y}
                r="7"
                fill={getStatusColor(r.id)}
                stroke="#ddd"
                strokeWidth="1.5"
                style={{ cursor: 'pointer' }}
              />
              <text 
                x={r.x} 
                y={r.y + 13} 
                textAnchor="middle" 
                fill="#ddd" 
                fontSize="3.8"
                className="pointer-events-none"
              >
                {r.label.split(' ').slice(-2).join(' ')}
              </text>
            </g>
          ))}

          {/* Dynamic Pins */}
          {logs.map((log, i) => (
            <circle key={i} cx="50" cy="60" r="3" fill="#ef4444" />
          ))}
        </svg>
      </div>

      {selected && (
        <div className="mt-6 p-5 bg-zinc-900 rounded-xl border border-zinc-700">
          <p className="font-semibold">Logging: {selected}</p>
          {/* Paste your logger form here */}
          <Button onClick={() => setSelected(null)} className="mt-4 w-full">Save & Close</Button>
        </div>
      )}
    </Card>
  );
};

export default BodyMap;
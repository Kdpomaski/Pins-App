import { useEffect, useMemo, useState } from 'react';
import { Download, Calendar, FileText } from 'lucide-react';
import { usePinsStore } from '@/lib/store';
import {
  allCompoundNames,
  buildFutureDoses,
  exportSchedule,
  remainingDoses,
  type ExportFormat,
} from '@/lib/schedule-export';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ScheduleExportModal({ open, onClose }: Props) {
  const { data } = usePinsStore();
  const compounds = useMemo(() => allCompoundNames(data), [data]);
  const [formatType, setFormatType] = useState<ExportFormat>('calendar');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) setSelected(new Set(compounds));
  }, [open, compounds]);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(compounds));
  const clearAll = () => setSelected(new Set());

  const selectedList = Array.from(selected);
  const futureCount =
    formatType === 'calendar' ? buildFutureDoses(selectedList, data).length : 0;

  const handleExport = () => {
    exportSchedule(formatType, selectedList, data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-border">
        <DialogHeader>
          <DialogTitle>Export Schedule</DialogTitle>
          <DialogDescription>
            Export selected compounds to your calendar or as an administration log.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Export type</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormatType('calendar')}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors ${
                  formatType === 'calendar' ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                <Calendar size={18} />
                <span>
                  <span className="font-medium block">Calendar (.ics)</span>
                  <span className="text-xs text-muted-foreground">Google & Apple</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFormatType('text')}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors ${
                  formatType === 'text' ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                <FileText size={18} />
                <span>
                  <span className="font-medium block">Text log (.txt)</span>
                  <span className="text-xs text-muted-foreground">Doses administered</span>
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compounds</p>
              <div className="flex gap-2 text-xs">
                <button type="button" className="text-primary font-medium" onClick={selectAll}>
                  Select all
                </button>
                <span className="text-muted-foreground">|</span>
                <button type="button" className="text-muted-foreground" onClick={clearAll}>
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl border border-border p-3 bg-card">
              {compounds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No compounds in inventory or schedule.</p>
              ) : (
                compounds.map((name) => {
                  const item = data.inventory.find((i) => i.name === name);
                  const schedule = data.schedule.find((s) => s.compound === name && s.active);
                  const dose = schedule?.dose ?? item?.defaultDose ?? 0;
                  const unit = schedule?.unit ?? item?.unit ?? 'mcg';
                  const dosesLeft = item ? remainingDoses(item, dose, unit) : 0;

                  return (
                    <label
                      key={name}
                      className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/40 cursor-pointer"
                    >
                      <Checkbox
                        checked={selected.has(name)}
                        onCheckedChange={() => toggle(name)}
                        className="mt-0.5"
                      />
                      <span className="flex-1 text-sm">
                        <span className="font-medium">{name}</span>
                        {formatType === 'calendar' && item && (
                          <span className="block text-xs text-muted-foreground">
                            {item.frequency ?? 'No frequency'} · ~{dosesLeft} doses left
                          </span>
                        )}
                        {formatType === 'text' && (
                          <span className="block text-xs text-muted-foreground">
                            {data.logs.filter((l) => l.compound === name).length} log(s)
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {formatType === 'calendar' && selectedList.length > 0 && (
            <p className="text-xs text-muted-foreground border border-border rounded-lg p-3 bg-muted/20">
              Downloads an <strong>.ics</strong> file with {futureCount} future dose(s) based on frequency until
              inventory is depleted. Open the file to import into Google Calendar or Apple Calendar.
            </p>
          )}

          {formatType === 'text' && selectedList.length > 0 && (
            <p className="text-xs text-muted-foreground border border-border rounded-lg p-3 bg-muted/20">
              Downloads a text file with date, compound name, dose, and injection site for each logged administration.
            </p>
          )}

          <Button
            className="w-full"
            disabled={selectedList.length === 0}
            onClick={handleExport}
          >
            <Download size={18} className="mr-2" />
            Export {selectedList.length > 0 ? `(${selectedList.length})` : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
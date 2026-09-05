import { useEffect, useMemo, useState } from 'react';
import { addDays, format, parseISO, startOfDay, subDays } from 'date-fns';
import { Download, Calendar, FileText } from 'lucide-react';
import { formatBlendBreakdown } from '@/lib/blend';
import { usePinsStore } from '@/lib/store';
import {
  allCompoundNames,
  buildFutureDoses,
  exportSchedule,
  logsInRange,
  remainingDoses,
  type ExportFormat,
  type ExportRange,
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

function toInput(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function fromInput(value: string): Date {
  return startOfDay(parseISO(value));
}

function defaultRange(formatType: ExportFormat): ExportRange {
  const today = startOfDay(new Date());
  if (formatType === 'calendar') {
    return { from: today, to: addDays(today, 29) };
  }
  return { from: subDays(today, 29), to: today };
}

export function ScheduleExportModal({ open, onClose }: Props) {
  const { data } = usePinsStore();
  const compounds = useMemo(() => allCompoundNames(data), [data]);
  const [formatType, setFormatType] = useState<ExportFormat>('calendar');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fromStr, setFromStr] = useState(() => toInput(defaultRange('calendar').from));
  const [toStr, setToStr] = useState(() => toInput(defaultRange('calendar').to));

  useEffect(() => {
    if (open) setSelected(new Set(compounds));
  }, [open, compounds]);

  useEffect(() => {
    if (!open) return;
    const next = defaultRange(formatType);
    setFromStr(toInput(next.from));
    setToStr(toInput(next.to));
  }, [open, formatType]);

  const range: ExportRange = {
    from: fromInput(fromStr),
    to: fromInput(toStr),
  };
  const rangeValid = range.from.getTime() <= range.to.getTime();

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
  const futureCount = rangeValid
    ? buildFutureDoses(selectedList, data, { start: range.from, end: range.to }).length
    : 0;
  const logCount = rangeValid ? logsInRange(data, selectedList, range).length : 0;
  const itemCount = formatType === 'calendar' ? futureCount : logCount;

  const applyPreset = (from: Date, to: Date) => {
    setFromStr(toInput(from));
    setToStr(toInput(to));
  };

  const today = startOfDay(new Date());
  const earliestLog = data.logs.reduce<Date | null>((acc, log) => {
    const d = startOfDay(new Date(log.timestamp));
    if (!acc || d < acc) return d;
    return acc;
  }, null);

  const calendarPresets = [
    { label: '2 weeks', from: today, to: addDays(today, 13) },
    { label: '30 days', from: today, to: addDays(today, 29) },
    { label: '90 days', from: today, to: addDays(today, 89) },
  ];
  const logPresets = [
    { label: '7 days', from: subDays(today, 6), to: today },
    { label: '30 days', from: subDays(today, 29), to: today },
    { label: '90 days', from: subDays(today, 89), to: today },
    { label: 'All time', from: earliestLog ?? subDays(today, 365), to: today },
  ];
  const presets = formatType === 'calendar' ? calendarPresets : logPresets;

  const handleExport = () => {
    if (!rangeValid || selectedList.length === 0) return;
    exportSchedule(formatType, selectedList, data, { range });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Schedule</DialogTitle>
          <DialogDescription>
            Export selected compounds for a date range to your calendar or as an administration log.
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
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date range</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">From</span>
                <input
                  type="date"
                  value={fromStr}
                  onChange={(e) => setFromStr(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">To</span>
                <input
                  type="date"
                  value={toStr}
                  min={fromStr}
                  onChange={(e) => setToStr(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => {
                const active = fromStr === toInput(preset.from) && toStr === toInput(preset.to);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.from, preset.to)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            {!rangeValid && (
              <p className="text-xs text-destructive">From date must be on or before To date.</p>
            )}
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

            <div className="max-h-40 overflow-y-auto space-y-2 rounded-xl border border-border p-3 bg-card">
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
                        {item?.isBlend && item.blendComponents?.length ? (
                          <span className="block text-xs text-muted-foreground">
                            {formatBlendBreakdown(item.blendComponents)}
                          </span>
                        ) : null}
                        {formatType === 'calendar' && item && (
                          <span className="block text-xs text-muted-foreground">
                            {item.frequency ?? 'No frequency'} · ~{dosesLeft} doses left
                          </span>
                        )}
                        {formatType === 'text' && (
                          <span className="block text-xs text-muted-foreground">
                            {logsInRange(data, [name], range).length} log(s) in range
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {formatType === 'calendar' && selectedList.length > 0 && rangeValid && (
            <p className="text-xs text-muted-foreground border border-border rounded-lg p-3 bg-muted/20">
              Downloads an <strong>.ics</strong> with {futureCount} upcoming dose(s) from{' '}
              {format(range.from, 'MMM d, yyyy')} to {format(range.to, 'MMM d, yyyy')}, capped by remaining
              inventory. Open it in Google or Apple Calendar.
            </p>
          )}

          {formatType === 'text' && selectedList.length > 0 && rangeValid && (
            <p className="text-xs text-muted-foreground border border-border rounded-lg p-3 bg-muted/20">
              Downloads a text log of {logCount} administration(s) from {format(range.from, 'MMM d, yyyy')} to{' '}
              {format(range.to, 'MMM d, yyyy')}.
            </p>
          )}

          <Button
            className="w-full"
            disabled={selectedList.length === 0 || !rangeValid || itemCount === 0}
            onClick={handleExport}
          >
            <Download size={18} className="mr-2" />
            Export {rangeValid && itemCount > 0 ? `(${itemCount})` : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import {
  isHhmm,
  periodFromTime,
  toggleOrSetPeriod,
  type DosePeriod,
} from '@/lib/dose-time';

export const TIME_OF_DAY_HELPER =
  'Used for the calendar and shot-due reminders. Not defaulted to 8:00 AM.';

export function DosePeriodField({
  period,
  time,
  onChange,
  showHelper = true,
}: {
  period?: DosePeriod | '';
  time?: string;
  onChange: (next: { period: DosePeriod; time: string }) => void;
  showHelper?: boolean;
}) {
  const resolvedPeriod = period || periodFromTime(time) || '';
  const resolvedTime = isHhmm(time) ? time : '';

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {(['AM', 'PM'] as const).map((nextPeriod) => (
          <button
            key={nextPeriod}
            type="button"
            onClick={() =>
              onChange({
                period: nextPeriod,
                time: toggleOrSetPeriod(resolvedTime || undefined, nextPeriod),
              })
            }
            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold min-h-[44px] ${
              resolvedPeriod === nextPeriod
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground'
            }`}
          >
            {nextPeriod}
          </button>
        ))}
      </div>
      <input
        type="time"
        value={resolvedTime}
        onChange={(e) => {
          const nextTime = e.target.value;
          const nextPeriod = periodFromTime(nextTime);
          if (!nextPeriod) return;
          onChange({ period: nextPeriod, time: nextTime });
        }}
        className="w-full bg-input/50 border border-border rounded-xl p-3 text-base text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
        aria-label="Time of day"
        data-testid="input-dose-time"
      />
      {showHelper ? (
        <p className="text-xs text-muted-foreground">{TIME_OF_DAY_HELPER}</p>
      ) : null}
    </div>
  );
}

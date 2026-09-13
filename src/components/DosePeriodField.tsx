import type { DosePeriod } from '@/lib/dose-time';

export function DosePeriodField({
  value,
  onChange,
}: {
  value?: DosePeriod | '';
  onChange: (period: DosePeriod) => void;
}) {
  return (
    <div className="flex gap-2">
      {(['AM', 'PM'] as const).map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => onChange(period)}
          className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold min-h-[44px] ${
            value === period
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border text-muted-foreground'
          }`}
        >
          {period}
        </button>
      ))}
    </div>
  );
}

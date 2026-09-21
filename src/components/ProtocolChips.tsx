import type { ReactNode } from "react";
import { doseVolumeMl, type DoseUnit } from "@/lib/dose-volume";
import { formatDoseTimeLabel } from "@/lib/dose-time";

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs text-muted-foreground bg-background/60 border border-border rounded-full px-3 py-1">
      {children}
    </span>
  );
}

export function ProtocolChips({
  frequency,
  dose,
  doseUnit,
  concentration,
  concentrationUnit,
  vialAmount,
  reconVolumeMl,
  dosePeriod,
  doseTime,
  className = "mt-3 flex flex-wrap items-center gap-3 relative z-10",
}: {
  frequency?: string;
  dose?: number | null;
  doseUnit: DoseUnit;
  concentration?: number | null;
  concentrationUnit?: DoseUnit;
  /** Prefer with reconVolumeMl — vial peptide total, not mg/ml. */
  vialAmount?: number | null;
  reconVolumeMl?: number | null;
  dosePeriod?: "AM" | "PM" | null;
  doseTime?: string | null;
  className?: string;
}) {
  const volume = doseVolumeMl({
    dose,
    doseUnit,
    concentration,
    concentrationUnit: concentrationUnit ?? doseUnit,
    vialAmount,
    reconVolumeMl,
  });
  const timeLabel = formatDoseTimeLabel(doseTime) ?? dosePeriod ?? null;

  if (!frequency && dose == null && !volume && !timeLabel) return null;

  return (
    <div className={className}>
      {frequency ? <Chip>{frequency}</Chip> : null}
      {dose != null ? (
        <Chip>
          {dose} {doseUnit}/dose
        </Chip>
      ) : null}
      {timeLabel ? <Chip>{timeLabel}</Chip> : null}
      {volume ? <Chip>{volume.label}</Chip> : null}
    </div>
  );
}

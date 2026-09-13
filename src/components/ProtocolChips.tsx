import type { ReactNode } from "react";
import { doseVolumeMl, type DoseUnit } from "@/lib/dose-volume";

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
  dosePeriod,
  doseTime,
  className = "mt-3 flex flex-wrap items-center gap-3 relative z-10",
}: {
  frequency?: string;
  dose?: number | null;
  doseUnit: DoseUnit;
  concentration?: number | null;
  concentrationUnit?: DoseUnit;
  dosePeriod?: "AM" | "PM" | null;
  doseTime?: string | null;
  className?: string;
}) {
  const volume = doseVolumeMl({
    dose,
    doseUnit,
    concentration,
    concentrationUnit: concentrationUnit ?? doseUnit,
  });
  const period = dosePeriod || (doseTime && Number(doseTime.slice(0, 2)) >= 12 ? "PM" : doseTime ? "AM" : null);

  if (!frequency && dose == null && !volume && !period) return null;

  return (
    <div className={className}>
      {frequency ? <Chip>{frequency}</Chip> : null}
      {dose != null ? (
        <Chip>
          {dose} {doseUnit}/dose
        </Chip>
      ) : null}
      {period ? <Chip>{period}</Chip> : null}
      {volume ? <Chip>{volume.label}</Chip> : null}
    </div>
  );
}

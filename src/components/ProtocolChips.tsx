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
  className = "mt-3 flex flex-wrap items-center gap-3 relative z-10",
}: {
  frequency?: string;
  dose?: number | null;
  doseUnit: DoseUnit;
  concentration?: number | null;
  concentrationUnit?: DoseUnit;
  className?: string;
}) {
  const volume = doseVolumeMl({
    dose,
    doseUnit,
    concentration,
    concentrationUnit: concentrationUnit ?? doseUnit,
  });

  if (!frequency && dose == null && !volume) return null;

  return (
    <div className={className}>
      {frequency ? <Chip>{frequency}</Chip> : null}
      {dose != null ? (
        <Chip>
          {dose} {doseUnit}/dose
        </Chip>
      ) : null}
      {volume ? <Chip>{volume.label}</Chip> : null}
    </div>
  );
}

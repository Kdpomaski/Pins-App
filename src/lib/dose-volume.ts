export type DoseUnit = "mg" | "mcg";

/**
 * Convert a dose between compatible mass units. Returns null when the
 * conversion is not possible.
 */
export function convertDoseUnits(
  dose: number,
  from: DoseUnit,
  to: DoseUnit,
): number | null {
  if (from === to) return dose;
  if (from === "mg" && to === "mcg") return dose * 1000;
  if (from === "mcg" && to === "mg") return dose / 1000;
  return null;
}

export function formatVolumeMl(ml: number): string {
  if (!Number.isFinite(ml) || ml <= 0) return "";
  const abs = Math.abs(ml);
  const decimals = abs >= 1 ? 2 : abs >= 0.01 ? 2 : 3;
  const text = ml.toFixed(decimals).replace(/\.?0+$/, "");
  return `${text} ml`;
}

export type DoseVolumeInput = {
  dose?: number | null;
  doseUnit: DoseUnit;
  concentration?: number | null;
  /** Unit the concentration is stored in (item.unit — e.g. mg in "10 mg/ml"). */
  concentrationUnit: DoseUnit;
};

/**
 * Draw volume from concentration + dose.
 * 0.5 mg at 10 mg/ml ? 0.05 ml.
 * Returns null when concentration or dose is missing, or units cannot convert.
 */
export function doseVolumeMl(input: DoseVolumeInput): { ml: number; label: string } | null {
  const { dose, doseUnit, concentration, concentrationUnit } = input;
  if (dose == null || !Number.isFinite(dose) || dose <= 0) return null;
  if (concentration == null || !Number.isFinite(concentration) || concentration <= 0) {
    return null;
  }

  const doseInConcUnit = convertDoseUnits(dose, doseUnit, concentrationUnit);
  if (doseInConcUnit == null) return null;

  const ml = doseInConcUnit / concentration;
  if (!Number.isFinite(ml) || ml <= 0) return null;

  return { ml, label: formatVolumeMl(ml) };
}

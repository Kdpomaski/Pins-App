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
  const text = String(Number(ml.toFixed(decimals)));
  return `${text} ml`;
}

/** U-100 syringe label: 100 units = 1 ml (0.2 ml → 20 units). */
export function formatSyringeUnits(ml: number): string {
  if (!Number.isFinite(ml) || ml <= 0) return "";
  const units = ml * 100;
  const abs = Math.abs(units);
  const decimals = abs >= 10 ? 0 : abs >= 1 ? 1 : 2;
  const text = String(Number(units.toFixed(decimals)));
  return `${text} units`;
}

/**
 * Concentration after reconstitution: vial peptide amount ÷ BAC / recon volume.
 * Example: 80 mg vial / 3 ml recon → ≈ 26.667 mg/ml.
 * Do NOT pass an already-derived mg/ml value here.
 */
export function concentrationFromRecon(
  vialAmount: number,
  reconVolumeMl: number,
): number | null {
  if (!Number.isFinite(vialAmount) || vialAmount <= 0) return null;
  if (!Number.isFinite(reconVolumeMl) || reconVolumeMl <= 0) return null;
  const conc = vialAmount / reconVolumeMl;
  if (!Number.isFinite(conc) || conc <= 0) return null;
  return conc;
}

export type DoseVolumeInput = {
  dose?: number | null;
  doseUnit: DoseUnit;
  /**
   * Already-derived concentration in mass-per-ml (e.g. 26.67 for "26.67 mg/ml").
   * Ignored when vialAmount + reconVolumeMl are both provided.
   */
  concentration?: number | null;
  /** Unit the concentration is stored in (item.unit — e.g. mg in "10 mg/ml"). */
  concentrationUnit: DoseUnit;
  /**
   * Total peptide in the vial (NOT mg/ml). Preferred with reconVolumeMl —
   * matches Recon Calculator: conc = vialAmount / reconVolumeMl.
   */
  vialAmount?: number | null;
  /** BAC water / reconstitution volume in ml. */
  reconVolumeMl?: number | null;
};

/**
 * Draw volume from concentration + dose.
 * Prefer vialAmount + reconVolumeMl (recon path) over a raw concentration that
 * users often confuse with vial totals.
 *
 * KLOW example: 4 mg dose, 80 mg vial, 3 ml recon
 *   → conc = 80/3 ≈ 26.67 mg/ml → 0.15 ml → 15 units (U-100)
 * Bad path (vial total stuffed into concentration): 4/80 = 0.05 ml → 5 units.
 */
export function doseVolumeMl(input: DoseVolumeInput): { ml: number; label: string } | null {
  const {
    dose,
    doseUnit,
    concentration,
    concentrationUnit,
    vialAmount,
    reconVolumeMl,
  } = input;
  if (dose == null || !Number.isFinite(dose) || dose <= 0) return null;

  const fromRecon = concentrationFromRecon(
    vialAmount ?? NaN,
    reconVolumeMl ?? NaN,
  );
  const effectiveConc = fromRecon ?? concentration;
  if (effectiveConc == null || !Number.isFinite(effectiveConc) || effectiveConc <= 0) {
    return null;
  }

  const doseInConcUnit = convertDoseUnits(dose, doseUnit, concentrationUnit);
  if (doseInConcUnit == null) return null;

  const ml = doseInConcUnit / effectiveConc;
  if (!Number.isFinite(ml) || ml <= 0) return null;

  return { ml, label: formatSyringeUnits(ml) };
}

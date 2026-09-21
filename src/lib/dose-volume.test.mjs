/**
 * Lightweight dose-volume / syringe-units tests (node --test, no vitest).
 * Mirrors fixed helpers in src/lib/dose-volume.ts — keep in sync.
 */
import test from "node:test";
import assert from "node:assert/strict";

function formatVolumeMl(ml) {
  if (!Number.isFinite(ml) || ml <= 0) return "";
  const abs = Math.abs(ml);
  const decimals = abs >= 1 ? 2 : abs >= 0.01 ? 2 : 3;
  const text = String(Number(ml.toFixed(decimals)));
  return `${text} ml`;
}

function formatSyringeUnits(ml) {
  if (!Number.isFinite(ml) || ml <= 0) return "";
  const units = ml * 100;
  const abs = Math.abs(units);
  const decimals = abs >= 10 ? 0 : abs >= 1 ? 1 : 2;
  const text = String(Number(units.toFixed(decimals)));
  return `${text} units`;
}

function convertDoseUnits(dose, from, to) {
  if (from === to) return dose;
  if (from === "mg" && to === "mcg") return dose * 1000;
  if (from === "mcg" && to === "mg") return dose / 1000;
  return null;
}

function concentrationFromRecon(vialAmount, reconVolumeMl) {
  if (!Number.isFinite(vialAmount) || vialAmount <= 0) return null;
  if (!Number.isFinite(reconVolumeMl) || reconVolumeMl <= 0) return null;
  const conc = vialAmount / reconVolumeMl;
  if (!Number.isFinite(conc) || conc <= 0) return null;
  return conc;
}

function doseVolumeMl(input) {
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

function blendTotalMass(components, targetUnit) {
  if (!components?.length) return null;
  let total = 0;
  for (const c of components) {
    if (c.unit === "%") return null;
    const converted = convertDoseUnits(c.amount, c.unit, targetUnit);
    if (converted == null) return null;
    total += converted;
  }
  if (!Number.isFinite(total) || total <= 0) return null;
  return total;
}

function resolveInventoryConcentration(item) {
  const volume = item.totalVolume;
  if (item.isBlend && volume != null && volume > 0) {
    const vialAmount = blendTotalMass(item.blendComponents, item.unit);
    if (vialAmount != null) {
      return concentrationFromRecon(vialAmount, volume);
    }
  }
  const conc = item.concentration;
  if (conc == null || !Number.isFinite(conc) || conc <= 0) return null;
  return conc;
}

test("formatSyringeUnits: integer units keep trailing zeros (no 40→4)", () => {
  assert.equal(formatSyringeUnits(0.4), "40 units");
  assert.equal(formatSyringeUnits(0.2), "20 units");
  assert.equal(formatSyringeUnits(0.1), "10 units");
  assert.equal(formatSyringeUnits(1), "100 units");
  assert.equal(formatSyringeUnits(0.24), "24 units");
  assert.equal(formatSyringeUnits(0.05), "5 units");
  assert.equal(formatSyringeUnits(0.005), "0.5 units");
});

test("formatVolumeMl: strips fractional zeros only", () => {
  assert.equal(formatVolumeMl(0.4), "0.4 ml");
  assert.equal(formatVolumeMl(1), "1 ml");
  assert.equal(formatVolumeMl(0.05), "0.05 ml");
});

test("doseVolumeMl: Reta 6mg @ 15mg/ml → 40 units", () => {
  const r = doseVolumeMl({
    dose: 6,
    doseUnit: "mg",
    concentration: 15,
    concentrationUnit: "mg",
  });
  assert.ok(r);
  assert.equal(r.label, "40 units");
});

test("doseVolumeMl: SS-31 5mg @ 50mg/ml → 10 units", () => {
  const r = doseVolumeMl({
    dose: 5,
    doseUnit: "mg",
    concentration: 50,
    concentrationUnit: "mg",
  });
  assert.ok(r);
  assert.equal(r.label, "10 units");
});

test("concentrationFromRecon: 80mg / 3ml → ≈26.667 mg/ml", () => {
  const conc = concentrationFromRecon(80, 3);
  assert.ok(conc);
  assert.ok(Math.abs(conc - 80 / 3) < 1e-9);
});

test("KLOW recon path: 80mg vial / 3ml / 4mg dose → 15 units (not 5)", () => {
  // Correct: conc = 80/3 → 4/(80/3)=0.15ml → 15U
  const correct = doseVolumeMl({
    dose: 4,
    doseUnit: "mg",
    concentrationUnit: "mg",
    vialAmount: 80,
    reconVolumeMl: 3,
  });
  assert.ok(correct);
  assert.equal(correct.label, "15 units");
  assert.ok(Math.abs(correct.ml - 0.15) < 1e-9);

  // Bad path regression: stuffing vial total into concentration as if mg/ml @ 1ml
  const bad = doseVolumeMl({
    dose: 4,
    doseUnit: "mg",
    concentration: 80,
    concentrationUnit: "mg",
  });
  assert.ok(bad);
  assert.equal(bad.label, "5 units");
  assert.notEqual(bad.label, correct.label);
});

test("KLOW blend resolve: stored conc=80 wrong, blend 80mg @ 3ml → 15U", () => {
  const item = {
    concentration: 80, // wrongly entered vial total as mg/ml
    totalVolume: 3,
    unit: "mg",
    isBlend: true,
    blendComponents: [
      { name: "GHK-Cu", amount: 50, unit: "mg" },
      { name: "TB-500", amount: 10, unit: "mg" },
      { name: "BPC-157", amount: 10, unit: "mg" },
      { name: "KPV", amount: 10, unit: "mg" },
    ],
  };
  const conc = resolveInventoryConcentration(item);
  assert.ok(conc);
  assert.ok(Math.abs(conc - 80 / 3) < 1e-9);

  const r = doseVolumeMl({
    dose: 4,
    doseUnit: "mg",
    concentration: conc,
    concentrationUnit: "mg",
  });
  assert.ok(r);
  assert.equal(r.label, "15 units");
});

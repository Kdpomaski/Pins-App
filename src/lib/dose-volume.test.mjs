/**
 * Lightweight dose-volume / syringe-units tests (node --test, no vitest).
 * Mirrors fixed formatters in src/lib/dose-volume.ts — keep in sync.
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

function doseVolumeMl(input) {
  const { dose, doseUnit, concentration, concentrationUnit } = input;
  if (dose == null || !Number.isFinite(dose) || dose <= 0) return null;
  if (concentration == null || !Number.isFinite(concentration) || concentration <= 0) {
    return null;
  }
  const doseInConcUnit = convertDoseUnits(dose, doseUnit, concentrationUnit);
  if (doseInConcUnit == null) return null;
  const ml = doseInConcUnit / concentration;
  if (!Number.isFinite(ml) || ml <= 0) return null;
  return { ml, label: formatSyringeUnits(ml) };
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

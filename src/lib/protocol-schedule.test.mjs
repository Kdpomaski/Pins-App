import test from 'node:test';
import assert from 'node:assert/strict';
import { syncScheduleWithInventory } from './protocol-schedule.mjs';

const vial = (overrides = {}) => ({
  name: 'BPC',
  unit: 'mg',
  frequency: 'Daily',
  defaultDose: 2,
  ...overrides,
});

test('does not invent 08:00 when inventory has no AM/PM', () => {
  const next = syncScheduleWithInventory([], [vial()]);
  assert.equal(next.length, 0);
});

test('new PM protocol creates 20:00 schedule, not 08:00', () => {
  const next = syncScheduleWithInventory([], [vial({ dosePeriod: 'PM' })]);
  assert.equal(next.length, 1);
  assert.equal(next[0].time, '20:00');
  assert.equal(next[0].active, true);
});

test('existing schedule keeps its time until AM/PM is set', () => {
  const prev = [{
    id: 's1',
    compound: 'BPC',
    dose: 2,
    unit: 'mg',
    time: '19:15',
    days: [0, 1, 2, 3, 4, 5, 6],
    active: true,
  }];
  const next = syncScheduleWithInventory(prev, [vial({ defaultDose: 3 })]);
  assert.equal(next[0].time, '19:15');
  assert.equal(next[0].dose, 3);
});

test('setting AM/PM overwrites a leftover 08:00 default', () => {
  const prev = [{
    id: 's1',
    compound: 'BPC',
    dose: 2,
    unit: 'mg',
    time: '08:00',
    days: [1],
    active: true,
  }];
  const next = syncScheduleWithInventory(prev, [vial({ dosePeriod: 'PM', doseTime: '20:00' })]);
  assert.equal(next[0].time, '20:00');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDoseTimeLabel,
  hhmmFromTimestamp,
  loggedPeriodDiffersFromSchedule,
  periodFromTime,
  plusTwelveHours,
  resolveInventoryDoseTime,
  timeFromPeriod,
  toggleOrSetPeriod,
} from './dose-time.mjs';

test('AM/PM map to schedule times without inventing a user choice', () => {
  assert.equal(timeFromPeriod('AM'), '08:00');
  assert.equal(timeFromPeriod('PM'), '20:00');
  assert.equal(periodFromTime('08:00'), 'AM');
  assert.equal(periodFromTime('20:00'), 'PM');
  assert.equal(periodFromTime(undefined), null);
});

test('inventory time prefers explicit HH:mm over period default', () => {
  assert.equal(resolveInventoryDoseTime({ dosePeriod: 'AM', doseTime: '07:30' }), '07:30');
  assert.equal(resolveInventoryDoseTime({ dosePeriod: 'PM' }), '20:00');
  assert.equal(resolveInventoryDoseTime({}), undefined);
});

test('logged AM/PM vs schedule uses local wall clock', () => {
  const morning = new Date(2026, 8, 12, 7, 45).toISOString();
  const evening = new Date(2026, 8, 12, 19, 10).toISOString();
  assert.equal(loggedPeriodDiffersFromSchedule('08:00', morning), false);
  assert.equal(loggedPeriodDiffersFromSchedule('08:00', evening), true);
  assert.equal(loggedPeriodDiffersFromSchedule('20:00', evening), false);
  assert.equal(loggedPeriodDiffersFromSchedule(undefined, evening), false);
  assert.equal(hhmmFromTimestamp(evening), '19:10');
});

test('labels and 2x/day counterpart stay AM/PM aware', () => {
  assert.equal(formatDoseTimeLabel('08:00'), '8:00 AM');
  assert.equal(formatDoseTimeLabel('20:00'), '8:00 PM');
  assert.equal(formatDoseTimeLabel('21:15'), '9:15 PM');
  assert.equal(plusTwelveHours('08:00'), '20:00');
  assert.equal(plusTwelveHours('20:00'), '08:00');
  assert.equal(plusTwelveHours('21:15'), '09:15');
});

test('AM/PM flip keeps a custom clock time instead of snapping to 08:00/20:00', () => {
  assert.equal(toggleOrSetPeriod('21:15', 'PM'), '21:15');
  assert.equal(toggleOrSetPeriod('21:15', 'AM'), '09:15');
  assert.equal(toggleOrSetPeriod('07:30', 'PM'), '19:30');
  assert.equal(toggleOrSetPeriod(undefined, 'AM'), '08:00');
  assert.equal(toggleOrSetPeriod(undefined, 'PM'), '20:00');
});

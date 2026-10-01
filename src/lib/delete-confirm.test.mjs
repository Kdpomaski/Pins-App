import test from 'node:test';
import assert from 'node:assert/strict';
import { DELETE_ACCOUNT_CONFIRMATION, isPermanentDeleteConfirmed } from './delete-confirm.mjs';

test('permanent delete requires the exact confirmation word', () => {
  assert.equal(DELETE_ACCOUNT_CONFIRMATION, 'DELETE');
  assert.equal(isPermanentDeleteConfirmed('DELETE'), true);
  assert.equal(isPermanentDeleteConfirmed('  DELETE  '), true);
  assert.equal(isPermanentDeleteConfirmed('delete'), false);
  assert.equal(isPermanentDeleteConfirmed('DEACTIVATE'), false);
  assert.equal(isPermanentDeleteConfirmed(''), false);
});

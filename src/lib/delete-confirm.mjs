/** Typed exactly before the permanent-delete button enables. */
export const DELETE_ACCOUNT_CONFIRMATION = 'DELETE';

export function isPermanentDeleteConfirmed(value) {
  return value.trim() === DELETE_ACCOUNT_CONFIRMATION;
}

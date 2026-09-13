const ADD_KEY = 'pins.openAddInventory';

export function requestOpenAddInventory(): void {
  try {
    sessionStorage.setItem(ADD_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function consumeOpenAddInventory(): boolean {
  try {
    const raw = sessionStorage.getItem(ADD_KEY);
    if (raw !== '1') return false;
    sessionStorage.removeItem(ADD_KEY);
    return true;
  } catch {
    return false;
  }
}

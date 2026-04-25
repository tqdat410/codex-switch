import { selectBestAccount } from './account-selector.js';
import { syncActiveAccount } from './swap.js';

export async function selectAccountForSwitch() {
  await syncActiveBeforeSelection();
  return selectBestAccount();
}

export async function syncActiveBeforeSelection() {
  try {
    await syncActiveAccount();
  } catch {
    // First-run and missing-auth states are handled by the normal switch path.
  }
}

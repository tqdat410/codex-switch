import { useAccount } from './swap.js';
import { readConfig } from './config.js';
import { selectBestAccount } from './account-selector.js';
import { pickAccountFromTui } from '../tui/account-picker.js';
import { syncActiveAccount } from './swap.js';

export async function launchDefault(codexArgs: string[]) {
  const config = await readConfig();
  await syncActiveBeforeSelection();
  const account = config.autoSelectAccount ? await selectBestAccount() : await pickAccountFromTui();

  if (!account) {
    return 0;
  }

  return useAccount(account, codexArgs);
}

async function syncActiveBeforeSelection() {
  try {
    await syncActiveAccount();
  } catch {
    // First-run and missing-auth states are handled by the normal launch path.
  }
}

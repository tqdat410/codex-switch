export interface WaitForAccountReadyOptions {
  name: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  intervalMs?: number;
  fetchAccountNames?: (signal?: AbortSignal) => Promise<string[]>;
  now?: () => number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

export async function waitForAccountReady(options: WaitForAccountReadyOptions) {
  const fetchAccountNames = options.fetchAccountNames ?? readAccountNames;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? delay;
  const startedAt = now();

  while (now() - startedAt < (options.timeoutMs ?? 5 * 60_000)) {
    assertNotAborted(options.signal);
    await sleep(options.intervalMs ?? 2000, options.signal);
    assertNotAborted(options.signal);
    const names = await fetchAccountNames(options.signal);
    if (names.includes(options.name)) {
      return true;
    }
  }

  return false;
}

async function readAccountNames(signal?: AbortSignal) {
  const response = await fetch('/api/accounts', {
    cache: 'no-store',
    ...(signal ? { signal } : {}),
  });
  const payload = (await response.json()) as {
    accounts?: Array<{ name?: string }>;
  };

  return (payload.accounts ?? [])
    .map((account) => account.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);
}

function delay(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function createAbortError() {
  return Object.assign(new Error('The wait operation was aborted.'), {
    name: 'AbortError',
  });
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

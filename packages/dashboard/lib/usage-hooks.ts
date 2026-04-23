'use client';

import type { AccountUsageSnapshot, UsageResponse } from '@codex-switch/shared';
import { startTransition, useEffect, useEffectEvent, useState } from 'react';

type UsageMap = Record<string, AccountUsageSnapshot | null>;

export function useUsagePolling(initialUsage: UsageMap, ttlMs: number, enabled: boolean) {
  const [usage, setUsage] = useState<UsageMap>(initialUsage);
  const [pending, setPending] = useState(false);

  const fetchUsage = useEffectEvent(async (options?: { account?: string; force?: boolean }) => {
    const params = new URLSearchParams();
    if (options?.account) {
      params.set('account', options.account);
    }
    if (options?.force) {
      params.set('refresh', '1');
    }

    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    setPending(true);

    try {
      const response = await fetch(`/api/usage${suffix}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as UsageResponse;
      startTransition(() => {
        setUsage((current) => ({
          ...current,
          ...payload.accounts,
        }));
      });
    } finally {
      setPending(false);
    }
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let timer: number | null = null;

    const schedule = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }

      if (document.visibilityState === 'visible') {
        timer = window.setInterval(() => {
          void fetchUsage();
        }, Math.max(60_000, ttlMs));
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchUsage();
      }

      schedule();
    };

    void fetchUsage();
    schedule();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (timer !== null) {
        window.clearInterval(timer);
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, ttlMs]);

  return {
    usage,
    pending,
    refresh(account?: string) {
      return fetchUsage(account ? { account, force: true } : { force: true });
    },
  };
}

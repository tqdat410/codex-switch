'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { LabAccountItem } from '../../lib/quota-lab-view-model';
import { QuotaLabFallback } from './quota-lab-fallback';
import { QuotaLabOverlay } from './quota-lab-overlay';

type WebGlState = 'checking' | 'supported' | 'unsupported';

interface QuotaLabStageProps {
  items: LabAccountItem[];
  pending: boolean;
  onRefresh: () => Promise<void> | void;
}

interface QuotaLabSceneProps {
  items: LabAccountItem[];
}

const QuotaLabScene = dynamic<QuotaLabSceneProps>(
  () => import('./quota-lab-scene').then((module) => module.QuotaLabScene),
  {
    ssr: false,
    loading: () => <QuotaLabLoading label="Loading lab scene" />,
  },
);

export function QuotaLabStage({
  items,
  pending,
  onRefresh,
}: Readonly<QuotaLabStageProps>) {
  const [webGlState, setWebGlState] = useState<WebGlState>('checking');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const activeItem = getActiveItem(items);
  const busy = pending || refreshing;

  useEffect(() => {
    setWebGlState(hasWebGlSupport() ? 'supported' : 'unsupported');
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshError(null);

    try {
      await onRefresh();
    } catch {
      setRefreshError('Refresh failed. Try again.');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section
      className="quota-lab-stage"
      aria-label="Active account quota dashboard"
      aria-busy={busy}
    >
      <header className="quota-lab-stage__header">
        <div className="quota-lab-stage__heading">
          <h1 className="quota-lab-stage__title">Active quota reactor</h1>
          <p className="quota-lab-stage__summary">
            {activeItem
              ? `${activeItem.name} / ${activeItem.plan}`
              : 'No active account'}
          </p>
        </div>
        <button
          type="button"
          className="quota-lab-stage__refresh"
          disabled={busy}
          onClick={() => {
            void handleRefresh();
          }}
        >
          {busy ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {refreshError ? (
        <p className="quota-lab-stage__error" role="alert">
          {refreshError}
        </p>
      ) : null}

      <div className="quota-lab-stage__surface">
        {webGlState === 'checking' ? (
          <QuotaLabLoading label="Checking graphics support" />
        ) : webGlState === 'supported' ? (
          <>
            <div className="quota-lab-stage__scene" aria-hidden="true">
              <QuotaLabScene items={items} />
            </div>
            <QuotaLabOverlay items={items} pending={busy} />
          </>
        ) : (
          <QuotaLabFallback items={items} />
        )}
      </div>
    </section>
  );
}

function QuotaLabLoading({ label }: Readonly<{ label: string }>) {
  return (
    <div className="quota-lab-stage__loading" role="status" aria-live="polite">
      <span className="quota-lab-stage__loading-dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

function hasWebGlSupport() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  const canvas = document.createElement('canvas');

  try {
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

function getActiveItem(items: readonly LabAccountItem[]) {
  return items.find((item) => item.isActive) ?? items[0] ?? null;
}

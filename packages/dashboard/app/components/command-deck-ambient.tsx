'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { QuotaTone } from '../../lib/command-deck-view-model';

type WebGlState = 'checking' | 'supported' | 'unsupported';

export interface CommandDeckAmbientProps {
  accountCount: number;
  activeIndex: number;
  selectedTone: QuotaTone;
}

const CommandDeckAmbientScene = dynamic<CommandDeckAmbientProps>(
  () => import('./command-deck-ambient-scene').then((module) => module.CommandDeckAmbientScene),
  { ssr: false, loading: () => <div className="command-deck-ambient__fallback" /> },
);

export function CommandDeckAmbient(props: Readonly<CommandDeckAmbientProps>) {
  const [webGlState, setWebGlState] = useState<WebGlState>('checking');

  useEffect(() => {
    setWebGlState(hasWebGlSupport() ? 'supported' : 'unsupported');
  }, []);

  return (
    <div className="command-deck-ambient" aria-hidden="true">
      {webGlState === 'supported' ? (
        <CommandDeckAmbientScene {...props} />
      ) : (
        <div className="command-deck-ambient__fallback" />
      )}
    </div>
  );
}

export function hasWebGlSupport() {
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

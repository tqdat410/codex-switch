'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { waitForAccountReady } from '../../lib/account-availability';

export function AddForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState('');
  const pollAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      pollAbortRef.current?.abort();
    };
  }, []);

  return (
    <form
      className="rounded-[24px] border border-[var(--card-border)] bg-white p-6"
      onSubmit={(event) => {
        event.preventDefault();

        startTransition(async () => {
          const response = await fetch('/api/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          });
          const payload = (await response.json().catch(() => ({}))) as { error?: string };

          if (!response.ok) {
            toast.error(payload.error ?? 'Unable to open OAuth terminal.');
            return;
          }

          setStatus('Waiting for login to complete in the new terminal...');
          pollAbortRef.current?.abort();
          const controller = new AbortController();
          pollAbortRef.current = controller;

          try {
            const isReady = await waitForAccountReady({
              name,
              signal: controller.signal,
            });

            if (isReady) {
              toast.success(`Account "${name}" is ready.`);
              router.push('/');
              router.refresh();
              return;
            }

            toast.error('Timed out waiting for OAuth completion.');
          } catch (error) {
            if (!(error instanceof Error) || error.name !== 'AbortError') {
              toast.error('Unable to confirm OAuth completion.');
            }
          } finally {
            if (pollAbortRef.current === controller) {
              pollAbortRef.current = null;
            }
          }
        });
      }}
    >
      <label className="block text-sm font-medium text-[var(--muted)]">
        Vault account name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="personal"
          className="mt-2 w-full rounded-2xl border border-[var(--card-border)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
        />
      </label>
      <p className="mt-3 text-sm text-[var(--muted)]">
        The terminal flow runs `codex login` with a temporary `CODEX_HOME`, then stores the
        resulting auth snapshot in your vault.
      </p>
      {status ? <p className="mt-4 text-sm text-[var(--accent)]">{status}</p> : null}
      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="mt-6 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {pending ? 'Opening terminal...' : 'Add account'}
      </button>
    </form>
  );
}

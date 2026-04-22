'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

export function SwitchButton({
  name,
  disabled,
  onDone,
}: Readonly<{
  name: string;
  disabled?: boolean;
  onDone: () => void;
}>) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
      onClick={() => {
        startTransition(async () => {
          const response = await fetch('/api/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          });
          const payload = (await response.json().catch(() => ({}))) as { error?: string };

          if (!response.ok) {
            toast.error(payload.error ?? 'Switch failed.');
            return;
          }

          toast.success(`Opened a new terminal for "${name}".`);
          onDone();
        });
      }}
    >
      {pending ? 'Opening...' : 'Switch'}
    </button>
  );
}

export function ReauthBanner({ account }: Readonly<{ account: string }>) {
  return (
    <div className="rounded-[18px] border border-[var(--danger)]/25 bg-[var(--danger)]/8 p-4">
      <p className="text-sm font-semibold text-[var(--foreground)]">Re-authentication required</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Run <code className="rounded bg-white px-1.5 py-0.5">cs add --name {account}</code> to
        refresh the stored OAuth snapshot for this account.
      </p>
    </div>
  );
}

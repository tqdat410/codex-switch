import Link from 'next/link';

export function AppShell({
  title,
  description,
  hideNavigation = false,
  variant = 'standard',
  children,
}: Readonly<{
  title: string;
  description: string;
  hideNavigation?: boolean;
  variant?: 'standard' | 'command';
  children: React.ReactNode;
}>) {
  const isCommand = variant === 'command';

  return (
    <main
      className={
        isCommand
          ? 'command-page mx-auto min-h-[100dvh] max-w-7xl px-4 py-6 sm:px-6 lg:px-8'
          : 'mx-auto min-h-screen max-w-6xl px-5 py-8 sm:px-8'
      }
    >
      <section
        className={
          isCommand
            ? 'command-shell'
            : 'rounded-[32px] border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-[0_30px_80px_rgba(20,29,51,0.12)] backdrop-blur sm:p-8'
        }
      >
        <div
          className={
            isCommand
              ? 'command-shell__header'
              : 'flex flex-col gap-6 border-b border-black/6 pb-6 sm:flex-row sm:items-end sm:justify-between'
          }
        >
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              codex-switch
            </p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              {description}
            </p>
          </div>
          {hideNavigation ? null : (
            <nav className="flex flex-wrap gap-3">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/history">History</NavLink>
              <NavLink href="/add">Add account</NavLink>
            </nav>
          )}
        </div>
        <div className={isCommand ? 'pt-5' : 'pt-6'}>{children}</div>
      </section>
    </main>
  );
}

function NavLink({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <Link
      href={href}
      className="rounded-full border border-[var(--card-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      {children}
    </Link>
  );
}

import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';
import './command-deck.css';
import './command-deck-strip.css';
import './command-deck-accounts.css';
import './command-deck-telemetry.css';
import './command-deck-activity.css';

export const metadata: Metadata = {
  title: 'codex-switch',
  description: 'Native Codex account switcher dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

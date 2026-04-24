'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { UsageSnapshot } from '../../lib/db';

export function CommandDeckMiniChart({
  usageSnapshot,
}: Readonly<{ usageSnapshot: UsageSnapshot }>) {
  if (usageSnapshot.requestsPerDay.length === 0 || usageSnapshot.accounts.length === 0) {
    return <div className="command-deck-empty-panel">No request history yet.</div>;
  }

  return (
    <div className="command-deck-chart" aria-label="Requests per day preview">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={usageSnapshot.requestsPerDay}>
          <XAxis dataKey="bucket" tickLine={false} axisLine={false} stroke="#8c97a8" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#8c97a8" />
          <Tooltip contentStyle={{ background: '#101827', border: '1px solid #2b3950' }} />
          {usageSnapshot.accounts.slice(0, 6).map((account, index) => (
            <Line
              key={account}
              type="monotone"
              dataKey={account}
              stroke={pickColor(index)}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const palette = ['#6ee7b7', '#93c5fd', '#facc15', '#fb7185', '#c4b5fd', '#67e8f9'];

function pickColor(index: number) {
  return palette[index % palette.length] ?? '#93c5fd';
}

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
          <XAxis dataKey="bucket" tickLine={false} axisLine={false} stroke="#738094" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#738094" />
          <Tooltip contentStyle={{ background: '#10151c', border: '1px solid #30394a', color: '#f5f7fb' }} />
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

const palette = ['#f6b73c', '#62d9a3', '#8ad7ff', '#ff6b6b', '#b8a4ff', '#f0c44c'];

function pickColor(index: number) {
  return palette[index % palette.length] ?? '#93c5fd';
}

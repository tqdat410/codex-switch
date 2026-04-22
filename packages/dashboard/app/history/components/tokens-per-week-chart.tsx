'use client';

import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function TokensPerWeekChart({
  data,
  accounts,
}: Readonly<{
  data: Array<Record<string, number | string>>;
  accounts: string[];
}>) {
  return (
    <div className="h-80 rounded-[24px] border border-[var(--card-border)] bg-white p-4">
      <h2 className="text-lg font-semibold">Tokens per week</h2>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend />
            {accounts.map((account, index) => (
              <Bar
                key={`${account}-in`}
                dataKey={`${account}_in`}
                stackId={account}
                fill={pickColor(index)}
                name={`${account} in`}
              />
            ))}
            {accounts.map((account, index) => (
              <Bar
                key={`${account}-out`}
                dataKey={`${account}_out`}
                stackId={account}
                fill={pickColor(index + 3)}
                name={`${account} out`}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const palette = ['#1f6feb', '#0f9b68', '#d68c00', '#c74141', '#6f42c1', '#14746f'];

function pickColor(index: number) {
  return palette[index % palette.length] || '#1f6feb';
}

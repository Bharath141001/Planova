import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { reportService } from '@/services/reportService';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import styles from './CumulativeFlowChart.module.scss';

const COLORS = ['#94A3B8', '#0052CC', '#FF991F', '#36B37E', '#6554C0', '#00B8D9'];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function CumulativeFlowChart({ projectKey }: { projectKey: string }) {
  const [from, setFrom] = useState(isoDaysAgo(30));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ['cfd', projectKey, from, to],
    queryFn: () => reportService.cumulativeFlow(projectKey, from, to),
    enabled: !!projectKey,
  });

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h3>Cumulative Flow</h3>
        <div className={styles.dateRow}>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className={styles.sep}>to</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      {isLoading ? (
        <LoadingSpinner />
      ) : !data || data.series.length === 0 ? (
        <EmptyState title="No flow data" description="Adjust the date range." />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data.series} margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={11} tickFormatter={(d: string) => d.slice(5)} />
            <YAxis fontSize={11} allowDecimals={false} />
            <Tooltip />
            <Legend />
            {data.statuses.map((status, i) => (
              <Area key={status} type="monotone" dataKey={status} stackId="1"
                stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.7} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

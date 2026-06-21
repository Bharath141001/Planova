import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { reportService } from '@/services/reportService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { cx } from '@/utils/cx';
import styles from './BurndownChart.module.scss';

export function BurndownChart({ sprintId }: { sprintId: string }) {
  const [mode, setMode] = useState<'points' | 'count'>('points');
  const { data, isLoading } = useQuery({
    queryKey: ['burndown', sprintId, mode],
    queryFn: () => reportService.burndown(sprintId, mode),
    enabled: !!sprintId,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!data || data.points.length === 0)
    return <EmptyState title="No burndown data" description="Start the sprint to track burndown." />;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h3>Burndown</h3>
        <div className={styles.toggleGroup}>
          {(['points', 'count'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={cx(styles.toggleBtn, mode === m && styles.active)}>
              {m === 'points' ? 'Story points' : 'Issue count'}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data.points} margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={11} tickFormatter={(d: string) => d.slice(5)} />
          <YAxis fontSize={11} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="ideal" name="Ideal" stroke="#94A3B8" strokeDasharray="4 4" dot={false} />
          <Line type="monotone" dataKey="remaining" name="Remaining" stroke="var(--color-primary)" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

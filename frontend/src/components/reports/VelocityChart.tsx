import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { reportService } from '@/services/reportService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import styles from './VelocityChart.module.scss';

export function VelocityChart({ projectKey }: { projectKey: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['velocity', projectKey],
    queryFn: () => reportService.velocity(projectKey, 7),
    enabled: !!projectKey,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!data || data.data.length === 0)
    return <EmptyState title="No velocity data" description="Complete a sprint to see velocity." />;

  const withAvg = data.data.map((d) => ({ ...d, average: data.average }));

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h3>Velocity</h3>
        <span className={styles.avg}>Rolling avg: {data.average} pts</span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={withAvg} margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={11} />
          <YAxis fontSize={11} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="committed" name="Committed" fill="#94A3B8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" name="Completed" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="average" name="Avg" stroke="var(--color-success)" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

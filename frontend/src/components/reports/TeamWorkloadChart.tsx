import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { reportService } from '@/services/reportService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Avatar } from '@/components/common/Avatar';
import { formatHours } from '@/utils/formatters';
import styles from './TeamWorkloadChart.module.scss';

export function TeamWorkloadChart({ projectKey }: { projectKey: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['workload', projectKey],
    queryFn: () => reportService.workload(projectKey),
    enabled: !!projectKey,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!data || data.length === 0)
    return <EmptyState title="No workload data" description="Assign issues to see workload." />;

  const chartData = data.map((d) => ({
    name: d.user?.displayName ?? 'Unassigned',
    issues: d.issueCount,
    points: d.storyPoints,
  }));

  return (
    <div className={styles.root}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={11} />
          <YAxis fontSize={11} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="issues" name="Open issues" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="points" name="Story points" fill="#6554C0" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Member</th><th>Issues</th><th>Points</th><th>Est.</th><th>Logged</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.user?.id ?? i}>
                <td className={styles.memberCell}><Avatar user={d.user} size="sm" />{d.user?.displayName ?? 'Unassigned'}</td>
                <td>{d.issueCount}</td>
                <td>{d.storyPoints}</td>
                <td>{formatHours(d.estimatedHours)}</td>
                <td>{formatHours(d.loggedHours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

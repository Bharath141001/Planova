import { useQuery } from '@tanstack/react-query';
import { useEpics } from '@/hooks/useProject';
import { reportService } from '@/services/reportService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import styles from './EpicReportView.module.scss';

function EpicRow({ epicId, name, color }: { epicId: string; name: string; color: string }) {
  const { data } = useQuery({
    queryKey: ['epic-report', epicId],
    queryFn: () => reportService.epicReport(epicId),
  });

  return (
    <div className={styles.epicRow}>
      <div className={styles.epicRowHeader}>
        <Badge color={color} variant="solid">{name}</Badge>
        <span className={styles.epicPct}>{data?.progress ?? 0}% complete</span>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${data?.progress ?? 0}%`, backgroundColor: color }} />
      </div>
      {data && (
        <div className={styles.statusRow}>
          {Object.entries(data.byStatus).map(([status, count]) => (
            <span key={status}>{status}: <strong>{count}</strong></span>
          ))}
          <span className={styles.total}>Total: {data.total}</span>
        </div>
      )}
    </div>
  );
}

export function EpicReportView({ projectKey }: { projectKey: string }) {
  const { data: epics = [], isLoading } = useEpics(projectKey);
  if (isLoading) return <LoadingSpinner />;
  if (epics.length === 0) return <EmptyState title="No epics" description="Create epics to track progress." />;

  return (
    <div className={styles.root}>
      {epics.map((e) => <EpicRow key={e.id} epicId={e.id} name={e.name} color={e.color} />)}
    </div>
  );
}

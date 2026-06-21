import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, PlusCircle } from 'lucide-react';
import { reportService } from '@/services/reportService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { IssueCardMini } from '@/components/board/IssueCardMini';
import { useNavigate } from 'react-router-dom';
import type { IssueSummary } from '@/types/issue.types';
import styles from './SprintReportCard.module.scss';

export function SprintReportCard({ sprintId }: { sprintId: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['sprint-report', sprintId],
    queryFn: () => reportService.sprintReport(sprintId),
    enabled: !!sprintId,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!data) return null;

  const { stats } = data;

  return (
    <div className={styles.root}>
      <div className={styles.statsGrid}>
        <StatBox label="Velocity" value={`${stats.velocity} pts`} />
        <StatBox label="Committed" value={`${stats.committedPoints} pts`} />
        <StatBox label="Completion" value={`${stats.completionRate}%`} />
        <StatBox label="Completed" value={`${stats.completedCount}/${stats.completedCount + stats.incompleteCount}`} />
      </div>
      <IssueSection title="Completed" icon={<CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />}
        issues={data.completed} onClick={(k) => navigate(`/issues/${k}`)} />
      <IssueSection title="Not completed" icon={<XCircle size={16} style={{ color: 'var(--color-text-subtle)' }} />}
        issues={data.incomplete} onClick={(k) => navigate(`/issues/${k}`)} />
      <IssueSection title="Added after start" icon={<PlusCircle size={16} style={{ color: 'var(--color-warning)' }} />}
        issues={data.addedAfterStart} onClick={(k) => navigate(`/issues/${k}`)} />
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  );
}

function IssueSection({ title, icon, issues, onClick }: {
  title: string; icon: React.ReactNode; issues: IssueSummary[]; onClick: (key: string) => void;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>{icon} {title} <span className={styles.sectionCount}>({issues.length})</span></div>
      <div className={styles.sectionBody}>
        {issues.length === 0
          ? <p className={styles.empty}>None</p>
          : issues.map((i) => <IssueCardMini key={i.id} issue={i} onClick={() => onClick(i.key)} />)
        }
      </div>
    </div>
  );
}

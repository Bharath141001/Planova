import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useIssue } from '@/hooks/useIssue';
import { useProject } from '@/hooks/useProject';
import { useIssueRoom } from '@/hooks/useSocket';
import { useProjectStore } from '@/store/projectStore';
import { IssueDetail } from '@/components/issue/IssueDetail';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import styles from './IssueDetailPage.module.scss';

export function IssueDetailPage() {
  const { issueKey } = useParams();
  const { data: issue, isLoading } = useIssue(issueKey);
  useProject(issue?.project.key);
  useIssueRoom(issueKey);
  const pushRecent = useProjectStore((s) => s.pushRecentIssue);

  useEffect(() => {
    if (issueKey) pushRecent(issueKey);
  }, [issueKey, pushRecent]);

  if (isLoading || !issue) return <LoadingSpinner label="Loading issue…" />;

  return (
    <div className={styles.page}>
      <Breadcrumb items={[
        { label: 'Projects', to: '/projects' },
        { label: issue.project.name, to: `/projects/${issue.project.key}/board` },
        { label: issue.key },
      ]} />
      <div className={styles.card}>
        <IssueDetail issueKey={issue.key} />
      </div>
    </div>
  );
}

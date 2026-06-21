import { Avatar } from '@/components/common/Avatar';
import { IssueTypeIcon } from '@/components/issue/IssueTypeIcon';
import type { IssueSummary } from '@/types/issue.types';
import styles from './IssueCardMini.module.scss';

export function IssueCardMini({ issue, onClick }: { issue: Pick<IssueSummary, 'key' | 'title' | 'type' | 'status' | 'assignee'>; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={styles.btn}>
      <IssueTypeIcon type={issue.type} />
      <span className={styles.key}>{issue.key}</span>
      <span className={styles.title}>{issue.title}</span>
      <Avatar user={issue.assignee} size="xs" className={styles.avatar} />
    </button>
  );
}

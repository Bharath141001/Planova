import { useIssueActivity } from '@/hooks/useIssue';
import { Avatar } from '@/components/common/Avatar';
import { timeAgo } from '@/utils/formatters';
import type { Activity } from '@/types/issue.types';
import styles from './IssueActivity.module.scss';

function describe(a: Activity): string {
  switch (a.type) {
    case 'CREATED': return 'created this issue';
    case 'STATUS_CHANGED': return `changed status from ${a.oldValue ?? '—'} to ${a.newValue ?? '—'}`;
    case 'ASSIGNED': return a.newValue ? 'changed the assignee' : 'unassigned this issue';
    case 'PRIORITY_CHANGED': return `changed priority from ${a.oldValue ?? '—'} to ${a.newValue ?? '—'}`;
    case 'SPRINT_CHANGED': return 'moved this issue between sprints';
    case 'COMMENTED': return 'added a comment';
    case 'ATTACHMENT_ADDED': return `attached ${a.newValue ?? 'a file'}`;
    case 'ATTACHMENT_REMOVED': return `removed attachment ${a.oldValue ?? ''}`;
    case 'LINKED': return `linked this issue (${a.newValue ?? ''})`;
    case 'WORKLOG_ADDED': return `logged ${a.newValue ?? ''}h of work`;
    default: return a.field ? `updated ${a.field}` : 'updated this issue';
  }
}

export function IssueActivity({ issueKey }: { issueKey: string }) {
  const { data: activities = [], isLoading } = useIssueActivity(issueKey);

  if (isLoading) return <p className={styles.empty}>Loading activity…</p>;
  if (activities.length === 0) return <p className={styles.empty}>No activity recorded.</p>;

  return (
    <ul className={styles.list}>
      {activities.map((a) => (
        <li key={a.id} className={styles.item}>
          <Avatar user={a.actor} size="sm" />
          <div>
            <p>
              <span className={styles.actorName}>{a.actor.displayName}</span>{' '}
              <span className={styles.action}>{describe(a)}</span>
            </p>
            <p className={styles.time}>{timeAgo(a.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

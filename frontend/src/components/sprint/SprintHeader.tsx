import { Target } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { daysRemaining, formatDate } from '@/utils/formatters';
import type { Sprint } from '@/types/sprint.types';
import styles from './SprintHeader.module.scss';

export function SprintHeader({ sprint }: { sprint: Sprint | null }) {
  if (!sprint) return null;
  const remaining = daysRemaining(sprint.endDate);

  return (
    <div className={styles.header}>
      <span className={styles.name}>{sprint.name}</span>
      {sprint.goal && (
        <Tooltip content={sprint.goal}>
          <span className={styles.goalTip}>
            <Target size={14} /> Goal
          </span>
        </Tooltip>
      )}
      <span className={styles.dates}>{formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}</span>
      {remaining != null && (
        <Badge color={remaining < 0 ? '#DE350B' : '#36B37E'} className={styles.badge}>
          {remaining < 0 ? `${Math.abs(remaining)} days overdue` : `${remaining} days remaining`}
        </Badge>
      )}
    </div>
  );
}

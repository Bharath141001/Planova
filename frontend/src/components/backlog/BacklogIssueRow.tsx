import { Draggable } from '@hello-pangea/dnd';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { IssueTypeIcon } from '@/components/issue/IssueTypeIcon';
import { IssuePriorityIcon } from '@/components/issue/IssuePriorityIcon';
import { cx } from '@/utils/cx';
import { isDoneStatus } from '@/utils/issueHelpers';
import type { IssueSummary } from '@/types/issue.types';
import styles from './BacklogIssueRow.module.scss';

interface BacklogIssueRowProps {
  issue: IssueSummary;
  index: number;
  onClick: (key: string) => void;
  selected: boolean;
  onToggleSelect: (key: string) => void;
}

export function BacklogIssueRow({ issue, index, onClick, selected, onToggleSelect }: BacklogIssueRowProps) {
  return (
    <Draggable draggableId={issue.key} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cx(styles.row, snapshot.isDragging && styles.dragging, selected && styles.selected)}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(issue.key)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${issue.key}`}
          />
          <IssueTypeIcon type={issue.type} />
          <button onClick={() => onClick(issue.key)} className={styles.mainBtn}>
            <span className={styles.key}>{issue.key}</span>
            <span className={cx(styles.title, isDoneStatus(issue.status) && styles.done)}>{issue.title}</span>
          </button>
          {issue.epic && (
            <Badge color={issue.epic.color} className={styles.epic}>{issue.epic.name}</Badge>
          )}
          <IssuePriorityIcon priority={issue.priority} />
          {issue.storyPoints != null && (
            <span className={styles.storyPoints}>{issue.storyPoints}</span>
          )}
          <Badge className={styles.status}>{issue.status}</Badge>
          <Avatar user={issue.assignee} size="sm" />
        </div>
      )}
    </Draggable>
  );
}

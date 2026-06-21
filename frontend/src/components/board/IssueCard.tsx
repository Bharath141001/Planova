import { Draggable } from '@hello-pangea/dnd';
import { MessageSquare, Paperclip, GitBranch } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { IssueTypeIcon } from '@/components/issue/IssueTypeIcon';
import { IssuePriorityIcon } from '@/components/issue/IssuePriorityIcon';
import { priorityMeta } from '@/utils/issueHelpers';
import { cx } from '@/utils/cx';
import type { IssueSummary } from '@/types/issue.types';
import styles from './IssueCard.module.scss';

interface IssueCardProps {
  issue: IssueSummary;
  index: number;
  onClick: (key: string) => void;
  selected?: boolean;
  onToggleSelect?: (key: string) => void;
}

export function IssueCard({ issue, index, onClick, selected, onToggleSelect }: IssueCardProps) {
  return (
    <Draggable draggableId={issue.key} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(issue.key)}
          className={cx(styles.card, snapshot.isDragging && styles.dragging, selected && styles.selected)}
          style={{
            ...provided.draggableProps.style,
            borderLeft: `3px solid ${priorityMeta(issue.priority).color}`,
          }}
        >
          {issue.epic && (
            <div className={styles.epic}>
              <Badge color={issue.epic.color}>{issue.epic.name}</Badge>
            </div>
          )}
          <p className={styles.title}>{issue.title}</p>

          {issue.labels.length > 0 && (
            <div className={styles.labels}>
              {issue.labels.slice(0, 3).map((l) => (
                <Badge key={l} variant="outline" color="#6B778C">{l}</Badge>
              ))}
            </div>
          )}

          <div className={styles.footer}>
            <div className={styles.footerLeft}>
              <IssueTypeIcon type={issue.type} />
              <span className={styles.issueKey}>{issue.key}</span>
              <IssuePriorityIcon priority={issue.priority} />
            </div>
            <div className={styles.footerRight}>
              {issue._count?.comments ? (
                <span className={styles.metaItem}><MessageSquare size={12} />{issue._count.comments}</span>
              ) : null}
              {issue._count?.attachments ? (
                <span className={styles.metaItem}><Paperclip size={12} />{issue._count.attachments}</span>
              ) : null}
              {issue._count?.subtasks ? (
                <span className={styles.metaItem}><GitBranch size={12} />{issue._count.subtasks}</span>
              ) : null}
              {issue.storyPoints != null && (
                <span className={styles.storyPoints}>{issue.storyPoints}</span>
              )}
              <Avatar user={issue.assignee} size="sm" />
            </div>
          </div>

          {onToggleSelect && (
            <input
              type="checkbox"
              checked={selected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggleSelect(issue.key)}
              className={styles.checkbox}
              aria-label={`Select ${issue.key}`}
            />
          )}
        </div>
      )}
    </Draggable>
  );
}

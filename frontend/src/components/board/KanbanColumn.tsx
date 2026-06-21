import { Droppable } from '@hello-pangea/dnd';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { IssueCard } from './IssueCard';
import { useBoardStore } from '@/store/boardStore';
import { cx } from '@/utils/cx';
import type { BoardColumn } from '@/types/project.types';
import type { IssueSummary } from '@/types/issue.types';
import styles from './KanbanColumn.module.scss';

interface KanbanColumnProps {
  column: BoardColumn;
  issues: IssueSummary[];
  droppableId: string;
  onCardClick: (key: string) => void;
}

export function KanbanColumn({ column, issues, droppableId, onCardClick }: KanbanColumnProps) {
  const { collapsedColumns, toggleColumn, selectedIssueKeys, toggleSelected } = useBoardStore();
  const collapsed = collapsedColumns.includes(column.status);
  const overLimit = column.wipLimit != null && issues.length > column.wipLimit;

  if (collapsed) {
    return (
      <button onClick={() => toggleColumn(column.status)} className={styles.collapsed}>
        <ChevronRight size={16} className={styles.collapsedIcon} />
        <span className={styles.collapsedLabel}>{column.name}</span>
        <span className={styles.collapsedCount}>{issues.length}</span>
      </button>
    );
  }

  return (
    <div className={styles.column}>
      <div className={styles.colHeader}>
        <div className={styles.colHeaderLeft}>
          <button onClick={() => toggleColumn(column.status)} className={styles.colToggleBtn} aria-label="Collapse column">
            <ChevronDown size={16} />
          </button>
          <span className={styles.colName} style={{ color: column.color }}>{column.name}</span>
          <span className={cx(styles.colCount, overLimit && styles.overLimit)}>
            {issues.length}{column.wipLimit != null && ` / ${column.wipLimit}`}
          </span>
        </div>
        {overLimit && (
          <span title="WIP limit exceeded">
            <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} />
          </span>
        )}
      </div>

      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cx(styles.droppable, snapshot.isDraggingOver && styles.dragOver)}
          >
            {issues.map((issue, index) => (
              <IssueCard
                key={issue.key}
                issue={issue}
                index={index}
                onClick={onCardClick}
                selected={selectedIssueKeys.includes(issue.key)}
                onToggleSelect={toggleSelected}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Play, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { BacklogIssueRow } from './BacklogIssueRow';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/common/Badge';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { PermissionGate } from '@/components/common/PermissionGate';
import { useUiStore } from '@/store/uiStore';
import { useBoardStore } from '@/store/boardStore';
import { daysRemaining } from '@/utils/formatters';
import { cx } from '@/utils/cx';
import type { BacklogGroup } from '@/hooks/useBacklog';
import styles from './SprintSection.module.scss';

interface SprintSectionProps {
  group: BacklogGroup;
  onCardClick: (key: string) => void;
  onStart?: () => void;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SprintSection({ group, onCardClick, onStart, onComplete, onEdit, onDelete }: SprintSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const openCreateIssue = useUiStore((s) => s.openCreateIssue);
  const { selectedIssueKeys, toggleSelected } = useBoardStore();
  const { sprint, issues, points } = group;
  const isBacklog = sprint === null;
  const remaining = sprint?.endDate ? daysRemaining(sprint.endDate) : null;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerLeft}>
          <button onClick={() => setCollapsed((c) => !c)} className={styles.toggleBtn}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            {isBacklog ? 'Backlog' : sprint!.name}
          </button>
          {sprint?.status === 'ACTIVE' && <Badge color="#36B37E" variant="solid">Active</Badge>}
          {sprint?.goal && <span className={styles.sprintGoal}>— {sprint.goal}</span>}
          {remaining != null && (
            <Badge color={remaining < 0 ? '#DE350B' : '#6B778C'}>
              {remaining < 0 ? `${Math.abs(remaining)}d overdue` : `${remaining}d left`}
            </Badge>
          )}
        </div>

        <div className={styles.headerRight}>
          <Badge>{issues.length} issues</Badge>
          <Badge color="#0052CC">{points} pts</Badge>
          {!isBacklog && sprint!.status === 'PLANNED' && onStart && (
            <PermissionGate permission="sprint:start">
              <Button size="sm" onClick={onStart} disabled={issues.length === 0}>
                <Play size={14} /> Start sprint
              </Button>
            </PermissionGate>
          )}
          {!isBacklog && sprint!.status === 'ACTIVE' && onComplete && (
            <PermissionGate permission="sprint:complete">
              <Button size="sm" variant="secondary" onClick={onComplete}>
                <CheckCircle2 size={14} /> Complete sprint
              </Button>
            </PermissionGate>
          )}
          {!isBacklog && (
            <PermissionGate permission="sprint:edit">
              <Dropdown
                align="right"
                trigger={
                  <button className={styles.menuBtn} aria-label="Sprint actions">
                    <MoreHorizontal size={16} />
                  </button>
                }
              >
                {(close) => (
                  <>
                    <DropdownItem onClick={() => { close(); onEdit?.(); }}>
                      <Pencil size={16} /> Edit sprint
                    </DropdownItem>
                    <DropdownItem style={{ color: 'var(--color-danger)' }} onClick={() => { close(); onDelete?.(); }}>
                      <Trash2 size={16} /> Delete sprint
                    </DropdownItem>
                  </>
                )}
              </Dropdown>
            </PermissionGate>
          )}
        </div>
      </div>

      {!collapsed && (
        <Droppable droppableId={sprint?.id ?? 'backlog'}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cx(styles.droppable, snapshot.isDraggingOver && styles.dragOver)}
            >
              {issues.length === 0 && (
                <p className={styles.emptyMsg}>
                  {isBacklog ? 'Your backlog is empty.' : 'Drag issues here to plan this sprint.'}
                </p>
              )}
              {issues.map((issue, index) => (
                <BacklogIssueRow
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
      )}

      <PermissionGate permission="issue:create">
        <button onClick={() => openCreateIssue({ sprintId: sprint?.id ?? null })} className={styles.createBtn}>
          <Plus size={16} /> Create issue
        </button>
      </PermissionGate>
    </div>
  );
}

import { useMemo } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { useProjectStore } from '@/store/projectStore';
import { useBoardStore } from '@/store/boardStore';
import { useBoardIssues, useRankIssue } from '@/hooks/useBoard';
import { useProjectMembers, useEpics } from '@/hooks/useProject';
import { KanbanColumn } from './KanbanColumn';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import type { IssueSummary } from '@/types/issue.types';
import styles from './KanbanBoard.module.scss';

interface KanbanBoardProps {
  projectKey: string;
  onCardClick: (key: string) => void;
}

interface Lane {
  id: string;
  label: string;
}

export function KanbanBoard({ projectKey, onCardClick }: KanbanBoardProps) {
  const columns = useProjectStore((s) => s.currentProject?.columns ?? []);
  const { filters, swimlane } = useBoardStore();
  const { data: issues = [], isLoading } = useBoardIssues(projectKey, filters);
  const { data: members = [] } = useProjectMembers(projectKey);
  const { data: epics = [] } = useEpics(projectKey);
  const rank = useRankIssue(projectKey, filters);

  const lanes = useMemo<Lane[]>(() => {
    if (swimlane === 'assignee') {
      return [...members.map((m) => ({ id: m.userId, label: m.user.displayName })), { id: 'unassigned', label: 'Unassigned' }];
    }
    if (swimlane === 'epic') {
      return [...epics.map((e) => ({ id: e.id, label: e.name })), { id: 'none', label: 'No epic' }];
    }
    return [{ id: 'all', label: '' }];
  }, [swimlane, members, epics]);

  const issuesFor = (laneId: string, status: string): IssueSummary[] => {
    return issues.filter((i) => i.status === status).filter((i) => {
      if (swimlane === 'assignee') return (i.assigneeId ?? 'unassigned') === laneId;
      if (swimlane === 'epic') return (i.epicId ?? 'none') === laneId;
      return true;
    });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const destStatus = destination.droppableId.split('::').pop() as string;
    const laneId = destination.droppableId.includes('::') ? destination.droppableId.split('::')[0] : 'all';

    const destList = issuesFor(laneId, destStatus).filter((i) => i.key !== draggableId);
    const beforeKey = destination.index > 0 ? destList[destination.index - 1]?.key ?? null : null;
    const afterKey = destList[destination.index]?.key ?? null;

    rank.mutate({ issueKey: draggableId, payload: { beforeKey, afterKey, status: destStatus } });
  };

  if (isLoading) return <LoadingSpinner label="Loading board…" />;
  if (columns.length === 0) {
    return <EmptyState title="No columns configured" description="Add columns in project settings." />;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={styles.root}>
        {lanes.map((lane) => (
          <div key={lane.id}>
            {swimlane !== 'none' && <p className={styles.laneLabel}>{lane.label}</p>}
            <div className={styles.columns}>
              {columns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  issues={issuesFor(lane.id, col.status)}
                  droppableId={swimlane === 'none' ? col.status : `${lane.id}::${col.status}`}
                  onCardClick={onCardClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

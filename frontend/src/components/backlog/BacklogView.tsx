import { useState } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { Plus, X } from 'lucide-react';
import { useBacklog } from '@/hooks/useBacklog';
import { useBoardStore } from '@/store/boardStore';
import { useBoardIssues, useRankIssue, useBulkUpdate } from '@/hooks/useBoard';
import { useSprintMutations } from '@/hooks/useSprint';
import { SprintSection } from './SprintSection';
import { BacklogFilters } from './BacklogFilters';
import { SprintCreateModal } from '@/components/sprint/SprintCreateModal';
import { SprintEditModal } from '@/components/sprint/SprintEditModal';
import { SprintStartModal } from '@/components/sprint/SprintStartModal';
import { SprintCompleteModal } from '@/components/sprint/SprintCompleteModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PermissionGate } from '@/components/common/PermissionGate';
import type { Sprint, SprintWithIssues } from '@/types/sprint.types';
import styles from './BacklogView.module.scss';

export function BacklogView({ projectKey, onCardClick }: { projectKey: string; onCardClick: (key: string) => void }) {
  const { filters, selectedIssueKeys, clearSelected } = useBoardStore();
  const { groups, isLoading } = useBacklog(projectKey, filters);
  void useBoardIssues(projectKey, filters);
  const rank = useRankIssue(projectKey, filters);
  const bulk = useBulkUpdate(projectKey);
  const { remove } = useSprintMutations(projectKey);

  const [createOpen, setCreateOpen] = useState(false);
  const [startSprint, setStartSprint] = useState<{ sprint: Sprint; points: number } | null>(null);
  const [completeSprint, setCompleteSprint] = useState<SprintWithIssues | null>(null);
  const [editSprint, setEditSprint] = useState<Sprint | null>(null);
  const [deleteSprint, setDeleteSprint] = useState<Sprint | null>(null);
  const [bulkSprintId, setBulkSprintId] = useState('');

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const destGroup = groups.find((g) => (g.sprint?.id ?? 'backlog') === destination.droppableId);
    const destList = (destGroup?.issues ?? []).filter((i) => i.key !== draggableId);
    const beforeKey = destination.index > 0 ? destList[destination.index - 1]?.key ?? null : null;
    const afterKey = destList[destination.index]?.key ?? null;
    const sprintId = destination.droppableId === 'backlog' ? null : destination.droppableId;

    rank.mutate({ issueKey: draggableId, payload: { beforeKey, afterKey, sprintId } });
  };

  if (isLoading) return <LoadingSpinner label="Loading backlog…" />;

  return (
    <>
      <div className={styles.topBar}>
        <BacklogFilters />
        <PermissionGate permission="sprint:create">
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Create sprint
          </Button>
        </PermissionGate>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        {groups.map((group) => (
          <SprintSection
            key={group.sprint?.id ?? 'backlog'}
            group={group}
            onCardClick={onCardClick}
            onStart={group.sprint ? () => setStartSprint({ sprint: group.sprint!, points: group.points }) : undefined}
            onComplete={group.sprint ? () => setCompleteSprint({ ...group.sprint!, issues: group.issues }) : undefined}
            onEdit={group.sprint ? () => setEditSprint(group.sprint!) : undefined}
            onDelete={group.sprint ? () => setDeleteSprint(group.sprint!) : undefined}
          />
        ))}
      </DragDropContext>

      {selectedIssueKeys.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkLabel}>{selectedIssueKeys.length} selected</span>
          <Select value={bulkSprintId} onChange={(e) => setBulkSprintId(e.target.value)} className={styles.bulkSelect}>
            <option value="">Move to…</option>
            <option value="backlog">Backlog</option>
            {groups.filter((g) => g.sprint).map((g) => (
              <option key={g.sprint!.id} value={g.sprint!.id}>{g.sprint!.name}</option>
            ))}
          </Select>
          <Button
            size="sm"
            disabled={!bulkSprintId}
            onClick={() => bulk.mutate(
              { keys: selectedIssueKeys, data: { sprintId: bulkSprintId === 'backlog' ? null : bulkSprintId } },
              { onSuccess: () => { clearSelected(); setBulkSprintId(''); } }
            )}
          >
            Apply
          </Button>
          <button onClick={clearSelected} aria-label="Clear selection" className={styles.bulkCloseBtn}>
            <X size={16} />
          </button>
        </div>
      )}

      <SprintCreateModal projectKey={projectKey} open={createOpen} onClose={() => setCreateOpen(false)} />
      <SprintStartModal projectKey={projectKey} sprint={startSprint?.sprint ?? null} totalPoints={startSprint?.points ?? 0} onClose={() => setStartSprint(null)} />
      <SprintCompleteModal projectKey={projectKey} sprint={completeSprint} onClose={() => setCompleteSprint(null)} />
      <SprintEditModal projectKey={projectKey} sprint={editSprint} onClose={() => setEditSprint(null)} />
      <ConfirmDialog
        open={!!deleteSprint}
        title={`Delete ${deleteSprint?.name}?`}
        message="Issues in this sprint will be moved back to the backlog."
        destructive
        confirmLabel="Delete sprint"
        loading={remove.isPending}
        onCancel={() => setDeleteSprint(null)}
        onConfirm={() => deleteSprint && remove.mutate(deleteSprint.id, { onSuccess: () => setDeleteSprint(null) })}
      />
    </>
  );
}

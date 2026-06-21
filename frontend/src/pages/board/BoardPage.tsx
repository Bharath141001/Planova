import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '@/hooks/useProject';
import { useSprints } from '@/hooks/useSprint';
import { useProjectRoom } from '@/hooks/useSocket';
import { useBoardLiveUpdates } from '@/hooks/useBoardLive';
import { PageHeader } from '@/components/common/PageHeader';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { BoardFilters } from '@/components/board/BoardFilters';
import { SprintHeader } from '@/components/sprint/SprintHeader';
import { IssuePanel } from '@/components/issue/IssuePanel';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function BoardPage() {
  const { projectKey } = useParams();
  const { data: project, isLoading } = useProject(projectKey);
  const { data: sprints = [] } = useSprints(projectKey);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  useProjectRoom(project?.id);
  useBoardLiveUpdates(projectKey);

  if (isLoading || !project) return <LoadingSpinner label="Loading project…" />;

  const activeSprint = sprints.find((s) => s.status === 'ACTIVE') ?? null;

  return (
    <div style={{ padding: 'var(--spacing-md)' }}>
      <PageHeader title="Board" breadcrumbs={[
        { label: 'Projects', to: '/projects' },
        { label: project.name, to: `/projects/${project.key}/board` },
        { label: 'Board' },
      ]} />
      {activeSprint && <SprintHeader sprint={activeSprint} />}
      <BoardFilters />
      <KanbanBoard projectKey={project.key} onCardClick={setSelectedIssue} />
      <IssuePanel issueKey={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </div>
  );
}

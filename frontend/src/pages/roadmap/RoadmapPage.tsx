import { useParams } from 'react-router-dom';
import { useProject } from '@/hooks/useProject';
import { PageHeader } from '@/components/common/PageHeader';
import { RoadmapView } from '@/components/roadmap/RoadmapView';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function RoadmapPage() {
  const { projectKey } = useParams();
  const { data: project, isLoading } = useProject(projectKey);

  if (isLoading || !project) return <LoadingSpinner label="Loading roadmap…" />;

  return (
    <div style={{ padding: 'var(--spacing-md)' }}>
      <PageHeader title="Roadmap" subtitle="Plan epics across time" breadcrumbs={[
        { label: 'Projects', to: '/projects' },
        { label: project.name, to: `/projects/${project.key}/board` },
        { label: 'Roadmap' },
      ]} />
      <RoadmapView projectKey={project.key} />
    </div>
  );
}

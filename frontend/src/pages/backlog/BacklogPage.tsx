import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProject } from '@/hooks/useProject';
import { useProjectRoom } from '@/hooks/useSocket';
import { useBoardLiveUpdates } from '@/hooks/useBoardLive';
import { PageHeader } from '@/components/common/PageHeader';
import { BacklogView } from '@/components/backlog/BacklogView';
import { IssuePanel } from '@/components/issue/IssuePanel';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { issueService } from '@/services/issueService';

export function BacklogPage() {
  const { projectKey } = useParams();
  const { data: project, isLoading } = useProject(projectKey);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useProjectRoom(project?.id);
  useBoardLiveUpdates(projectKey);

  const handleExport = async () => {
    if (!project) return;
    setExporting(true);
    try {
      await issueService.exportCsv(project.key);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (isLoading || !project) return <LoadingSpinner label="Loading backlog…" />;

  return (
    <div style={{ padding: 'var(--spacing-md)' }}>
      <PageHeader
        title="Backlog"
        breadcrumbs={[
          { label: 'Projects', to: '/projects' },
          { label: project.name, to: `/projects/${project.key}/board` },
          { label: 'Backlog' },
        ]}
        actions={
          <Button size="sm" variant="secondary" onClick={handleExport} loading={exporting}>
            <Download size={14} />
            Export CSV
          </Button>
        }
      />
      <BacklogView projectKey={project.key} onCardClick={setSelectedIssue} />
      <IssuePanel issueKey={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </div>
  );
}

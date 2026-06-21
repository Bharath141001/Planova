import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Map as MapIcon } from 'lucide-react';
import { useEpics } from '@/hooks/useProject';
import { reportService } from '@/services/reportService';
import { issueService } from '@/services/issueService';
import { RoadmapTimeline } from './RoadmapTimeline';
import { RoadmapFilters, type RoadmapZoom } from './RoadmapFilters';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { IssueCardMini } from '@/components/board/IssueCardMini';
import { Badge } from '@/components/common/Badge';
import { formatDate } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';
import type { Epic } from '@/types/sprint.types';
import styles from './RoadmapView.module.scss';

export function RoadmapView({ projectKey }: { projectKey: string }) {
  const navigate = useNavigate();
  const { data: epics = [], isLoading } = useEpics(projectKey);
  const [zoom, setZoom] = useState<RoadmapZoom>('months');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Epic | null>(null);

  const filtered = status ? epics.filter((e) => e.status === status) : epics;

  if (isLoading) return <LoadingSpinner label="Loading roadmap…" />;

  return (
    <div className={styles.root}>
      <RoadmapFilters zoom={zoom} onZoomChange={setZoom} status={status} onStatusChange={setStatus} />
      {filtered.length === 0 ? (
        <EmptyState icon={MapIcon} title="No epics to plan" description="Create epics with start and end dates to see them here." />
      ) : (
        <div className={styles.layout}>
          <div className={styles.gutter}>
            <div className={styles.gutterHeader} />
            {filtered.map((e) => (
              <div key={e.id} className={styles.gutterRow}>
                <span className={styles.epicDot} style={{ backgroundColor: e.color }} />
                <span className={styles.epicName}>{e.name}</span>
              </div>
            ))}
          </div>
          <div className={styles.timelineWrap}>
            <RoadmapTimeline epics={filtered} zoom={zoom} onEpicClick={setSelected} />
          </div>
        </div>
      )}
      <EpicDetailPanel epic={selected} onClose={() => setSelected(null)} onIssueClick={(k) => navigate(`/issues/${k}`)} />
    </div>
  );
}

function EpicDetailPanel({ epic, onClose, onIssueClick }: { epic: Epic | null; onClose: () => void; onIssueClick: (key: string) => void }) {
  const { data: report } = useQuery({
    queryKey: ['epic-report', epic?.id],
    queryFn: () => reportService.epicReport(epic!.id),
    enabled: !!epic,
  });
  const { data: issues = [] } = useQuery({
    queryKey: ['epic-issues', epic?.id],
    queryFn: () => issueService.search({ epicId: epic!.id }),
    enabled: !!epic,
  });

  if (!epic) return null;

  return (
    <Modal open={!!epic} onClose={onClose} title={epic.name} size="md">
      <div className={styles.detail}>
        <div className={styles.detailMeta}>
          <Badge color={epic.color} variant="solid">{epic.status}</Badge>
          <span>{formatDate(epic.startDate)} → {formatDate(epic.endDate)}</span>
          {report && <span className={styles.detailPct}>{report.progress}% complete</span>}
        </div>
        {epic.description && <p className={styles.description}>{epic.description}</p>}
        <div className={styles.issueSection}>
          <h4>Issues ({issues.length})</h4>
          {issues.length === 0
            ? <p className={styles.noIssues}>No issues in this epic yet.</p>
            : issues.map((i) => <IssueCardMini key={i.id} issue={i} onClick={() => onIssueClick(i.key)} />)
          }
        </div>
      </div>
    </Modal>
  );
}

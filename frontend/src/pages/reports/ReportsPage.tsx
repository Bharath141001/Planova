import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '@/hooks/useProject';
import { useSprints } from '@/hooks/useSprint';
import { PageHeader } from '@/components/common/PageHeader';
import { Select } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { BurndownChart } from '@/components/reports/BurndownChart';
import { VelocityChart } from '@/components/reports/VelocityChart';
import { CumulativeFlowChart } from '@/components/reports/CumulativeFlowChart';
import { SprintReportCard } from '@/components/reports/SprintReportCard';
import { EpicReportView } from '@/components/reports/EpicReportView';
import { TeamWorkloadChart } from '@/components/reports/TeamWorkloadChart';
import { cx } from '@/utils/cx';
import styles from './ReportsPage.module.scss';

type ReportTab = 'burndown' | 'velocity' | 'sprint' | 'cfd' | 'epic' | 'workload';

const TABS: { id: ReportTab; label: string; needsSprint?: boolean }[] = [
  { id: 'burndown', label: 'Burndown', needsSprint: true },
  { id: 'velocity', label: 'Velocity' },
  { id: 'sprint', label: 'Sprint Report', needsSprint: true },
  { id: 'cfd', label: 'Cumulative Flow' },
  { id: 'epic', label: 'Epic Report' },
  { id: 'workload', label: 'Team Workload' },
];

export function ReportsPage() {
  const { projectKey } = useParams();
  const { data: project, isLoading } = useProject(projectKey);
  const { data: sprints = [] } = useSprints(projectKey);
  const [tab, setTab] = useState<ReportTab>('burndown');
  const [sprintId, setSprintId] = useState('');

  const selectableSprints = sprints.filter((s) => s.status !== 'PLANNED');
  const effectiveSprintId = sprintId || sprints.find((s) => s.status === 'ACTIVE')?.id || selectableSprints[0]?.id || '';

  if (isLoading || !project) return <LoadingSpinner label="Loading reports…" />;

  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <div className={styles.page}>
      <PageHeader title="Reports" breadcrumbs={[
        { label: 'Projects', to: '/projects' },
        { label: project.name, to: `/projects/${project.key}/board` },
        { label: 'Reports' },
      ]} />
      <div className={styles.tabBar}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cx(styles.tab, tab === t.id && styles.active)}>
            {t.label}
          </button>
        ))}
        {activeTab.needsSprint && (
          <div className={styles.sprintSelect}>
            <Select value={effectiveSprintId} onChange={(e) => setSprintId(e.target.value)}>
              {selectableSprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
        )}
      </div>
      <div className={styles.panel}>
        {tab === 'burndown' && (effectiveSprintId ? <BurndownChart sprintId={effectiveSprintId} /> : <NoSprint />)}
        {tab === 'velocity' && <VelocityChart projectKey={project.key} />}
        {tab === 'sprint' && (effectiveSprintId ? <SprintReportCard sprintId={effectiveSprintId} /> : <NoSprint />)}
        {tab === 'cfd' && <CumulativeFlowChart projectKey={project.key} />}
        {tab === 'epic' && <EpicReportView projectKey={project.key} />}
        {tab === 'workload' && <TeamWorkloadChart projectKey={project.key} />}
      </div>
    </div>
  );
}

function NoSprint() {
  return <p className={styles.noSprint}>No started or completed sprint available.</p>;
}

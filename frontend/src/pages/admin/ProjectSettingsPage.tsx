import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '@/hooks/useProject';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProjectSettings } from '@/components/admin/ProjectSettings';
import { MemberManagement } from '@/components/admin/MemberManagement';
import { WorkflowEditor } from '@/components/admin/WorkflowEditor';
import { CustomFieldManager } from '@/components/admin/CustomFieldManager';
import { RolePermissions } from '@/components/admin/RolePermissions';
import { cx } from '@/utils/cx';
import styles from './ProjectSettingsPage.module.scss';

type Tab = 'general' | 'members' | 'workflow' | 'fields' | 'permissions';

const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'members', label: 'Members' },
  { id: 'workflow', label: 'Board & Workflow' },
  { id: 'fields', label: 'Custom Fields' },
  { id: 'permissions', label: 'Permissions' },
];

export function ProjectSettingsPage() {
  const { projectKey } = useParams();
  const { data: project, isLoading } = useProject(projectKey);
  const [tab, setTab] = useState<Tab>('general');

  if (isLoading || !project) return <LoadingSpinner label="Loading settings…" />;

  return (
    <div className={styles.page}>
      <PageHeader title="Project settings" breadcrumbs={[
        { label: 'Projects', to: '/projects' },
        { label: project.name, to: `/projects/${project.key}/board` },
        { label: 'Settings' },
      ]} />
      <div className={styles.layout}>
        <nav className={styles.nav}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cx(styles.navBtn, tab === t.id && styles.active)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className={styles.panel}>
          {tab === 'general' && <ProjectSettings project={project} />}
          {tab === 'members' && <MemberManagement projectKey={project.key} />}
          {tab === 'workflow' && <WorkflowEditor project={project} />}
          {tab === 'fields' && <CustomFieldManager projectKey={project.key} />}
          {tab === 'permissions' && <RolePermissions />}
        </div>
      </div>
    </div>
  );
}

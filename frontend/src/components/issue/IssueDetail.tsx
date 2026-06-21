import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Copy, Trash2, Share2, Clock, ExternalLink, Pencil, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useIssue, useUpdateIssue, useDeleteIssue } from '@/hooks/useIssue';
import { useLabels } from '@/hooks/useProject';
import { EpicSelect } from './EpicSelect';
import { useSprints } from '@/hooks/useSprint';
import { issueService } from '@/services/issueService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label } from '@/components/ui/Input';
import { Badge } from '@/components/common/Badge';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGate } from '@/components/common/PermissionGate';
import { RichTextEditor, RichTextView } from '@/components/common/RichTextEditor';
import { Avatar } from '@/components/common/Avatar';
import { IssueTypeIcon } from './IssueTypeIcon';
import { IssuePriorityIcon } from './IssuePriorityIcon';
import { IssueStatusSelect } from './IssueStatusSelect';
import { IssueAssignee } from './IssueAssignee';
import { IssueWatcher } from './IssueWatcher';
import { IssueComments } from './IssueComments';
import { IssueActivity } from './IssueActivity';
import { IssueAttachments } from './IssueAttachments';
import { IssueLinker } from './IssueLinker';
import { DependencyGraph } from './DependencyGraph';
import { LogWorkModal } from './LogWorkModal';
import { PRIORITIES, STORY_POINT_OPTIONS } from '@/utils/constants';
import { formatDate, formatHours } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import { cx } from '@/utils/cx';
import type { IssuePriority } from '@/types/common.types';
import styles from './IssueDetail.module.scss';

type Tab = 'comments' | 'activity' | 'attachments' | 'graph';

interface IssueDetailProps {
  issueKey: string;
  onClose?: () => void;
  showFullPageLink?: boolean;
}

export function IssueDetail({ issueKey, onClose, showFullPageLink }: IssueDetailProps) {
  const navigate = useNavigate();
  const { data: issue, isLoading } = useIssue(issueKey);
  const update = useUpdateIssue(issueKey, issue?.project.key);
  const remove = useDeleteIssue(issue?.project.key ?? '');
  const { data: sprints = [] } = useSprints(issue?.project.key);
  const { data: projectLabels = [] } = useLabels(issue?.project.key);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [tab, setTab] = useState<Tab>('comments');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [logWorkOpen, setLogWorkOpen] = useState(false);

  if (isLoading || !issue) return <LoadingSpinner label="Loading issue…" />;

  const isWatching = issue.watchers.some((w) => w.userId === currentUserId);

  const saveTitle = () => {
    if (titleDraft.trim() && titleDraft !== issue.title) update.mutate({ title: titleDraft });
    setEditingTitle(false);
  };
  const saveDesc = () => {
    update.mutate({ description: descDraft });
    setEditingDesc(false);
  };

  const shareLink = () => {
    void navigator.clipboard.writeText(`${window.location.origin}/issues/${issue.key}`);
    toast.success('Issue link copied');
  };

  const progress = issue.estimatedHours ? Math.min(100, (issue.loggedHours / issue.estimatedHours) * 100) : 0;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <IssueTypeIcon type={issue.type} />
          <span className={styles.issueKey}>{issue.key}</span>
        </div>
        <div className={styles.headerRight}>
          <IssueWatcher issueKey={issue.key} isWatching={isWatching} watcherCount={issue.watchers.length} />
          {showFullPageLink && (
            <Button variant="ghost" size="icon" onClick={() => navigate(`/issues/${issue.key}`)} aria-label="Open full page">
              <ExternalLink size={16} />
            </Button>
          )}
          <Dropdown
            align="right"
            trigger={<Button variant="ghost" size="icon" aria-label="Issue actions"><MoreHorizontal size={16} /></Button>}
          >
            {(close) => (
              <>
                <PermissionGate permission="issue:create">
                  <DropdownItem onClick={() => { close(); issueService.clone(issue.key).then((c) => { toast.success(`Cloned to ${c.key}`); navigate(`/issues/${c.key}`); }); }}>
                    <Copy size={16} /> Clone
                  </DropdownItem>
                </PermissionGate>
                <DropdownItem onClick={() => { close(); shareLink(); }}>
                  <Share2 size={16} /> Share link
                </DropdownItem>
                <PermissionGate permission="issue:delete">
                  <DropdownItem style={{ color: 'var(--color-danger)' }} onClick={() => { close(); setConfirmDelete(true); }}>
                    <Trash2 size={16} /> Delete
                  </DropdownItem>
                </PermissionGate>
              </>
            )}
          </Dropdown>
          {onClose && <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">✕</Button>}
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.main}>
          {editingTitle ? (
            <div className={styles.titleRow}>
              <Input value={titleDraft} autoFocus onChange={(e) => setTitleDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveTitle()} style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }} />
              <Button size="icon" onClick={saveTitle} aria-label="Save title"><Check size={16} /></Button>
            </div>
          ) : (
            <PermissionGate permission="issue:edit" fallback={<h1 className={styles.titleStatic}>{issue.title}</h1>}>
              <h1 className={styles.title} onClick={() => { setTitleDraft(issue.title); setEditingTitle(true); }}>
                {issue.title}
                <Pencil size={16} className={styles.titleEdit} />
              </h1>
            </PermissionGate>
          )}

          <div>
            <div className={styles.descHeader}>
              <Label style={{ margin: 0 }}>Description</Label>
              <PermissionGate permission="issue:edit">
                {!editingDesc && (
                  <button onClick={() => { setDescDraft(issue.description ?? ''); setEditingDesc(true); }} className={styles.descEditBtn}>
                    Edit
                  </button>
                )}
              </PermissionGate>
            </div>
            {editingDesc ? (
              <div>
                <RichTextEditor value={descDraft} onChange={setDescDraft} />
                <div className={styles.descActions}>
                  <Button size="sm" onClick={saveDesc} loading={update.isPending}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <RichTextView html={issue.description} />
            )}
          </div>

          {issue.subtasks.length > 0 && (
            <div>
              <Label>Subtasks</Label>
              <ul className={styles.subtaskList}>
                {issue.subtasks.map((st) => (
                  <li key={st.id} className={styles.subtaskItem} onClick={() => navigate(`/issues/${st.key}`)}>
                    <IssueTypeIcon type={st.type} />
                    <span className={styles.subtaskKey}>{st.key}</span>
                    <span className={styles.subtaskTitle}>{st.title}</span>
                    <Badge style={{ marginLeft: 'auto' }}>{st.status}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <IssueLinker issue={issue} />

          <div>
            <div className={styles.tabs}>
              {(['comments', 'activity', 'attachments', 'graph'] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={cx(styles.tab, tab === t && styles.active)}>
                  {t === 'graph' ? 'Dependency graph' : t[0].toUpperCase() + t.slice(1)}
                  {t === 'comments' && issue._count ? ` (${issue._count.comments})` : ''}
                  {t === 'attachments' ? ` (${issue.attachments.length})` : ''}
                  {t === 'graph' ? ` (${issue.sourceLinks.length + issue.targetLinks.length})` : ''}
                </button>
              ))}
            </div>
            {tab === 'comments' && <IssueComments issueKey={issue.key} />}
            {tab === 'activity' && <IssueActivity issueKey={issue.key} />}
            {tab === 'attachments' && <IssueAttachments issueKey={issue.key} attachments={issue.attachments} />}
            {tab === 'graph' && <DependencyGraph issue={issue} />}
          </div>
        </div>

        <aside className={styles.sidebar}>
          <SideField label="Status">
            <IssueStatusSelect value={issue.status} onChange={(status) => update.mutate({ status })} />
          </SideField>

          <SideField label="Assignee">
            <IssueAssignee
              assignee={issue.assignee}
              projectKey={issue.project.key}
              onChange={(assigneeId) => update.mutate({ assigneeId })}
              showName
            />
          </SideField>

          <SideField label="Reporter">
            <div className={styles.fieldRow}>
              <Avatar user={issue.reporter} size="sm" />
              <span className={styles.fieldText}>{issue.reporter.displayName}</span>
            </div>
          </SideField>

          <SideField label="Priority">
            <div className={styles.fieldRow}>
              <IssuePriorityIcon priority={issue.priority} />
              <PermissionGate permission="issue:edit" fallback={<span className={styles.fieldText}>{issue.priority}</span>}>
                <Select value={issue.priority} onChange={(e) => update.mutate({ priority: e.target.value as IssuePriority })} className={styles.fieldSelect}>
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </Select>
              </PermissionGate>
            </div>
          </SideField>

          <SideField label="Story points">
            <PermissionGate permission="issue:edit" fallback={<span className={styles.fieldText}>{issue.storyPoints ?? '—'}</span>}>
              <Select value={issue.storyPoints ?? ''} onChange={(e) => update.mutate({ storyPoints: e.target.value ? Number(e.target.value) : null })} className={styles.fieldSelect} style={{ width: 80 }}>
                <option value="">—</option>
                {STORY_POINT_OPTIONS.map((sp) => <option key={sp} value={sp}>{sp}</option>)}
              </Select>
            </PermissionGate>
          </SideField>

          <SideField label="Epic">
            <PermissionGate permission="issue:edit" fallback={<span className={styles.fieldText}>{issue.epic?.name ?? '—'}</span>}>
              <EpicSelect
                projectKey={issue.project.key}
                value={issue.epicId}
                onChange={(epicId) => update.mutate({ epicId })}
                className={styles.fieldSelectFull}
              />
            </PermissionGate>
          </SideField>

          <SideField label="Sprint">
            <PermissionGate permission="issue:edit" fallback={<span className={styles.fieldText}>{issue.sprint?.name ?? 'Backlog'}</span>}>
              <Select value={issue.sprintId ?? ''} onChange={(e) => update.mutate({ sprintId: e.target.value || null })} className={styles.fieldSelectFull}>
                <option value="">Backlog</option>
                {sprints.filter((s) => s.status !== 'COMPLETED').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </PermissionGate>
          </SideField>

          <SideField label="Labels">
            <PermissionGate
              permission="issue:edit"
              fallback={
                <div className={styles.labels}>
                  {issue.labels.length > 0 ? issue.labels.map((l) => <Badge key={l}>{l}</Badge>) : <span className={styles.fieldText}>None</span>}
                </div>
              }
            >
              <Dropdown
                trigger={
                  <button className={styles.labelsBtn}>
                    {issue.labels.length > 0 ? (
                      <div className={styles.labels}>
                        {issue.labels.map((l) => <Badge key={l}>{l}</Badge>)}
                      </div>
                    ) : (
                      <span className={styles.fieldText}>None</span>
                    )}
                  </button>
                }
              >
                {() => (
                  <div className={styles.labelsMenu}>
                    {projectLabels.length === 0 ? (
                      <p className={styles.labelsEmpty}>No labels in this project</p>
                    ) : (
                      projectLabels.map((lbl) => {
                        const active = issue.labels.includes(lbl.name);
                        const next = active
                          ? issue.labels.filter((n) => n !== lbl.name)
                          : [...issue.labels, lbl.name];
                        return (
                          <button
                            key={lbl.id}
                            className={cx(styles.labelOption, active && styles.labelOptionActive)}
                            onClick={() => update.mutate({ labels: next })}
                          >
                            <span className={styles.labelDot} style={{ background: lbl.color }} />
                            {lbl.name}
                            {active && <span className={styles.labelCheck}>✓</span>}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </Dropdown>
            </PermissionGate>
          </SideField>

          <SideField label="Due date">
            <PermissionGate permission="issue:edit" fallback={<span className={styles.fieldText}>{issue.dueDate ? formatDate(issue.dueDate) : '—'}</span>}>
              <input
                type="date"
                className={styles.dateInput}
                value={issue.dueDate ? issue.dueDate.slice(0, 10) : ''}
                onChange={(e) => update.mutate({ dueDate: e.target.value || null })}
              />
            </PermissionGate>
          </SideField>

          <SideField label="Time tracking">
            <div className={styles.timeTracking}>
              <div className={styles.timeRow}>
                <span>Logged: {formatHours(issue.loggedHours)}</span>
                <span>Est: {formatHours(issue.estimatedHours)}</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <PermissionGate permission="worklog:add">
                <Button variant="outline" size="sm" className={styles.logWorkBtn} onClick={() => setLogWorkOpen(true)}>
                  <Clock size={16} /> Log work
                </Button>
              </PermissionGate>
            </div>
          </SideField>

          {issue.customFieldValues.length > 0 && (
            <SideField label="Custom fields">
              <ul className={styles.customFields}>
                {issue.customFieldValues.map((cf) => (
                  <li key={cf.id} className={styles.cfItem}>
                    <span className={styles.cfName}>{cf.field.name}</span>
                    <span>{cf.value}</span>
                  </li>
                ))}
              </ul>
            </SideField>
          )}

          <p className={styles.createdAt}>Created {formatDate(issue.createdAt)}</p>
        </aside>
      </div>

      <LogWorkModal issueKey={issue.key} open={logWorkOpen} onClose={() => setLogWorkOpen(false)} />
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${issue.key}?`}
        message="This permanently deletes the issue and all its comments, attachments, and history."
        destructive
        confirmLabel="Delete issue"
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate(issue.key, { onSuccess: () => { setConfirmDelete(false); onClose?.(); } })}
      />
    </div>
  );
}

function SideField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <p className={styles.fieldLabel}>{label}</p>
      {children}
    </div>
  );
}

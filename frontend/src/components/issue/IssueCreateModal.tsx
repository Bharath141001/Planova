import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select, FieldError } from '@/components/ui/Input';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { useUiStore } from '@/store/uiStore';
import { useProjectStore } from '@/store/projectStore';
import { useProjects } from '@/hooks/useProject';
import { useCreateIssue } from '@/hooks/useIssue';
import { useProjectMembers } from '@/hooks/useProject';
import { EpicSelect } from './EpicSelect';
import { useSprints } from '@/hooks/useSprint';
import { issueSchema, type IssueForm } from '@/utils/validators';
import { ISSUE_TYPES, PRIORITIES, STORY_POINT_OPTIONS } from '@/utils/constants';
import styles from './IssueCreateModal.module.scss';

export function IssueCreateModal() {
  const open = useUiStore((s) => s.createIssueOpen);
  const close = useUiStore((s) => s.closeCreateIssue);
  const defaults = useUiStore((s) => s.createIssueDefaults);
  const currentProject = useProjectStore((s) => s.currentProject);
  const { data: projects = [] } = useProjects();

  const [projectKey, setProjectKey] = useState<string>('');

  useEffect(() => {
    if (open) setProjectKey(currentProject?.key ?? projects[0]?.key ?? '');
  }, [open, currentProject?.key, projects]);

  const createIssue = useCreateIssue(projectKey);
  const { data: members = [] } = useProjectMembers(projectKey || undefined);
  const { data: sprints = [] } = useSprints(projectKey || undefined);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<IssueForm>({
    resolver: zodResolver(issueSchema),
    defaultValues: { type: 'TASK', priority: 'MEDIUM', labels: [] },
  });

  useEffect(() => {
    if (open) {
      reset({
        type: (defaults?.type as IssueForm['type']) ?? 'TASK',
        priority: 'MEDIUM',
        sprintId: defaults?.sprintId ?? null,
        labels: [],
        title: '',
        description: '',
      });
    }
  }, [open, defaults, reset]);

  const project = projects.find((p) => p.key === projectKey);

  const onSubmit = handleSubmit((values) => {
    if (!project) return;
    createIssue.mutate(
      { ...values, projectId: project.id, status: defaults?.status, storyPoints: values.storyPoints ?? null, estimatedHours: values.estimatedHours ?? null },
      { onSuccess: () => close() }
    );
  });

  return (
    <Modal
      open={open}
      onClose={close}
      title="Create issue"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button onClick={onSubmit} loading={createIssue.isPending} disabled={!project}>Create</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.row2}>
          <div className={styles.field}>
            <Label>Project</Label>
            <Select value={projectKey} onChange={(e) => setProjectKey(e.target.value)}>
              {projects.map((p) => <option key={p.id} value={p.key}>{p.name} ({p.key})</option>)}
            </Select>
          </div>
          <div className={styles.field}>
            <Label>Issue type</Label>
            <Select {...register('type')}>
              {ISSUE_TYPES.filter((t) => t.value !== 'SUBTASK').map((t) => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className={styles.field}>
          <Label>Summary</Label>
          <Input autoFocus placeholder="What needs to be done?" {...register('title')} />
          <FieldError message={errors.title?.message} />
        </div>

        <div className={styles.field}>
          <Label>Description</Label>
          <Controller
            control={control}
            name="description"
            render={({ field }) => <RichTextEditor value={field.value ?? ''} onChange={field.onChange} />}
          />
        </div>

        <div className={styles.row3}>
          <div className={styles.field}>
            <Label>Priority</Label>
            <Select {...register('priority')}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
          </div>
          <div className={styles.field}>
            <Label>Assignee</Label>
            <Controller
              control={control}
              name="assigneeId"
              render={({ field }) => (
                <Select value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)}>
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.userId} value={m.userId}>{m.user.displayName}</option>)}
                </Select>
              )}
            />
          </div>
          <div className={styles.field}>
            <Label>Story points</Label>
            <Controller
              control={control}
              name="storyPoints"
              render={({ field }) => (
                <Select value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">—</option>
                  {STORY_POINT_OPTIONS.map((sp) => <option key={sp} value={sp}>{sp}</option>)}
                </Select>
              )}
            />
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <Label>Epic</Label>
            <Controller
              control={control}
              name="epicId"
              render={({ field }) => (
                <EpicSelect
                  projectKey={projectKey}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div className={styles.field}>
            <Label>Sprint</Label>
            <Controller
              control={control}
              name="sprintId"
              render={({ field }) => (
                <Select value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)}>
                  <option value="">Backlog</option>
                  {sprints.filter((s) => s.status !== 'COMPLETED').map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              )}
            />
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <Label>Due date</Label>
            <Input type="date" {...register('dueDate')} />
          </div>
        </div>
      </form>
    </Modal>
  );
}

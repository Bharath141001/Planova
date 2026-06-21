import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectService } from '@/services/projectService';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGate } from '@/components/common/PermissionGate';
import { QUERY_KEYS } from '@/utils/constants';
import { getErrorMessage } from '@/services/api';
import type { Project } from '@/types/project.types';
import styles from './ProjectSettings.module.scss';

export function ProjectSettings({ project }: { project: Project }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [isPrivate, setIsPrivate] = useState(project.isPrivate);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const save = useMutation({
    mutationFn: () => projectService.update(project.key, { name, description, isPrivate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.project(project.key) }); toast.success('Project updated'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const archive = useMutation({
    mutationFn: () => projectService.archive(project.key),
    onSuccess: () => { toast.success('Project archived'); navigate('/projects'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: () => projectService.remove(project.key),
    onSuccess: () => { toast.success('Project deleted'); navigate('/projects'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className={styles.root}>
      <div className={styles.form}>
        <div className={styles.field}><Label>Project name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className={styles.row2}>
          <div className={styles.field}><Label>Project key</Label><Input value={project.key} disabled /></div>
          <div className={styles.field}>
            <Label>Access</Label>
            <Select value={isPrivate ? 'private' : 'public'} onChange={(e) => setIsPrivate(e.target.value === 'private')}>
              <option value="public">Public — any member can view</option>
              <option value="private">Private — invited members only</option>
            </Select>
          </div>
        </div>
        <div className={styles.field}><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <Button onClick={() => save.mutate()} loading={save.isPending}>Save changes</Button>
      </div>

      <PermissionGate permission="project:archive">
        <div className={styles.dangerZone}>
          <h3 className={styles.dangerTitle}>Danger zone</h3>
          <div className={styles.dangerActions}>
            <Button variant="outline" onClick={() => setConfirmArchive(true)}>Archive project</Button>
            <PermissionGate permission="project:delete">
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete project</Button>
            </PermissionGate>
          </div>
        </div>
      </PermissionGate>

      <ConfirmDialog open={confirmArchive} title="Archive project?"
        message="Archived projects are hidden from the list but can be restored later."
        confirmLabel="Archive" loading={archive.isPending}
        onCancel={() => setConfirmArchive(false)} onConfirm={() => archive.mutate()} />
      <ConfirmDialog open={confirmDelete} title={`Delete ${project.key}?`}
        message="This permanently deletes the project and ALL its issues, sprints, and history. This cannot be undone."
        destructive confirmLabel="Delete forever" loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)} onConfirm={() => remove.mutate()} />
    </div>
  );
}

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectService } from '@/services/projectService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { QUERY_KEYS } from '@/utils/constants';
import { getErrorMessage } from '@/services/api';
import type { Project } from '@/types/project.types';
import styles from './WorkflowEditor.module.scss';

export function WorkflowEditor({ project }: { project: Project }) {
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const invalidate = () => qc.invalidateQueries({ queryKey: QUERY_KEYS.project(project.key) });

  const addColumn = useMutation({
    mutationFn: () => projectService.createColumn(project.key, { name: newName, status: newName }),
    onSuccess: () => { invalidate(); setNewName(''); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateColumn = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; wipLimit?: number | null } }) =>
      projectService.updateColumn(project.key, id, data),
    onSuccess: invalidate,
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteColumn = useMutation({
    mutationFn: (id: string) => projectService.deleteColumn(project.key, id),
    onSuccess: invalidate,
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className={styles.root}>
      <p className={styles.hint}>Columns define the board statuses for this project. Each issue's status maps to a column.</p>
      <div className={styles.columnList}>
        {project.columns.map((col) => (
          <div key={col.id} className={styles.columnRow}>
            <GripVertical size={16} className={styles.dragHandle} />
            <span className={styles.colorDot} style={{ backgroundColor: col.color }} />
            <Input defaultValue={col.name} onBlur={(e) => e.target.value !== col.name && updateColumn.mutate({ id: col.id, data: { name: e.target.value } })} style={{ flex: 1 }} />
            <span className={styles.wipLabel}>WIP</span>
            <Input type="number" min="0" defaultValue={col.wipLimit ?? ''} style={{ width: 64 }}
              onBlur={(e) => updateColumn.mutate({ id: col.id, data: { wipLimit: e.target.value ? Number(e.target.value) : null } })} />
            <button onClick={() => deleteColumn.mutate(col.id)} className={styles.removeBtn} aria-label="Delete column" disabled={project.columns.length <= 1}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className={styles.addRow}>
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New column name" style={{ flex: 1 }} />
        <Button onClick={() => addColumn.mutate()} loading={addColumn.isPending} disabled={!newName}>
          <Plus size={16} /> Add column
        </Button>
      </div>
    </div>
  );
}

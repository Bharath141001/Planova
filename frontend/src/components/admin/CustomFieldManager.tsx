import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectService } from '@/services/projectService';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/common/Badge';
import { getErrorMessage } from '@/services/api';
import type { CustomFieldType } from '@/types/common.types';
import styles from './CustomFieldManager.module.scss';

const FIELD_TYPES: CustomFieldType[] = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT', 'USER'];

export function CustomFieldManager({ projectKey }: { projectKey: string }) {
  const qc = useQueryClient();
  const { data: fields = [] } = useQuery({
    queryKey: ['custom-fields', projectKey],
    queryFn: () => projectService.listCustomFields(projectKey),
  });
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomFieldType>('TEXT');
  const [options, setOptions] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['custom-fields', projectKey] });

  const add = useMutation({
    mutationFn: () => projectService.createCustomField(projectKey, {
      name, type,
      options: type.includes('SELECT') ? options.split(',').map((o) => o.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => { invalidate(); setName(''); setOptions(''); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => projectService.removeCustomField(projectKey, id),
    onSuccess: invalidate,
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className={styles.root}>
      <div className={styles.fieldList}>
        {fields.length === 0 && <p className={styles.empty}>No custom fields yet.</p>}
        {fields.map((f) => (
          <div key={f.id} className={styles.fieldRow}>
            <span className={styles.fieldName}>{f.name}</span>
            <Badge>{f.type}</Badge>
            {f.options.length > 0 && <span className={styles.fieldOptions}>{f.options.join(', ')}</span>}
            <button onClick={() => remove.mutate(f.id)} className={styles.removeBtn} aria-label="Delete field">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className={styles.addRow}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Field name" />
        <Select value={type} onChange={(e) => setType(e.target.value as CustomFieldType)}>
          {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        {type.includes('SELECT') && (
          <Input value={options} onChange={(e) => setOptions(e.target.value)} placeholder="Option1, Option2" />
        )}
        <Button onClick={() => add.mutate()} loading={add.isPending} disabled={!name}>
          <Plus size={16} /> Add field
        </Button>
      </div>
    </div>
  );
}

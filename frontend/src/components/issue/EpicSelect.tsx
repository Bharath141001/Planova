import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useEpics, useCreateEpic } from '@/hooks/useProject';
import { Select } from '@/components/ui/Input';
import styles from './EpicSelect.module.scss';

const CREATE_SENTINEL = '__create__';

interface EpicSelectProps {
  projectKey: string;
  value: string | null | undefined;
  onChange: (epicId: string | null) => void;
  className?: string;
}

export function EpicSelect({ projectKey, value, onChange, className }: EpicSelectProps) {
  const { data: epics = [] } = useEpics(projectKey);
  const createEpic = useCreateEpic(projectKey);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === CREATE_SENTINEL) {
      setCreating(true);
    } else {
      onChange(e.target.value || null);
    }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createEpic.mutate(trimmed, {
      onSuccess: (epic) => {
        onChange(epic.id);
        setName('');
        setCreating(false);
      },
    });
  }

  function handleCancel() {
    setName('');
    setCreating(false);
  }

  if (creating) {
    return (
      <form className={styles.createForm} onSubmit={handleCreate}>
        <input
          ref={inputRef}
          className={styles.createInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Epic name…"
          disabled={createEpic.isPending}
          onKeyDown={(e) => e.key === 'Escape' && handleCancel()}
        />
        <button type="submit" className={styles.createConfirm} disabled={!name.trim() || createEpic.isPending}>
          <Plus size={14} />
        </button>
        <button type="button" className={styles.createCancel} onClick={handleCancel} disabled={createEpic.isPending}>
          ✕
        </button>
      </form>
    );
  }

  return (
    <Select value={value ?? ''} onChange={handleSelectChange} className={className}>
      <option value="">None</option>
      {epics.map((ep) => (
        <option key={ep.id} value={ep.id}>{ep.name}</option>
      ))}
      <option value={CREATE_SENTINEL}>+ Create epic…</option>
    </Select>
  );
}

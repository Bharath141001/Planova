import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Label, Select } from '@/components/ui/Input';
import { useSprintMutations, useSprints } from '@/hooks/useSprint';
import { isDoneStatus } from '@/utils/issueHelpers';
import type { SprintWithIssues } from '@/types/sprint.types';
import styles from './SprintModal.module.scss';

interface SprintCompleteModalProps {
  projectKey: string;
  sprint: SprintWithIssues | null;
  onClose: () => void;
}

export function SprintCompleteModal({ projectKey, sprint, onClose }: SprintCompleteModalProps) {
  const { complete } = useSprintMutations(projectKey);
  const { data: sprints = [] } = useSprints(projectKey);
  const [destination, setDestination] = useState<'backlog' | 'next'>('backlog');
  const [nextSprintId, setNextSprintId] = useState('');

  if (!sprint) return null;

  const done = sprint.issues.filter((i) => isDoneStatus(i.status));
  const incomplete = sprint.issues.filter((i) => !isDoneStatus(i.status));
  const velocity = done.reduce((s, i) => s + (i.storyPoints ?? 0), 0);
  const otherPlanned = sprints.filter((s) => s.id !== sprint.id && s.status === 'PLANNED');

  const submit = () => {
    complete.mutate(
      { sprintId: sprint.id, input: { destination, nextSprintId: destination === 'next' ? nextSprintId || undefined : undefined } },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal open={!!sprint} onClose={onClose} title={`Complete ${sprint.name}`} size="md"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={complete.isPending}>Complete sprint</Button></>}
    >
      <div className={styles.form}>
        <div className={styles.statsGrid}>
          <StatBox label="Completed" value={done.length} icon={<CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />} />
          <StatBox label="Incomplete" value={incomplete.length} icon={<Circle size={16} style={{ color: 'var(--color-text-subtle)' }} />} />
          <StatBox label="Velocity" value={`${velocity} pts`} />
        </div>

        {incomplete.length > 0 && (
          <div className={styles.field}>
            <Label>Move {incomplete.length} incomplete issue(s) to</Label>
            <div className={styles.destRow}>
              <Select value={destination} onChange={(e) => setDestination(e.target.value as 'backlog' | 'next')}>
                <option value="backlog">Backlog</option>
                <option value="next">Another sprint</option>
              </Select>
              {destination === 'next' && (
                <Select value={nextSprintId} onChange={(e) => setNextSprintId(e.target.value)}>
                  <option value="">New sprint</option>
                  {otherPlanned.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function StatBox({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{icon}{value}</div>
      <p className={styles.statLabel}>{label}</p>
    </div>
  );
}

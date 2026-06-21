import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { useSprintMutations, useSprints } from '@/hooks/useSprint';
import type { Sprint } from '@/types/sprint.types';
import styles from './SprintModal.module.scss';

interface SprintStartModalProps {
  projectKey: string;
  sprint: Sprint | null;
  totalPoints: number;
  onClose: () => void;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function SprintStartModal({ projectKey, sprint, totalPoints, onClose }: SprintStartModalProps) {
  const { start } = useSprintMutations(projectKey);
  const { data: sprints = [] } = useSprints(projectKey);
  const [startDate, setStartDate] = useState(addDays(0));
  const [endDate, setEndDate] = useState(addDays(14));
  const [goal, setGoal] = useState('');

  useEffect(() => {
    if (sprint) {
      setGoal(sprint.goal ?? '');
      setStartDate(sprint.startDate?.slice(0, 10) ?? addDays(0));
      setEndDate(sprint.endDate?.slice(0, 10) ?? addDays(14));
    }
  }, [sprint]);

  if (!sprint) return null;

  const activeExists = sprints.some((s) => s.status === 'ACTIVE');

  const submit = () => {
    start.mutate(
      { sprintId: sprint.id, input: { startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString(), goal } },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal open={!!sprint} onClose={onClose} title={`Start ${sprint.name}`} size="sm"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={start.isPending}>Start sprint</Button></>}
    >
      <div className={styles.form}>
        {activeExists && (
          <div className={styles.warning}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            Another sprint is already active. Consider completing it first.
          </div>
        )}
        <div className={styles.infoBox}>
          <strong>{totalPoints}</strong> story points committed to this sprint.
        </div>
        <div className={styles.field}>
          <Label>Sprint goal</Label>
          <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Sprint goal" />
        </div>
        <div className={styles.dateRow}>
          <div className={styles.field}><Label>Start date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div className={styles.field}><Label>End date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        </div>
      </div>
    </Modal>
  );
}

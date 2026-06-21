import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea, FieldError } from '@/components/ui/Input';
import { useSprintMutations } from '@/hooks/useSprint';
import { sprintSchema, type SprintForm } from '@/utils/validators';
import type { Sprint } from '@/types/sprint.types';
import styles from './SprintModal.module.scss';

interface SprintEditModalProps {
  projectKey: string;
  sprint: Sprint | null;
  onClose: () => void;
}

function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

export function SprintEditModal({ projectKey, sprint, onClose }: SprintEditModalProps) {
  const { update } = useSprintMutations(projectKey);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SprintForm>({ resolver: zodResolver(sprintSchema) });

  useEffect(() => {
    if (sprint) {
      reset({ name: sprint.name, goal: sprint.goal ?? '', startDate: toDateInput(sprint.startDate), endDate: toDateInput(sprint.endDate) });
    }
  }, [sprint, reset]);

  if (!sprint) return null;

  const onSubmit = handleSubmit((values) => {
    update.mutate(
      { sprintId: sprint.id, input: { name: values.name, goal: values.goal, startDate: values.startDate ? new Date(values.startDate).toISOString() : null, endDate: values.endDate ? new Date(values.endDate).toISOString() : null } },
      { onSuccess: onClose }
    );
  });

  return (
    <Modal open={!!sprint} onClose={onClose} title={`Edit ${sprint.name}`} size="sm"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={onSubmit} loading={update.isPending}>Save</Button></>}
    >
      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.field}>
          <Label>Sprint name</Label>
          <Input {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className={styles.field}>
          <Label>Sprint goal</Label>
          <Textarea {...register('goal')} />
        </div>
        <div className={styles.dateRow}>
          <div className={styles.field}><Label>Start date</Label><Input type="date" {...register('startDate')} /></div>
          <div className={styles.field}><Label>End date</Label><Input type="date" {...register('endDate')} /></div>
        </div>
      </form>
    </Modal>
  );
}

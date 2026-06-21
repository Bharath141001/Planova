import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea, FieldError } from '@/components/ui/Input';
import { useSprintMutations } from '@/hooks/useSprint';
import { sprintSchema, type SprintForm } from '@/utils/validators';
import styles from './SprintModal.module.scss';

interface SprintCreateModalProps {
  projectKey: string;
  open: boolean;
  onClose: () => void;
}

export function SprintCreateModal({ projectKey, open, onClose }: SprintCreateModalProps) {
  const { create } = useSprintMutations(projectKey);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SprintForm>({ resolver: zodResolver(sprintSchema) });

  const onSubmit = handleSubmit((values) => {
    create.mutate(
      { name: values.name, goal: values.goal, startDate: values.startDate || null, endDate: values.endDate || null },
      { onSuccess: () => { reset(); onClose(); } }
    );
  });

  return (
    <Modal open={open} onClose={onClose} title="Create sprint" size="sm"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={onSubmit} loading={create.isPending}>Create</Button></>}
    >
      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.field}>
          <Label>Sprint name</Label>
          <Input autoFocus placeholder="Sprint 1" {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className={styles.field}>
          <Label>Sprint goal (optional)</Label>
          <Textarea placeholder="What do we want to achieve?" {...register('goal')} />
        </div>
        <div className={styles.dateRow}>
          <div className={styles.field}><Label>Start date</Label><Input type="date" {...register('startDate')} /></div>
          <div className={styles.field}><Label>End date</Label><Input type="date" {...register('endDate')} /></div>
        </div>
      </form>
    </Modal>
  );
}

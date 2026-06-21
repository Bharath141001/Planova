import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { issueService } from '@/services/issueService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { QUERY_KEYS } from '@/utils/constants';
import { getErrorMessage } from '@/services/api';
import styles from './LogWorkModal.module.scss';

interface LogWorkModalProps {
  issueKey: string;
  open: boolean;
  onClose: () => void;
}

export function LogWorkModal({ issueKey, open, onClose }: LogWorkModalProps) {
  const qc = useQueryClient();
  const [timeSpent, setTimeSpent] = useState('');
  const [description, setDescription] = useState('');

  const logWork = useMutation({
    mutationFn: () => issueService.logWork(issueKey, { timeSpent: parseFloat(timeSpent), description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.issue(issueKey) });
      toast.success('Work logged');
      setTimeSpent('');
      setDescription('');
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const valid = parseFloat(timeSpent) > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log work"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => logWork.mutate()} disabled={!valid} loading={logWork.isPending}>Log</Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.field}>
          <Label>Time spent (hours)</Label>
          <Input type="number" min="0" step="0.25" value={timeSpent} onChange={(e) => setTimeSpent(e.target.value)} placeholder="e.g. 2.5" autoFocus />
        </div>
        <div className={styles.field}>
          <Label>Work description (optional)</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you work on?" />
        </div>
      </div>
    </Modal>
  );
}

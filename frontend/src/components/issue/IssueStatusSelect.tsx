import { Select } from '@/components/ui/Input';
import { useProjectStore } from '@/store/projectStore';
import { isDoneStatus } from '@/utils/issueHelpers';
import { cx } from '@/utils/cx';
import styles from './IssueStatusSelect.module.scss';

interface IssueStatusSelectProps {
  value: string;
  onChange: (status: string) => void;
  disabled?: boolean;
  className?: string;
}

export function IssueStatusSelect({ value, onChange, disabled, className }: IssueStatusSelectProps) {
  const columns = useProjectStore((s) => s.currentProject?.columns ?? []);
  const statuses = columns.length ? columns.map((c) => c.status) : ['To Do', 'In Progress', 'Done'];
  const done = isDoneStatus(value);

  return (
    <Select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cx(styles.select, done && styles.done, className)}
    >
      {!statuses.includes(value) && <option value={value}>{value}</option>}
      {statuses.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </Select>
  );
}

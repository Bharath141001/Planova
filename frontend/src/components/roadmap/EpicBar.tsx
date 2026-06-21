import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Epic } from '@/types/sprint.types';
import styles from './EpicBar.module.scss';

interface EpicBarProps {
  epic: Epic;
  left: number;
  width: number;
  onClick: () => void;
}

export function EpicBar({ epic, left, width, onClick }: EpicBarProps) {
  const { data } = useQuery({
    queryKey: ['epic-report', epic.id],
    queryFn: () => reportService.epicReport(epic.id),
  });
  const progress = data?.progress ?? 0;

  return (
    <Tooltip content={`${epic.name} — ${progress}% complete`}>
      <button
        onClick={onClick}
        className={styles.bar}
        style={{ left: `${left}%`, width: `${Math.max(width, 4)}%`, backgroundColor: `${epic.color}99` }}
      >
        <span className={styles.fill} style={{ width: `${progress}%`, backgroundColor: epic.color }} />
        <span className={styles.label}>{epic.name}</span>
      </button>
    </Tooltip>
  );
}

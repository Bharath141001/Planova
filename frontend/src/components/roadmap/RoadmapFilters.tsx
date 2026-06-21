import { Select } from '@/components/ui/Input';
import { cx } from '@/utils/cx';
import styles from './RoadmapFilters.module.scss';

export type RoadmapZoom = 'months' | 'quarters' | 'years';

interface RoadmapFiltersProps {
  zoom: RoadmapZoom;
  onZoomChange: (zoom: RoadmapZoom) => void;
  status: string;
  onStatusChange: (status: string) => void;
}

export function RoadmapFilters({ zoom, onZoomChange, status, onStatusChange }: RoadmapFiltersProps) {
  return (
    <div className={styles.root}>
      <Select value={status} onChange={(e) => onStatusChange(e.target.value)}>
        <option value="">All statuses</option>
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="DONE">Done</option>
      </Select>
      <div className={styles.toggleGroup}>
        {(['months', 'quarters', 'years'] as RoadmapZoom[]).map((z) => (
          <button key={z} onClick={() => onZoomChange(z)} className={cx(styles.toggleBtn, zoom === z && styles.active)}>
            {z}
          </button>
        ))}
      </div>
    </div>
  );
}

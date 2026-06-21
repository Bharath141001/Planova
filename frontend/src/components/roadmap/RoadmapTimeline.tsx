import { useMemo } from 'react';
import { EpicBar } from './EpicBar';
import type { Epic } from '@/types/sprint.types';
import type { RoadmapZoom } from './RoadmapFilters';
import styles from './RoadmapTimeline.module.scss';

interface RoadmapTimelineProps {
  epics: Epic[];
  zoom: RoadmapZoom;
  onEpicClick: (epic: Epic) => void;
}

interface TimelineBounds {
  start: number;
  end: number;
  ticks: { label: string; offset: number }[];
}

const MS_PER_DAY = 86_400_000;

export function RoadmapTimeline({ epics, zoom, onEpicClick }: RoadmapTimelineProps) {
  const bounds = useMemo<TimelineBounds>(() => {
    const now = new Date();
    const dated = epics.filter((e) => e.startDate || e.endDate);
    const starts = dated.map((e) => new Date(e.startDate ?? e.endDate!).getTime());
    const ends = dated.map((e) => new Date(e.endDate ?? e.startDate!).getTime());

    let min = starts.length ? Math.min(...starts) : now.getTime() - 30 * MS_PER_DAY;
    let max = ends.length ? Math.max(...ends) : now.getTime() + 90 * MS_PER_DAY;
    const minDate = new Date(min);
    minDate.setDate(1);
    min = minDate.getTime();
    const maxDate = new Date(max);
    maxDate.setMonth(maxDate.getMonth() + 1, 1);
    max = maxDate.getTime();

    const ticks: TimelineBounds['ticks'] = [];
    const cursor = new Date(min);
    const step = zoom === 'years' ? 12 : zoom === 'quarters' ? 3 : 1;
    while (cursor.getTime() < max) {
      ticks.push({
        label: zoom === 'years'
          ? `${cursor.getFullYear()}`
          : cursor.toLocaleString('default', { month: 'short', year: '2-digit' }),
        offset: ((cursor.getTime() - min) / (max - min)) * 100,
      });
      cursor.setMonth(cursor.getMonth() + step);
    }
    return { start: min, end: max, ticks };
  }, [epics, zoom]);

  const span = bounds.end - bounds.start || 1;
  const positionOf = (epic: Epic) => {
    const s = new Date(epic.startDate ?? epic.endDate ?? bounds.start).getTime();
    const e = new Date(epic.endDate ?? epic.startDate ?? bounds.end).getTime();
    return { left: ((s - bounds.start) / span) * 100, width: ((e - s) / span) * 100 };
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.ticks}>
        {bounds.ticks.map((t, i) => (
          <div key={i} className={styles.tick} style={{ left: `${t.offset}%` }}>{t.label}</div>
        ))}
      </div>
      <div className={styles.rows}>
        {epics.map((epic) => {
          const { left, width } = positionOf(epic);
          return (
            <div key={epic.id} className={styles.row}>
              {bounds.ticks.map((t, i) => (
                <div key={i} className={styles.gridLine} style={{ left: `${t.offset}%` }} />
              ))}
              <div className={styles.barWrap}>
                <EpicBar epic={epic} left={left} width={width} onClick={() => onEpicClick(epic)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths,
  isSameMonth, isSameDay, format, isToday, parseISO, isValid,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useProject } from '@/hooks/useProject';
import { issueService } from '@/services/issueService';
import { PageHeader } from '@/components/common/PageHeader';
import { IssuePanel } from '@/components/issue/IssuePanel';
import { IssueTypeIcon } from '@/components/issue/IssueTypeIcon';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { QUERY_KEYS } from '@/utils/constants';
import type { IssueSummary } from '@/types/issue.types';
import { cx } from '@/utils/cx';
import styles from './CalendarPage.module.scss';

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: 'var(--color-danger)',
  HIGH: '#f97316',
  MEDIUM: 'var(--color-warning)',
  LOW: 'var(--color-success)',
  NONE: 'var(--color-text-subtle)',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarPage() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const { data: project, isLoading: projLoading } = useProject(projectKey);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  const { data: issues = [], isLoading: issuesLoading } = useQuery({
    queryKey: QUERY_KEYS.issues(projectKey ?? '', { calendar: true }),
    queryFn: () => issueService.listForProject(projectKey!),
    enabled: !!projectKey,
  });

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const issuesByDay = useMemo(() => {
    const map = new Map<string, IssueSummary[]>();
    for (const issue of issues) {
      if (!issue.dueDate) continue;
      const d = parseISO(issue.dueDate);
      if (!isValid(d)) continue;
      const key = format(d, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(issue);
    }
    return map;
  }, [issues]);

  const issuesWithDates = useMemo(
    () => issues.filter((i) => i.dueDate),
    [issues],
  );

  if (projLoading || !project) return <LoadingSpinner label="Loading project…" />;

  return (
    <div className={styles.page}>
      <PageHeader
        title="Calendar"
        breadcrumbs={[
          { label: 'Projects', to: '/projects' },
          { label: project.name, to: `/projects/${project.key}/board` },
          { label: 'Calendar' },
        ]}
      />

      <div className={styles.controls}>
        <div className={styles.nav}>
          <button className={styles.navBtn} onClick={() => setCurrentMonth((m) => subMonths(m, 1))} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <h2 className={styles.monthLabel}>{format(currentMonth, 'MMMM yyyy')}</h2>
          <button className={styles.navBtn} onClick={() => setCurrentMonth((m) => addMonths(m, 1))} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
        <button className={styles.todayBtn} onClick={() => setCurrentMonth(new Date())}>Today</button>
        <span className={styles.issueCount}>
          {issuesWithDates.length} issue{issuesWithDates.length !== 1 ? 's' : ''} with due dates
        </span>
      </div>

      <div className={styles.grid}>
        {DAY_LABELS.map((d) => (
          <div key={d} className={styles.dayHeader}>{d}</div>
        ))}

        {calendarDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayIssues = issuesByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <div
                key={key}
                className={cx(
                  styles.cell,
                  !inMonth && styles.cellOutside,
                  today && styles.cellToday,
                )}
              >
                <span className={cx(styles.dayNum, today && styles.dayNumToday)}>
                  {format(day, 'd')}
                </span>
                <div className={styles.issueList}>
                  {dayIssues.slice(0, 3).map((issue) => (
                    <button
                      key={issue.id}
                      className={styles.issueChip}
                      style={{ borderLeftColor: PRIORITY_COLOR[issue.priority] ?? 'var(--color-border)' }}
                      onClick={() => setSelectedIssue(issue.key)}
                      title={`${issue.key}: ${issue.title}`}
                    >
                      <IssueTypeIcon type={issue.type} className={styles.issueChipIcon} />
                      <span className={styles.issueChipKey}>{issue.key}</span>
                      <span className={styles.issueChipTitle}>{issue.title}</span>
                    </button>
                  ))}
                  {dayIssues.length > 3 && (
                    <span className={styles.moreChip}>+{dayIssues.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <IssuePanel issueKey={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </div>
  );
}

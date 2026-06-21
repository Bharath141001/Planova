import { useRef, useState, useEffect } from 'react';
import { useProjectMembers, useEpics } from '@/hooks/useProject';
import { useProjectStore } from '@/store/projectStore';
import { useBoardStore, type Swimlane } from '@/store/boardStore';
import { SearchBar } from '@/components/common/SearchBar';
import { Select } from '@/components/ui/Input';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/ui/Button';
import { ISSUE_TYPES, PRIORITIES } from '@/utils/constants';
import { X } from 'lucide-react';
import { cx } from '@/utils/cx';
import styles from './BoardFilters.module.scss';

const MAX_VISIBLE_AVATARS = 5;

export function BoardFilters() {
  const projectKey = useProjectStore((s) => s.currentProject?.key);
  const labels = useProjectStore((s) => s.currentProject?.labels ?? []);
  const { data: members = [] } = useProjectMembers(projectKey);
  const { data: epics = [] } = useEpics(projectKey);
  const { filters, setFilter, clearFilters, swimlane, setSwimlane } = useBoardStore();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  const hasFilters = Object.keys(filters).length > 0;
  const visible = members.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = members.slice(MAX_VISIBLE_AVATARS);

  useEffect(() => {
    if (!overflowOpen) return;
    function handleClick(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [overflowOpen]);

  function toggleAssignee(userId: string) {
    setFilter('assigneeId', filters.assigneeId === userId ? undefined : userId);
  }

  return (
    <div className={styles.root}>
      <SearchBar
        value={filters.search ?? ''}
        onValueChange={(v) => setFilter('search', v)}
        className={styles.search}
        placeholder="Search board…"
      />

      <div className={styles.avatarRow}>
        {visible.map((m) => (
          <button
            key={m.userId}
            onClick={() => toggleAssignee(m.userId)}
            className={cx(styles.avatarBtn, filters.assigneeId === m.userId && styles.active)}
            title={m.user.displayName}
          >
            <Avatar user={m.user} size="sm" />
          </button>
        ))}
        {overflow.length > 0 && (
          <div className={styles.overflowWrap} ref={overflowRef}>
            <button
              className={cx(styles.avatarBtn, styles.overflowBtn, overflow.some((m) => m.userId === filters.assigneeId) && styles.active)}
              onClick={() => setOverflowOpen((o) => !o)}
              title={`${overflow.length} more members`}
            >
              +{overflow.length}
            </button>
            {overflowOpen && (
              <div className={styles.overflowMenu}>
                {overflow.map((m) => (
                  <button
                    key={m.userId}
                    className={cx(styles.overflowItem, filters.assigneeId === m.userId && styles.overflowItemActive)}
                    onClick={() => { toggleAssignee(m.userId); setOverflowOpen(false); }}
                  >
                    <Avatar user={m.user} size="xs" />
                    <span>{m.user.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Select value={filters.type ?? ''} onChange={(e) => setFilter('type', e.target.value || undefined)} className={styles.filterSelect}>
        <option value="">All types</option>
        {ISSUE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </Select>

      <Select value={filters.priority ?? ''} onChange={(e) => setFilter('priority', e.target.value || undefined)} className={styles.filterSelect}>
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </Select>

      <Select value={filters.epicId ?? ''} onChange={(e) => setFilter('epicId', e.target.value || undefined)} className={styles.filterSelect}>
        <option value="">All epics</option>
        {epics.map((ep) => <option key={ep.id} value={ep.id}>{ep.name}</option>)}
      </Select>

      <Select value={filters.label ?? ''} onChange={(e) => setFilter('label', e.target.value || undefined)} className={styles.filterSelect}>
        <option value="">All labels</option>
        {labels.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
      </Select>

      <div className={styles.right}>
        <label className={styles.swimlaneLabel}>Swimlanes</label>
        <Select value={swimlane} onChange={(e) => setSwimlane(e.target.value as Swimlane)} className={styles.filterSelect}>
          <option value="none">None</option>
          <option value="assignee">By assignee</option>
          <option value="epic">By epic</option>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X size={16} /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}

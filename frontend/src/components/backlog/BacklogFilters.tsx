import { useProjectMembers, useEpics } from '@/hooks/useProject';
import { useProjectStore } from '@/store/projectStore';
import { useBoardStore } from '@/store/boardStore';
import { SearchBar } from '@/components/common/SearchBar';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ISSUE_TYPES, PRIORITIES } from '@/utils/constants';
import { X } from 'lucide-react';
import styles from './BacklogFilters.module.scss';

export function BacklogFilters() {
  const projectKey = useProjectStore((s) => s.currentProject?.key);
  const labels = useProjectStore((s) => s.currentProject?.labels ?? []);
  const { data: members = [] } = useProjectMembers(projectKey);
  const { data: epics = [] } = useEpics(projectKey);
  const { filters, setFilter, clearFilters } = useBoardStore();
  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className={styles.root}>
      <SearchBar value={filters.search ?? ''} onValueChange={(v) => setFilter('search', v)} className={styles.search} placeholder="Search backlog…" />
      <Select value={filters.type ?? ''} onChange={(e) => setFilter('type', e.target.value || undefined)} className={styles.select}>
        <option value="">All types</option>
        {ISSUE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </Select>
      <Select value={filters.priority ?? ''} onChange={(e) => setFilter('priority', e.target.value || undefined)} className={styles.select}>
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </Select>
      <Select value={filters.assigneeId ?? ''} onChange={(e) => setFilter('assigneeId', e.target.value || undefined)} className={styles.select}>
        <option value="">All assignees</option>
        <option value="unassigned">Unassigned</option>
        {members.map((m) => <option key={m.userId} value={m.userId}>{m.user.displayName}</option>)}
      </Select>
      <Select value={filters.epicId ?? ''} onChange={(e) => setFilter('epicId', e.target.value || undefined)} className={styles.select}>
        <option value="">All epics</option>
        {epics.map((ep) => <option key={ep.id} value={ep.id}>{ep.name}</option>)}
      </Select>
      <Select value={filters.label ?? ''} onChange={(e) => setFilter('label', e.target.value || undefined)} className={styles.select}>
        <option value="">All labels</option>
        {labels.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X size={16} /> Clear
        </Button>
      )}
    </div>
  );
}

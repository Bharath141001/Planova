import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, FolderKanban, CircleDot } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useUiStore } from '@/store/uiStore';
import { useDebounce } from '@/hooks/useDebounce';
import { issueService } from '@/services/issueService';
import { projectService } from '@/services/projectService';
import { issueTypeMeta } from '@/utils/issueHelpers';
import styles from './CommandPalette.module.scss';

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPalette);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);

  const { data: issues = [] } = useQuery({
    queryKey: ['command-issues', debounced],
    queryFn: () => issueService.search({ search: debounced }),
    enabled: open && debounced.length > 1,
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['command-projects', debounced],
    queryFn: () => projectService.list(debounced),
    enabled: open,
  });

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="lg">
      <div className={styles.searchRow}>
        <Search size={20} aria-hidden="true" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search issues and projects…"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.results}>
        {projects.length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Projects</p>
            {projects.slice(0, 5).map((p) => (
              <button key={p.id} className={styles.row} onClick={() => go(`/projects/${p.key}/board`)}>
                <span className={styles.rowIcon}><FolderKanban size={16} /></span>
                <span style={{ fontWeight: 500 }}>{p.name}</span>
                <span className={styles.rowKey}>{p.key}</span>
              </button>
            ))}
          </div>
        )}

        {issues.length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Issues</p>
            {issues.slice(0, 8).map((i) => (
              <button key={i.id} className={styles.row} onClick={() => go(`/issues/${i.key}`)}>
                <span className={styles.rowIcon}>{issueTypeMeta(i.type).icon}</span>
                <span className={styles.rowKey}>{i.key}</span>
                <span className={styles.rowTitle}>{i.title}</span>
              </button>
            ))}
          </div>
        )}

        {debounced.length > 1 && issues.length === 0 && projects.length === 0 && (
          <p className={styles.empty}>
            <CircleDot size={24} />
            No results for "{debounced}"
          </p>
        )}
      </div>
    </Modal>
  );
}

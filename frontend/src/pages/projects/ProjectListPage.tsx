import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Star, FolderKanban } from 'lucide-react';
import { useProjects } from '@/hooks/useProject';
import { useProjectStore } from '@/store/projectStore';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeletonList } from '@/components/common/LoadingSpinner';
import styles from './ProjectListPage.module.scss';

export function ProjectListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 250);
  const { data: projects = [], isLoading } = useProjects(debounced || undefined);
  const { starred, toggleStar } = useProjectStore();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Projects"
        breadcrumbs={[{ label: 'Projects' }]}
        actions={<Button onClick={() => navigate('/projects/new')}><Plus size={16} /> Create project</Button>}
      />
      <div className={styles.searchBar}>
        <SearchBar value={search} onValueChange={setSearch} placeholder="Search projects…" />
      </div>
      {isLoading ? (
        <CardSkeletonList count={5} />
      ) : projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project to start tracking work."
          action={<Button onClick={() => navigate('/projects/new')}>Create project</Button>} />
      ) : (
        <div className={styles.grid}>
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.key}/board`} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.avatar}>{p.key.slice(0, 2)}</div>
                <button className={styles.starBtn} onClick={(e) => { e.preventDefault(); toggleStar(p.key); }} aria-label="Star project">
                  <Star size={16} style={{ fill: starred.includes(p.key) ? '#FBBF24' : 'none', color: starred.includes(p.key) ? '#FBBF24' : 'var(--color-text-muted)' }} />
                </button>
              </div>
              <h3 className={styles.cardName}>{p.name}</h3>
              <p className={styles.cardKey}>{p.key}</p>
              <div className={styles.cardMeta}>
                <Badge>{p.type}</Badge>
                {p._count && <span className={styles.issueCount}>{p._count.issues} issues</span>}
                {p.isPrivate && <Badge color="#6B778C">Private</Badge>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

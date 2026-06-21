import { Link, useLocation, useParams } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Star, SquareKanban, ListTodo, Map, BarChart3, Settings, ChevronLeft, Plus, CalendarDays,
} from 'lucide-react';
import { cx } from '@/utils/cx';
import { useUiStore } from '@/store/uiStore';
import { useProjects } from '@/hooks/useProject';
import { useProjectStore } from '@/store/projectStore';
import styles from './Sidebar.module.scss';

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const { projectKey } = useParams();
  const location = useLocation();
  const { data: projects = [] } = useProjects();
  const starred = useProjectStore((s) => s.starred);

  const globalNav = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
  ];

  const projectNav = projectKey
    ? [
        { to: `/projects/${projectKey}/board`, label: 'Board', icon: SquareKanban },
        { to: `/projects/${projectKey}/backlog`, label: 'Backlog', icon: ListTodo },
        { to: `/projects/${projectKey}/roadmap`, label: 'Roadmap', icon: Map },
        { to: `/projects/${projectKey}/calendar`, label: 'Calendar', icon: CalendarDays },
        { to: `/projects/${projectKey}/reports`, label: 'Reports', icon: BarChart3 },
        { to: `/projects/${projectKey}/settings`, label: 'Settings', icon: Settings },
      ]
    : [];

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const starredProjects = projects.filter((p) => starred.includes(p.key));

  return (
    <aside className={cx(styles.aside, collapsed && styles.collapsed)}>
      <div className={styles.header}>
        {!collapsed && (
          <Link to="/" className={styles.logo}>
            <SquareKanban size={24} />
            <span>Planova</span>
          </Link>
        )}
        <button onClick={toggle} aria-label="Toggle sidebar" className={styles.toggleBtn}>
          <ChevronLeft size={16} className={cx(styles.chevron, collapsed && styles.collapsed)} />
        </button>
      </div>

      <nav className={styles.nav}>
        {globalNav.map((item) => (
          <NavLink key={item.to} {...item} active={isActive(item.to)} collapsed={collapsed} />
        ))}

        {!collapsed && starredProjects.length > 0 && (
          <div className={styles.navSection}>
            <p className={styles.sectionLabel}>Starred</p>
            {starredProjects.map((p) => (
              <Link key={p.id} to={`/projects/${p.key}/board`} className={styles.starredLink}>
                <Star size={14} style={{ color: 'var(--color-warning)', fill: 'var(--color-warning)' }} />
                <span className={styles.starredText}>{p.name}</span>
              </Link>
            ))}
          </div>
        )}

        {projectNav.length > 0 && (
          <div className={styles.navSection}>
            {!collapsed && <p className={styles.sectionLabel}>{projectKey}</p>}
            {projectNav.map((item) => (
              <NavLink key={item.to} {...item} active={isActive(item.to)} collapsed={collapsed} />
            ))}
          </div>
        )}
      </nav>

      {!collapsed && (
        <Link to="/projects/new" className={styles.newProjectLink}>
          <Plus size={16} />
          New project
        </Link>
      )}
    </aside>
  );
}

function NavLink({
  to, label, icon: Icon, active, collapsed,
}: {
  to: string; label: string; icon: typeof LayoutDashboard; active: boolean; collapsed: boolean;
}) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={cx(styles.navLink, active && styles.active, collapsed && styles.centered)}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      {!collapsed && <span className={styles.navLinkText}>{label}</span>}
    </Link>
  );
}

import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, ListChecks, Activity as ActivityIcon, Star } from 'lucide-react';
import { useProjects } from '@/hooks/useProject';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { issueService } from '@/services/issueService';
import { PageHeader } from '@/components/common/PageHeader';
import { IssueCardMini } from '@/components/board/IssueCardMini';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { CardSkeletonList } from '@/components/common/LoadingSpinner';
import { formatDate } from '@/utils/formatters';
import { cx } from '@/utils/cx';
import styles from './DashboardPage.module.scss';

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: projects = [] } = useProjects();
  const { starred, recentIssues } = useProjectStore();

  const { data: myIssues = [], isLoading } = useQuery({
    queryKey: ['my-issues', user?.id],
    queryFn: () => issueService.search({ assigneeId: user!.id }),
    enabled: !!user,
  });

  const openIssues = myIssues.filter((i) => i.status.toLowerCase() !== 'done');
  const upcoming = myIssues.filter((i) => i.dueDate).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()).slice(0, 6);
  const starredProjects = projects.filter((p) => starred.includes(p.key));

  return (
    <div className={styles.page}>
      <PageHeader title={`Welcome back, ${user?.displayName.split(' ')[0] ?? ''}`} subtitle="Here's what needs your attention." />
      <div className={styles.grid}>
        <div className={cx(styles.card, styles.wide)}>
          <h3 className={styles.cardTitle}><ListChecks size={16} /> My open issues</h3>
          {isLoading ? <CardSkeletonList /> : openIssues.length === 0
            ? <EmptyState title="Nothing assigned to you" description="Enjoy the calm. 🎉" />
            : openIssues.slice(0, 10).map((i) => (
              <div key={i.id} className={styles.issueRow}>
                <Badge>{i.status}</Badge>
                <IssueCardMini issue={i} onClick={() => navigate(`/issues/${i.key}`)} />
              </div>
            ))
          }
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}><CalendarClock size={16} /> Upcoming due dates</h3>
          {upcoming.length === 0
            ? <p className={styles.empty}>No upcoming due dates.</p>
            : <ul className={styles.dueList}>
              {upcoming.map((i) => (
                <li key={i.id} className={styles.dueItem}>
                  <Link to={`/issues/${i.key}`}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span className={styles.dueKey}>{i.key}</span> {i.title}
                    </span>
                    <span className={styles.dueDate}>{formatDate(i.dueDate)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          }
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}><Star size={16} /> Starred projects</h3>
          {starredProjects.length === 0
            ? <p className={styles.empty}>Star projects to pin them here.</p>
            : <ul className={styles.starList}>
              {starredProjects.map((p) => (
                <li key={p.id}>
                  <Link to={`/projects/${p.key}/board`}>
                    <Star size={14} style={{ fill: '#FBBF24', color: '#FBBF24' }} />
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          }
        </div>

        <div className={cx(styles.card, styles.wide)}>
          <h3 className={styles.cardTitle}><ActivityIcon size={16} /> Recently viewed</h3>
          {recentIssues.length === 0
            ? <p className={styles.empty}>Issues you open will appear here.</p>
            : <div className={styles.recentWrap}>
              {recentIssues.map((key) => (
                <Link key={key} to={`/issues/${key}`} className={styles.recentKey}>{key}</Link>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}

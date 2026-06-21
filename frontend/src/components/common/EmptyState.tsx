import { Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <Icon size={40} className={styles.icon} />
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

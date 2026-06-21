import { Breadcrumb, type Crumb } from './Breadcrumb';
import styles from './PageHeader.module.scss';

interface PageHeaderProps {
  title: React.ReactNode;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export function PageHeader({ title, breadcrumbs, actions, subtitle }: PageHeaderProps) {
  return (
    <div className={styles.root}>
      {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
      <div className={styles.row}>
        <div className={styles.left}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}

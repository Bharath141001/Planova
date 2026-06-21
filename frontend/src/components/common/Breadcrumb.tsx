import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cx } from '@/utils/cx';
import styles from './Breadcrumb.module.scss';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className={styles.nav} aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className={styles.segment}>
          {i > 0 && <ChevronRight size={14} className={styles.separator} aria-hidden="true" />}
          {item.to && i < items.length - 1 ? (
            <Link to={item.to} className={styles.link}>{item.label}</Link>
          ) : (
            <span className={cx(styles.label, i === items.length - 1 && styles.current)}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

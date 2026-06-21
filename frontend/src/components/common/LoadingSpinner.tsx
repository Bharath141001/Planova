import { Loader2 } from 'lucide-react';
import styles from './LoadingSpinner.module.scss';

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className={styles.container} role="status">
      <Loader2 size={24} className={styles.icon} />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`${styles.skeleton}${className ? ` ${className}` : ''}`} />;
}

export function CardSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.skeletonList}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonCard} />
      ))}
    </div>
  );
}

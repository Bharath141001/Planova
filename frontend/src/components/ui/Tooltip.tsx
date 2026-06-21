import { useState } from 'react';
import { cx } from '@/utils/cx';
import styles from './Tooltip.module.scss';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);
  if (!content) return <>{children}</>;
  return (
    <span
      className={styles.root}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          className={cx(styles.bubble, side === 'bottom' ? styles.bottom : styles.top)}
        >
          {content}
        </span>
      )}
    </span>
  );
}

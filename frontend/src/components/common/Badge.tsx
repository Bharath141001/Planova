import React from 'react';
import { cx } from '@/utils/cx';
import styles from './Badge.module.scss';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'solid' | 'soft' | 'outline';
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ children, color = '#42526E', variant = 'soft', className, style: styleProp }: BadgeProps) {
  const colorStyle =
    variant === 'solid'
      ? { backgroundColor: color, color: '#fff' }
      : variant === 'outline'
        ? { border: `1px solid ${color}`, color }
        : { backgroundColor: `${color}22`, color };

  return (
    <span className={cx(styles.badge, className)} style={{ ...colorStyle, ...styleProp }}>
      {children}
    </span>
  );
}

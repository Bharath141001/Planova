import React from 'react';
import type { Theme } from '@/styles/theme';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: keyof Theme['spacing'];
}

export function Grid({ cols, gap, style, children, ...rest }: GridProps) {
  const xs = cols?.xs ?? 1;
  return (
    <div
      {...rest}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${xs}, 1fr)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

import { useState, useEffect } from 'react';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const BREAKPOINTS: { name: Breakpoint; minWidth: number }[] = [
  { name: '2xl', minWidth: 1536 },
  { name: 'xl',  minWidth: 1280 },
  { name: 'lg',  minWidth: 1024 },
  { name: 'md',  minWidth: 768  },
  { name: 'sm',  minWidth: 640  },
  { name: 'xs',  minWidth: 0    },
];

function getBreakpoint(width: number): Breakpoint {
  return BREAKPOINTS.find((bp) => width >= bp.minWidth)?.name ?? 'xs';
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    getBreakpoint(window.innerWidth)
  );

  useEffect(() => {
    const handler = () => setBreakpoint(getBreakpoint(window.innerWidth));
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return breakpoint;
}

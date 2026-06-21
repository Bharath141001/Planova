import { useState, useEffect } from 'react';

export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(
    () => window.innerWidth >= 768 && window.innerWidth < 1280
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (max-width: 1279px)');
    const handler = (e: MediaQueryListEvent) => setIsTablet(e.matches);
    mq.addEventListener('change', handler);
    setIsTablet(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isTablet;
}

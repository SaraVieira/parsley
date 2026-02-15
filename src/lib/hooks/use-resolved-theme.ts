import { useEffect, useState } from 'react';

import { useTheme } from '@/lib/components/theme-provider';

export function useResolvedTheme(): 'dark' | 'light' {
  const { theme } = useTheme();
  const [resolved, setResolved] = useState<'dark' | 'light'>(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme !== 'system') {
      setResolved(theme === 'dark' ? 'dark' : 'light');
      return;
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setResolved(mq.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) =>
      setResolved(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return resolved;
}

import { loader } from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';

import { useParsleyStore } from '@/lib/stores/parsley-store';
import { defineMonacoTheme } from '@/lib/utils/define-monaco-theme';
import { DEFAULT_MONACO_THEME } from '@/lib/utils/monaco-themes';

export function useMonacoTheme() {
  const monacoTheme = useParsleyStore((s) => s.monacoTheme);
  const setMonacoTheme = useParsleyStore((s) => s.setMonacoTheme);
  const initialLoad = useRef(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (initialLoad.current) {
      setReady(false);
    }

    loader
      .init()
      .then(async (monaco) => {
        await defineMonacoTheme(monaco, monacoTheme);
        if (!cancelled) {
          initialLoad.current = false;
          setReady(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load Monaco theme:', err);
        if (!cancelled) {
          setMonacoTheme(DEFAULT_MONACO_THEME);
          initialLoad.current = false;
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [monacoTheme, setMonacoTheme]);

  return { monacoTheme, ready };
}

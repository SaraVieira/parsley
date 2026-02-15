import { DiffEditor } from '@monaco-editor/react';
import { useMemo } from 'react';

import { EditorLoading } from '@/lib/components/editor-loading';
import { useResolvedTheme } from '@/lib/hooks/use-resolved-theme';
import { useParsleyStore } from '@/lib/stores/parsley-store';

export function DiffView() {
  const resolvedTheme = useResolvedTheme();
  const monacoTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'light';
  const parsedJson = useParsleyStore((s) => s.parsedJson);
  const transformedJson = useParsleyStore((s) => s.transformedJson);

  const original = useMemo(() => {
    try {
      return JSON.stringify(parsedJson, null, 2);
    } catch {
      return String(parsedJson);
    }
  }, [parsedJson]);

  const modified = useMemo(() => {
    try {
      return JSON.stringify(transformedJson, null, 2);
    } catch {
      return String(transformedJson);
    }
  }, [transformedJson]);

  return (
    <DiffEditor
      loading={<EditorLoading />}
      language="json"
      theme={monacoTheme}
      original={original}
      modified={modified}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        renderSideBySide: true,
      }}
    />
  );
}

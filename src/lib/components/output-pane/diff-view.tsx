import { DiffEditor } from '@monaco-editor/react';
import { useMemo } from 'react';

import { EditorLoading } from '@/lib/components/editor-loading';
import { useMonacoTheme } from '@/lib/hooks/use-monaco-theme';
import { useParsleyStore } from '@/lib/stores/parsley-store';

export function DiffView() {
  const { monacoTheme, ready: themeReady } = useMonacoTheme();
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

  if (!themeReady) {
    return <EditorLoading />;
  }

  if (original === modified) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No differences to show</p>
          <p className="mt-1 text-xs">
            Run a transform to see differences between the original and
            transformed JSON
          </p>
        </div>
      </div>
    );
  }

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

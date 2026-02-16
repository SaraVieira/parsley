import Editor from '@monaco-editor/react';
import { useMemo } from 'react';

import { EditorLoading } from '@/lib/components/editor-loading';

type TextViewProps = {
  data: unknown;
};

export function TextView({ data }: TextViewProps) {
  const monacoTheme = 'vs-dark';

  const text = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  return (
    <Editor
      loading={<EditorLoading />}
      language="json"
      theme={monacoTheme}
      value={text}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        tabSize: 2,
      }}
    />
  );
}

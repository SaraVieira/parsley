import Editor from '@monaco-editor/react';

import { EditorLoading } from '@/lib/components/editor-loading';
import { useMonacoTheme } from '@/lib/hooks/use-monaco-theme';

type TextViewProps = {
  data: unknown;
};

export function TextView({ data }: TextViewProps) {
  const { monacoTheme, ready: themeReady } = useMonacoTheme();

  let text: string;
  try {
    text = JSON.stringify(data, null, 2);
  } catch {
    text = String(data);
  }

  if (!themeReady) {
    return <EditorLoading />;
  }

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

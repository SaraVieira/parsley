import Editor, { type Monaco } from '@monaco-editor/react';
import { type DragEvent, useCallback, useRef, useState } from 'react';

import { ConsolePanel } from '@/lib/components/console-panel';
import { EditorLoading } from '@/lib/components/editor-loading';
import { useParsleyStore } from '@/lib/stores/parsley-store';
import { registerTransformCompletions } from '@/lib/utils/snippets/register-completions';

export function EditorPane() {
  const {
    jsonInput,
    jsonError,
    transformCode,
    transformError,
    setJsonInput,
    setTransformCode,
    executeTransform,
    editorTab,
    autoRun,
  } = useParsleyStore();

  const monacoTheme = 'vs-dark';
  const [isDragging, setIsDragging] = useState(false);
  const snippetsRegistered = useRef(false);
  const autoRunTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTransformEditorMount = useCallback(
    (_editor: unknown, monaco: Monaco) => {
      if (!snippetsRegistered.current) {
        registerTransformCompletions(monaco);
        snippetsRegistered.current = true;
      }
    },
    [],
  );

  const handleTransformChange = useCallback(
    (value: string | undefined) => {
      setTransformCode(value ?? '');
      if (autoRun) {
        if (autoRunTimerRef.current) {
          clearTimeout(autoRunTimerRef.current);
        }
        autoRunTimerRef.current = setTimeout(() => {
          executeTransform();
        }, 500);
      }
    },
    [setTransformCode, autoRun, executeTransform],
  );

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) {
      return;
    }

    if (!file.name.endsWith('.json')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setJsonInput(text);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      role="region"
      aria-label="Editor pane"
      className="flex h-full flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {editorTab === 'json' && (
        <div className="relative flex-1 overflow-hidden">
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-md">
              <p className="text-sm font-medium text-primary">
                Drop JSON file here
              </p>
            </div>
          )}
          <Editor
            loading={<EditorLoading />}
            language="json"
            theme={monacoTheme}
            value={jsonInput}
            onChange={(value) => setJsonInput(value ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
            }}
          />
          {jsonError && (
            <div className="border-t border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {jsonError}
            </div>
          )}
        </div>
      )}

      {editorTab === 'transform' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Editor
              loading={<EditorLoading />}
              language="javascript"
              theme={monacoTheme}
              value={transformCode}
              onChange={handleTransformChange}
              onMount={handleTransformEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>
          {transformError && (
            <div className="border-t border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {transformError}
            </div>
          )}
          <ConsolePanel />
        </div>
      )}
    </div>
  );
}

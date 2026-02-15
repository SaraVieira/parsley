import Editor, { type Monaco } from '@monaco-editor/react';
import { ChevronUp, Trash2 } from 'lucide-react';
import { type DragEvent, useCallback, useRef, useState } from 'react';

import { EditorLoading } from '@/lib/components/editor-loading';
import { useResolvedTheme } from '@/lib/hooks/use-resolved-theme';
import { useParsleyStore } from '@/lib/stores/parsley-store';
import { registerTransformCompletions } from '@/lib/utils/transform-snippets';

function formatLogArg(arg: unknown): string {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

function ConsolePanel() {
  const consoleLogs = useParsleyStore((s) => s.consoleLogs);
  const clearConsoleLogs = useParsleyStore((s) => s.clearConsoleLogs);
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const levelColors: Record<string, string> = {
    log: 'text-foreground',
    info: 'text-blue-500 dark:text-blue-400',
    warn: 'text-amber-500 dark:text-amber-400',
    error: 'text-red-500 dark:text-red-400',
  };

  const levelPrefixes: Record<string, string> = {
    log: '',
    info: '\u2139 ',
    warn: '\u26A0 ',
    error: '\u2717 ',
  };

  return (
    <div
      className={`border-t border-border/60 flex flex-col ${collapsed ? '' : 'min-h-[100px] max-h-[200px]'}`}
    >
      <div className="flex items-center justify-between bg-muted/30 px-2 py-0.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronUp
            className={`size-3 transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
          Console
          {consoleLogs.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 text-[9px]">
              {consoleLogs.length}
            </span>
          )}
        </button>
        {!collapsed && consoleLogs.length > 0 && (
          <button
            onClick={clearConsoleLogs}
            className="text-muted-foreground hover:text-foreground"
            title="Clear console"
          >
            <Trash2 className="size-3" />
          </button>
        )}
      </div>
      {!collapsed && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto px-2 py-1 font-mono text-xs"
        >
          {consoleLogs.length === 0 ? (
            <div className="py-2 text-center text-[10px] text-muted-foreground">
              Use console.log() in your transform to see output here
            </div>
          ) : (
            consoleLogs.map((entry, i) => (
              <div
                key={i}
                className={`py-0.5 whitespace-pre-wrap break-all ${levelColors[entry.level] ?? ''}`}
              >
                <span className="opacity-50">{levelPrefixes[entry.level]}</span>
                {entry.args.map(formatLogArg).join(' ')}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

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

  const resolvedTheme = useResolvedTheme();
  const monacoTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'light';
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

  // Auto-run on transform code change
  const handleTransformChange = useCallback(
    (value: string | undefined) => {
      setTransformCode(value ?? '');
      if (autoRun) {
        if (autoRunTimerRef.current) clearTimeout(autoRunTimerRef.current);
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
    if (!file) return;

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

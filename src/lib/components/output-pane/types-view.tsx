import Editor from '@monaco-editor/react';
import { Check, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EditorLoading } from '@/lib/components/editor-loading';
import { useMonacoTheme } from '@/lib/hooks/use-monaco-theme';
import { useParsleyStore } from '@/lib/stores/parsley-store';
import { jsonToTypeScript } from '@/lib/utils/json-to-types';
import { jsonToZod } from '@/lib/utils/json-to-zod';

type TypesViewProps = {
  data: unknown;
};

type SchemaMode = 'typescript' | 'zod';

export function TypesView({ data }: TypesViewProps) {
  const { monacoTheme, ready: themeReady } = useMonacoTheme();
  const [schemaMode, setSchemaMode] = useState<SchemaMode>('typescript');
  const [copied, setCopied] = useState(false);
  const rootName = useParsleyStore((s) => s.rootName);

  const types = useMemo(
    () =>
      schemaMode === 'zod'
        ? jsonToZod(data, rootName)
        : jsonToTypeScript(data, rootName),
    [data, schemaMode, rootName],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-2 py-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSchemaMode('typescript')}
            className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
              schemaMode === 'typescript'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            TypeScript
          </button>
          <button
            type="button"
            onClick={() => setSchemaMode('zod')}
            className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
              schemaMode === 'zod'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Zod
          </button>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            navigator.clipboard.writeText(types);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        {!themeReady ? (
          <EditorLoading />
        ) : (
          <Editor
            loading={<EditorLoading />}
            language="typescript"
            theme={monacoTheme}
            value={types}
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
        )}
      </div>
    </div>
  );
}

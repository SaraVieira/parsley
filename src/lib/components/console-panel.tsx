import { ChevronUp, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

import { useParsleyStore } from '@/lib/stores/parsley-store';

function formatLogArg(arg: unknown): string {
  if (arg === null) {
    return 'null';
  }
  if (arg === undefined) {
    return 'undefined';
  }
  if (typeof arg === 'string') {
    return arg;
  }
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

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

export function ConsolePanel() {
  const consoleLogs = useParsleyStore((s) => s.consoleLogs);
  const clearConsoleLogs = useParsleyStore((s) => s.clearConsoleLogs);
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`border-t border-border/60 flex flex-col ${collapsed ? '' : 'min-h-[100px] max-h-[200px]'}`}
    >
      <div className="flex items-center justify-between bg-muted/30 px-2 py-0.5">
        <button
          type="button"
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
            type="button"
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
                key={`${entry.level}-${i}`}
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

import {
  AlignLeft,
  Check,
  ChevronDown,
  Play,
  RotateCcw,
  RotateCw,
  Share2,
  WrapText,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useParsleyStore } from '@/lib/stores/parsley-store';
import { TRANSFORM_PRESETS } from '@/lib/utils/constants';
import { createShareUrl } from '@/lib/utils/share-url';

export function Toolbar() {
  const {
    jsonInput,
    transformCode,
    editorTab,
    setEditorTab,
    setJsonInput,
    setTransformCode,
    executeTransform,
    revert,
    reset,
    history,
    autoRun,
    setAutoRun,
    viewMode,
    setViewMode,
  } = useParsleyStore();

  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        executeTransform();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [executeTransform]);

  const handleShare = () => {
    try {
      const url = createShareUrl(jsonInput, transformCode);
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-border px-3 h-10 shrink-0">
      <div className="flex min-w-0 items-center gap-1">
        <div className="flex items-center gap-3 border-r border-border/60 pr-2 mr-1">
          <button
            type="button"
            onClick={() => setEditorTab('json')}
            className={`border-b-2 px-0.5 pb-1 text-xs font-medium transition-colors ${
              editorTab === 'json'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            JSON Input
          </button>
          <button
            type="button"
            onClick={() => setEditorTab('transform')}
            className={`border-b-2 px-0.5 pb-1 text-xs font-medium transition-colors ${
              editorTab === 'transform'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Transform
          </button>
        </div>
        {editorTab === 'transform' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xs">
                Presets
                <ChevronDown className="ml-1 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-75 overflow-y-auto"
            >
              {TRANSFORM_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.label}
                  onClick={() => {
                    setTransformCode(preset.code);
                  }}
                >
                  {preset.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {editorTab === 'json' && (
          <>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                try {
                  setJsonInput(JSON.stringify(JSON.parse(jsonInput), null, 2));
                } catch {
                  /* invalid JSON, ignore */
                }
              }}
              title="Format JSON"
            >
              <WrapText className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                try {
                  setJsonInput(JSON.stringify(JSON.parse(jsonInput)));
                } catch {
                  /* invalid JSON, ignore */
                }
              }}
              title="Minify JSON"
            >
              <AlignLeft className="size-3.5" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={revert}
          disabled={history.length === 0}
          title="Revert last transform"
        >
          <RotateCcw className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={reset}
          title="Reset all"
        >
          <RotateCw className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleShare}
          title="Copy shareable link"
        >
          {shareCopied ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Share2 className="size-3.5" />
          )}
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div className="flex items-center gap-1 border-r border-border/60 pr-2 mr-1">
          {(['graph', 'tree', 'table', 'types', 'diff'] as const).map(
            (mode) => (
              <button
                type="button"
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded px-2 py-1 text-xs font-medium capitalize transition-colors ${
                  viewMode === mode
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ),
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="xs"
              title="Run transform (Cmd+Enter)"
              className="shrink-0"
            >
              {autoRun ? (
                <Zap className="size-3" />
              ) : (
                <Play className="size-3" />
              )}
              {autoRun ? 'Auto' : 'Run'}
              <ChevronDown className="ml-0.5 size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => executeTransform()}>
              <Play className="mr-2 size-3.5" />
              Run now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAutoRun(!autoRun)}>
              <Zap className="mr-2 size-3.5" />
              {autoRun ? 'Disable auto-run' : 'Enable auto-run'}
              {autoRun && <Check className="ml-auto size-3.5 text-primary" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

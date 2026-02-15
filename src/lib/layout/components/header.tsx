import { Check, Copy, Leaf } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/lib/components/theme-toggle';
import { useParsleyStore } from '@/lib/stores/parsley-store';
import { jsonToTypeScript } from '@/lib/utils/json-to-types';

export const Header = () => {
  const { transformedJson, viewMode } = useParsleyStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    try {
      const text =
        viewMode === 'types'
          ? jsonToTypeScript(transformedJson)
          : JSON.stringify(transformedJson, null, 2);
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [transformedJson, viewMode]);

  return (
    <div className="flex items-center justify-between border-b border-border px-3 h-10 shrink-0">
      <div className="flex items-center gap-1.5">
        <Leaf className="size-4 text-primary" />
        <span className="text-sm font-semibold tracking-tight">parsley</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          title="Copy result to clipboard"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
};

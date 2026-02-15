import { Trash2, X } from 'lucide-react';
import { useContext, useState } from 'react';

import { GraphContext } from './graph-context';

export function DeleteButton({
  path,
  keyName,
  className,
  iconSize = 'size-2.5',
}: {
  path: string;
  keyName?: string;
  className: string;
  iconSize?: string;
}) {
  const { onDelete, onBulkDeleteKey } = useContext(GraphContext);
  const [showChoice, setShowChoice] = useState(false);

  if (showChoice && keyName) {
    return (
      <div
        className="nodrag flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            onDelete(path);
            setShowChoice(false);
          }}
          className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive hover:bg-destructive/20"
          title="Delete only this key"
        >
          This
        </button>
        <button
          onClick={() => {
            onBulkDeleteKey(keyName);
            setShowChoice(false);
          }}
          className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
          title="Delete all matching keys"
        >
          All
        </button>
        <button
          onClick={() => setShowChoice(false)}
          className="rounded px-1 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <X className="size-2.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (keyName) {
          setShowChoice(true);
        } else {
          onDelete(path);
        }
      }}
      className={className}
    >
      <Trash2 className={iconSize} />
    </button>
  );
}

import { X } from 'lucide-react';
import { useCallback, useContext, useState } from 'react';

import { GraphContext } from './graph-context';

export function EditableKey({
  keyName,
  path,
}: {
  keyName: string;
  path: string;
}) {
  const { onRenameKey, onBulkRenameKey } = useContext(GraphContext);
  const [editing, setEditing] = useState(false);
  const [showChoice, setShowChoice] = useState(false);
  const [editValue, setEditValue] = useState(keyName);

  const startEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditValue(keyName);
      setEditing(true);
      setShowChoice(false);
    },
    [keyName],
  );

  const handleCommit = useCallback(() => {
    if (!editValue || editValue === keyName) {
      setEditing(false);
      return;
    }
    setEditing(false);
    setShowChoice(true);
  }, [editValue, keyName]);

  if (showChoice) {
    return (
      <div
        role="group"
        className="nodrag flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="text-xs font-medium text-primary">{editValue}</span>
        <button
          type="button"
          onClick={() => {
            onRenameKey(path, editValue);
            setShowChoice(false);
          }}
          className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20"
          title="Rename only this key"
        >
          This
        </button>
        <button
          type="button"
          onClick={() => {
            onBulkRenameKey(keyName, editValue);
            setShowChoice(false);
          }}
          className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
          title="Rename all matching keys"
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setShowChoice(false)}
          className="rounded px-1 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <X className="size-2.5" />
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            handleCommit();
          }
          if (e.key === 'Escape') {
            setEditing(false);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="nodrag w-full min-w-[30px] max-w-[80px] rounded border border-primary bg-transparent px-1 text-xs font-medium outline-none"
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className="shrink-0 font-medium text-muted-foreground cursor-text nodrag"
      onDoubleClick={startEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startEdit(e as unknown as React.MouseEvent);
        }
      }}
    >
      {keyName}
    </span>
  );
}

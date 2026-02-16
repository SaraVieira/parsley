import { useCallback, useContext, useState } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { GraphContext } from './graph-context';
import { MAX_VALUE_LENGTH } from './graph-utils';

export function EditableValue({
  value,
  className,
  path,
}: {
  value: string;
  className: string;
  path: string;
}) {
  const { onEditValue } = useContext(GraphContext);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const startEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditValue(value);
      setEditing(true);
    },
    [value],
  );

  if (editing) {
    return (
      <input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => {
          onEditValue(path, editValue);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            onEditValue(path, editValue);
            setEditing(false);
          }
          if (e.key === 'Escape') {
            setEditing(false);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="nodrag w-full min-w-10 rounded border border-primary bg-transparent px-1 text-xs outline-none"
      />
    );
  }

  if (value.length > MAX_VALUE_LENGTH) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            className={`${className} cursor-help nodrag`}
            onDoubleClick={startEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startEdit(e as unknown as React.MouseEvent);
              }
            }}
          >
            {value.slice(0, MAX_VALUE_LENGTH)}…
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-75 break-all text-xs">
          {value}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className={`${className} cursor-text nodrag`}
      onDoubleClick={startEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startEdit(e as unknown as React.MouseEvent);
        }
      }}
    >
      {value}
    </span>
  );
}

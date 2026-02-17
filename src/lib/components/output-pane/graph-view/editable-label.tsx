import { useContext, useState } from 'react';

import { GraphContext } from './graph-context';

export function EditableLabel({
  label,
  isRoot,
}: {
  label: string;
  isRoot: boolean;
}) {
  const { onRenameRoot } = useContext(GraphContext);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);

  if (!isRoot) {
    return <span>{label}</span>;
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => {
          if (editValue.trim()) {
            onRenameRoot(editValue.trim());
          }
          setEditing(false);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            if (editValue.trim()) {
              onRenameRoot(editValue.trim());
            }
            setEditing(false);
          }
          if (e.key === 'Escape') {
            setEditing(false);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="nodrag w-full min-w-[40px] max-w-[100px] rounded border border-primary bg-transparent px-1 text-xs font-semibold outline-none"
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className="block w-full cursor-text nodrag"
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditValue(label);
        setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          setEditValue(label);
          setEditing(true);
        }
      }}
    >
      {label}
    </span>
  );
}

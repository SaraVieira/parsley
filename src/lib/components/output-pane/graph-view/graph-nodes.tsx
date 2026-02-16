import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';
import { Plus, Trash2 } from 'lucide-react';
import { useContext } from 'react';

import { getValueColor, isSimpleKey } from '@/lib/utils/shared';

import { CollapseToggle } from './collapse-toggle';
import { DeleteButton } from './delete-button';
import { EditableKey } from './editable-key';
import { EditableLabel } from './editable-label';
import { EditableValue } from './editable-value';
import type { EntryData } from './graph-context';
import { GraphContext } from './graph-context';

function useIsHighlighted(nodeId: string) {
  const { highlightedIds } = useContext(GraphContext);
  return highlightedIds.size > 0 ? highlightedIds.has(nodeId) : null;
}

function ObjectNode({
  id,
  data,
}: NodeProps<
  Node<{
    label: string;
    entries?: Array<EntryData>;
    hasChildren?: boolean;
    jsonPath?: string;
  }>
>) {
  const highlighted = useIsHighlighted(id);
  const { onDelete, onAdd } = useContext(GraphContext);
  const dimClass = highlighted === false ? 'opacity-30' : '';
  const ringClass = highlighted === true ? 'ring-2 ring-primary' : '';
  const isRoot = data.jsonPath === '$';
  const isArrayItem = data.label.startsWith('[');
  const headerClass = isRoot
    ? 'bg-primary/15 text-primary'
    : isArrayItem
      ? 'bg-teal-500/10 text-teal-300'
      : 'bg-zinc-500/15 text-zinc-300';
  return (
    <div
      className={`min-w-50 max-w-[320px] rounded-lg border border-white/10 bg-zinc-900 shadow-md ${dimClass} ${ringClass}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="size-1.5! bg-zinc-500/40! cursor-default!"
      />
      <div
        className={`flex items-center rounded-t-lg border-b border-white/10 px-3 py-1.5 text-xs font-semibold ${headerClass}`}
      >
        <div className="flex-1 min-w-0">
          <EditableLabel label={data.label} isRoot={isRoot} />
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          {data.jsonPath && data.jsonPath !== '$' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(data.jsonPath ?? '');
              }}
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3" />
            </button>
          )}
          <CollapseToggle nodeId={id} hasChildren={data.hasChildren} />
        </div>
      </div>
      {data.entries && data.entries.length > 0 && (
        <div className="px-3 py-1.5">
          {data.entries.map((entry) => {
            const entryPath = data.jsonPath
              ? isSimpleKey(entry.key)
                ? `${data.jsonPath}.${entry.key}`
                : `${data.jsonPath}["${entry.key}"]`
              : '';
            return (
              <div
                key={entry.key}
                className="group/entry flex items-center justify-between gap-2 py-0.5 text-xs"
              >
                <EditableKey keyName={entry.key} path={entryPath} />
                <div className="flex items-center gap-1">
                  <EditableValue
                    value={entry.value}
                    className={getValueColor(entry.type)}
                    path={entryPath}
                  />
                  <DeleteButton
                    path={entryPath}
                    keyName={entry.key}
                    className="nodrag shrink-0 rounded p-0.5 text-muted-foreground/0 hover:text-destructive group-hover/entry:text-muted-foreground/50"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {data.jsonPath && (
        <div className="border-t border-white/10 px-3 py-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(data.jsonPath ?? '', false);
            }}
            className="nodrag flex items-center gap-1 rounded border border-dashed border-muted-foreground/30 px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Plus className="size-2.5" /> Add property
          </button>
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="!size-1.5 !bg-zinc-500/40 !cursor-default"
      />
    </div>
  );
}

function ArrayNode({
  id,
  data,
}: NodeProps<
  Node<{
    label: string;
    itemCount?: number;
    hasChildren?: boolean;
    jsonPath?: string;
  }>
>) {
  const highlighted = useIsHighlighted(id);
  const { onDelete, onAdd } = useContext(GraphContext);
  const dimClass = highlighted === false ? 'opacity-30' : '';
  const ringClass = highlighted === true ? 'ring-2 ring-primary' : '';
  const isRoot = data.jsonPath === '$';
  return (
    <div
      className={`min-w-[150px] rounded-lg border border-white/10 bg-zinc-900 shadow-md ${dimClass} ${ringClass}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-1.5 !bg-zinc-500/40 !cursor-default"
      />
      <div className="flex items-center rounded-t-lg border-b border-white/10 bg-teal-500/20 px-3 py-1.5 text-xs font-semibold text-teal-400">
        <div className="flex-1 min-w-0">
          <EditableLabel label={data.label} isRoot={isRoot} />
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          {data.jsonPath && data.jsonPath !== '$' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(data.jsonPath ?? '');
              }}
              className="shrink-0 rounded p-0.5 text-teal-400/50 hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3" />
            </button>
          )}
          <CollapseToggle nodeId={id} hasChildren={data.hasChildren} />
        </div>
      </div>
      <div className="px-3 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
        <span>{data.itemCount} items</span>
      </div>
      {data.jsonPath && (
        <div className="border-t border-white/10 px-3 py-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(data.jsonPath ?? '', true);
            }}
            className="nodrag flex items-center gap-1 rounded border border-dashed border-muted-foreground/30 px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-teal-400/50 hover:text-teal-400"
          >
            <Plus className="size-2.5" /> Add item
          </button>
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="!size-1.5 !bg-zinc-500/40 !cursor-default"
      />
    </div>
  );
}

function ValueNode({
  id,
  data,
}: NodeProps<
  Node<{ label: string; value?: string; valueType?: string; jsonPath?: string }>
>) {
  const highlighted = useIsHighlighted(id);
  const { onDelete } = useContext(GraphContext);
  const dimClass = highlighted === false ? 'opacity-30' : '';
  const ringClass = highlighted === true ? 'ring-2 ring-primary' : '';
  return (
    <div
      className={`min-w-[120px] max-w-[320px] rounded-lg border border-white/10 bg-zinc-900 shadow-md ${dimClass} ${ringClass}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-1.5 !bg-zinc-500/40 !cursor-default"
      />
      <div className="px-3 py-1.5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-muted-foreground">{data.label}</div>
          {data.jsonPath && data.jsonPath !== '$' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(data.jsonPath ?? '');
              }}
              className="nodrag shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-2.5" />
            </button>
          )}
        </div>
        <EditableValue
          value={data.value ?? ''}
          className={`text-xs ${getValueColor(data.valueType ?? '')}`}
          path={data.jsonPath ?? ''}
        />
      </div>
    </div>
  );
}

export const nodeTypes = {
  objectNode: ObjectNode,
  arrayNode: ArrayNode,
  valueNode: ValueNode,
};

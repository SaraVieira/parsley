import {
  Background,
  Controls,
  Handle,
  MarkerType,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import '@xyflow/react/dist/style.css';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useResolvedTheme } from '@/lib/hooks/use-resolved-theme';
import { useParsleyStore } from '@/lib/stores/parsley-store';
import { jsonToGraph } from '@/lib/utils/json-to-graph';

type NodeData = {
  label: string;
  jsonPath?: string;
  entries?: EntryData[];
  itemCount?: number;
  value?: string;
  valueType?: string;
  hasChildren?: boolean;
};

type EntryData = { key: string; value: string; type: string };

const GraphContext = createContext<{
  collapsedIds: Set<string>;
  toggleCollapse: (id: string) => void;
  highlightedIds: Set<string>;
  onEditValue: (path: string, rawValue: string) => void;
  onDelete: (path: string) => void;
  onBulkDeleteKey: (key: string) => void;
  onAdd: (path: string, isArray: boolean) => void;
  onRenameKey: (path: string, newKey: string) => void;
  onBulkRenameKey: (oldKey: string, newKey: string) => void;
  onRenameRoot: (name: string) => void;
}>({
  collapsedIds: new Set(),
  toggleCollapse: () => {},
  highlightedIds: new Set(),
  onEditValue: () => {},
  onDelete: () => {},
  onBulkDeleteKey: () => {},
  onAdd: () => {},
  onRenameKey: () => {},
  onBulkRenameKey: () => {},
  onRenameRoot: () => {},
});

function EditableValue({
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
        autoFocus
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
          if (e.key === 'Escape') setEditing(false);
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="nodrag w-full min-w-[40px] rounded border border-primary bg-transparent px-1 text-xs outline-none"
      />
    );
  }

  if (value.length > MAX_VALUE_LENGTH) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`${className} cursor-help nodrag`}
            onDoubleClick={startEdit}
          >
            {value.slice(0, MAX_VALUE_LENGTH)}…
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-[300px] break-all text-xs"
        >
          {value}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <span
      className={`${className} cursor-text nodrag`}
      onDoubleClick={startEdit}
    >
      {value}
    </span>
  );
}

function EditableKey({ keyName, path }: { keyName: string; path: string }) {
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
        className="nodrag flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="text-xs font-medium text-primary">{editValue}</span>
        <button
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
        autoFocus
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') handleCommit();
          if (e.key === 'Escape') setEditing(false);
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="nodrag w-full min-w-[30px] max-w-[80px] rounded border border-primary bg-transparent px-1 text-xs font-medium outline-none"
      />
    );
  }

  return (
    <span
      className="shrink-0 font-medium text-muted-foreground cursor-text nodrag"
      onDoubleClick={startEdit}
    >
      {keyName}
    </span>
  );
}

function DeleteButton({
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

function useIsHighlighted(nodeId: string) {
  const { highlightedIds } = useContext(GraphContext);
  return highlightedIds.size > 0 ? highlightedIds.has(nodeId) : null; // null = no search active
}

function CollapseToggle({
  nodeId,
  hasChildren,
}: {
  nodeId: string;
  hasChildren?: boolean;
}) {
  const { collapsedIds, toggleCollapse } = useContext(GraphContext);
  if (!hasChildren) return null;
  const isCollapsed = collapsedIds.has(nodeId);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleCollapse(nodeId);
      }}
      className="ml-auto shrink-0 rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
    >
      {isCollapsed ? (
        <ChevronRight className="size-3" />
      ) : (
        <ChevronDown className="size-3" />
      )}
    </button>
  );
}

const MAX_VALUE_LENGTH = 40;

function getValueColor(type: string): string {
  switch (type) {
    case 'string':
      return 'text-emerald-500 dark:text-emerald-400';
    case 'number':
      return 'text-blue-500 dark:text-blue-400';
    case 'boolean':
      return 'text-amber-500 dark:text-amber-400';
    case 'null':
    case 'undefined':
      return 'text-muted-foreground italic';
    default:
      return 'text-foreground';
  }
}

function EditableLabel({ label, isRoot }: { label: string; isRoot: boolean }) {
  const { onRenameRoot } = useContext(GraphContext);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);

  if (!isRoot) return <span>{label}</span>;

  if (editing) {
    return (
      <input
        autoFocus
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => {
          if (editValue.trim()) onRenameRoot(editValue.trim());
          setEditing(false);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            if (editValue.trim()) onRenameRoot(editValue.trim());
            setEditing(false);
          }
          if (e.key === 'Escape') setEditing(false);
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="nodrag w-full min-w-[40px] max-w-[100px] rounded border border-primary bg-transparent px-1 text-xs font-semibold outline-none"
      />
    );
  }

  return (
    <span
      className="block w-full cursor-text nodrag"
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditValue(label);
        setEditing(true);
      }}
    >
      {label}
    </span>
  );
}

function ObjectNode({
  id,
  data,
}: NodeProps<
  Node<{
    label: string;
    entries?: EntryData[];
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
      className={`min-w-[200px] max-w-[320px] rounded-lg border border-border/60 bg-card shadow-md dark:border-white/10 dark:bg-zinc-900 ${dimClass} ${ringClass}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-1.5 !bg-zinc-500/40 !cursor-default"
      />
      <div className="flex items-center rounded-t-lg border-b border-border/60 bg-zinc-500/10 px-3 py-1.5 text-xs font-semibold text-zinc-300 dark:border-white/10 dark:bg-zinc-500/15">
        <div className="flex-1 min-w-0">
          <EditableLabel label={data.label} isRoot={isRoot} />
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          {data.jsonPath && data.jsonPath !== '$' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(data.jsonPath!);
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
              ? /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(entry.key)
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
        <div className="border-t border-border/60 dark:border-white/10 px-3 py-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd(data.jsonPath!, false);
            }}
            className="nodrag flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
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
      className={`min-w-[150px] rounded-lg border border-border/60 bg-card shadow-md dark:border-white/10 dark:bg-zinc-900 ${dimClass} ${ringClass}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-1.5 !bg-zinc-500/40 !cursor-default"
      />
      <div className="flex items-center rounded-t-lg border-b border-border/60 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-600 dark:border-white/10 dark:bg-teal-500/20 dark:text-teal-400">
        <div className="flex-1 min-w-0">
          <EditableLabel label={data.label} isRoot={isRoot} />
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          {data.jsonPath && data.jsonPath !== '$' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(data.jsonPath!);
              }}
              className="shrink-0 rounded p-0.5 text-teal-600/50 hover:text-destructive hover:bg-destructive/10 dark:text-teal-400/50"
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
        <div className="border-t border-border/60 dark:border-white/10 px-3 py-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd(data.jsonPath!, true);
            }}
            className="nodrag flex items-center gap-1 text-[10px] text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400"
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
      className={`min-w-[120px] max-w-[320px] rounded-lg border border-border/60 bg-card shadow-md dark:border-white/10 dark:bg-zinc-900 ${dimClass} ${ringClass}`}
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
              onClick={(e) => {
                e.stopPropagation();
                onDelete(data.jsonPath!);
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

const nodeTypes = {
  objectNode: ObjectNode,
  arrayNode: ArrayNode,
  valueNode: ValueNode,
};

const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  style: { strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
};

type GraphViewProps = {
  data: unknown;
};

const MAX_GRAPH_NODES = 1000;

function parseDisplayValue(display: string): unknown {
  // Remove surrounding quotes for strings
  if (display.startsWith('"') && display.endsWith('"')) {
    return display.slice(1, -1);
  }
  if (display === 'null') return null;
  if (display === 'true') return true;
  if (display === 'false') return false;
  if (display === 'undefined') return undefined;
  const num = Number(display);
  if (!isNaN(num) && display.trim() !== '') return num;
  // Treat as string if nothing else matches
  return display;
}

export function GraphView({ data }: GraphViewProps) {
  const resolvedTheme = useResolvedTheme();
  const updateValueAtPath = useParsleyStore((s) => s.updateValueAtPath);
  const storeDeleteAtPath = useParsleyStore((s) => s.deleteAtPath);
  const storeAddAtPath = useParsleyStore((s) => s.addAtPath);
  const storeRenameKeyAtPath = useParsleyStore((s) => s.renameKeyAtPath);
  const rootName = useParsleyStore((s) => s.rootName);
  const setRootName = useParsleyStore((s) => s.setRootName);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const onEditValue = useCallback(
    (path: string, rawValue: string) => {
      if (!path) return;
      const value = parseDisplayValue(rawValue);
      updateValueAtPath(path, value);
    },
    [updateValueAtPath],
  );

  const onDelete = useCallback(
    (path: string) => {
      if (!path || path === '$') return;
      storeDeleteAtPath(path);
    },
    [storeDeleteAtPath],
  );

  const onAdd = useCallback(
    (path: string, isArray: boolean) => {
      if (!path) return;
      if (isArray) {
        storeAddAtPath(path, '', null);
      } else {
        storeAddAtPath(path, 'newKey', null);
      }
    },
    [storeAddAtPath],
  );

  const storeBulkRenameKey = useParsleyStore((s) => s.bulkRenameKey);
  const storeBulkDeleteKey = useParsleyStore((s) => s.bulkDeleteKey);

  const onRenameKey = useCallback(
    (path: string, newKey: string) => {
      if (!path) return;
      storeRenameKeyAtPath(path, newKey);
    },
    [storeRenameKeyAtPath],
  );

  const onBulkRenameKey = useCallback(
    (oldKey: string, newKey: string) => {
      storeBulkRenameKey(oldKey, newKey);
    },
    [storeBulkRenameKey],
  );

  const onBulkDeleteKey = useCallback(
    (key: string) => {
      storeBulkDeleteKey(key);
    },
    [storeBulkDeleteKey],
  );

  const onRenameRoot = useCallback(
    (name: string) => {
      setRootName(name);
    },
    [setRootName],
  );

  const toggleCollapse = useCallback((nodeId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const path = (node.data as NodeData).jsonPath;
    if (path) setSelectedPath(path);
  }, []);

  const handleCopyPath = useCallback(() => {
    if (selectedPath) {
      navigator.clipboard.writeText(selectedPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [selectedPath]);

  const { allNodes, allEdges, isTruncated } = useMemo(() => {
    const { nodes, edges } = jsonToGraph(data, rootName);
    if (nodes.length > MAX_GRAPH_NODES) {
      const truncatedNodes = nodes.slice(0, MAX_GRAPH_NODES);
      const nodeIds = new Set(truncatedNodes.map((n) => n.id));
      return {
        allNodes: truncatedNodes,
        allEdges: edges.filter(
          (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
        ),
        isTruncated: nodes.length,
      };
    }
    return { allNodes: nodes, allEdges: edges, isTruncated: 0 };
  }, [data, rootName]);

  const { computedNodes, computedEdges } = useMemo(() => {
    if (collapsedIds.size === 0)
      return { computedNodes: allNodes, computedEdges: allEdges };

    // Build parent->children map
    const childrenMap = new Map<string, string[]>();
    for (const edge of allEdges) {
      const children = childrenMap.get(edge.source) || [];
      children.push(edge.target);
      childrenMap.set(edge.source, children);
    }

    // Collect all hidden node IDs (descendants of collapsed nodes)
    const hiddenIds = new Set<string>();
    function hideDescendants(nodeId: string) {
      const children = childrenMap.get(nodeId) || [];
      for (const childId of children) {
        hiddenIds.add(childId);
        hideDescendants(childId);
      }
    }
    for (const collapsedId of collapsedIds) {
      hideDescendants(collapsedId);
    }

    return {
      computedNodes: allNodes.filter((n) => !hiddenIds.has(n.id)),
      computedEdges: allEdges.filter((e) => !hiddenIds.has(e.target)),
    };
  }, [allNodes, allEdges, collapsedIds]);

  const highlightedIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    const matches = new Set<string>();
    for (const node of computedNodes) {
      const d = node.data as NodeData;
      const searchableTexts = [d.label, d.value, d.jsonPath];
      if (d.entries) {
        for (const entry of d.entries) {
          searchableTexts.push(entry.key, entry.value);
        }
      }
      if (searchableTexts.some((t) => t && t.toLowerCase().includes(q))) {
        matches.add(node.id);
      }
    }
    return matches;
  }, [searchQuery, computedNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges);

  useEffect(() => {
    setNodes(computedNodes);
    setEdges(computedEdges);
  }, [computedNodes, computedEdges, setNodes, setEdges]);

  return (
    <div className="h-full w-full relative">
      {isTruncated > 0 && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          Showing {MAX_GRAPH_NODES} of {isTruncated.toLocaleString()} nodes. Use
          Text view for full data.
        </div>
      )}
      <div className="absolute top-2 right-2 z-10">
        <div className="flex items-center gap-1 rounded-md border bg-card px-2 py-1 shadow-sm">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="w-32 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <>
              <span className="text-[10px] text-muted-foreground">
                {highlightedIds.size} found
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </>
          )}
        </div>
      </div>
      <GraphContext.Provider
        value={{
          collapsedIds,
          toggleCollapse,
          highlightedIds,
          onEditValue,
          onDelete,
          onBulkDeleteKey,
          onAdd,
          onRenameKey,
          onBulkRenameKey,
          onRenameRoot,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedPath(null)}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          nodesConnectable={false}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          colorMode={resolvedTheme}
          proOptions={{ hideAttribution: true }}
          minZoom={0.1}
          maxZoom={2}
        >
          <Background gap={16} size={1} />
          <Controls />
        </ReactFlow>
      </GraphContext.Provider>
      {selectedPath && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 shadow-sm">
          <code className="text-xs font-mono text-primary">{selectedPath}</code>
          <button
            onClick={handleCopyPath}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

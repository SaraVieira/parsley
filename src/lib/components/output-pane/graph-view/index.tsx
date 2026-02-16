import {
  Background,
  Controls,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { Check, Copy, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import '@xyflow/react/dist/style.css';

import { useResolvedTheme } from '@/lib/hooks/use-resolved-theme';
import { useParsleyStore } from '@/lib/stores/parsley-store';
import { jsonToGraph } from '@/lib/utils/json-to-graph';

import { GraphContext, type NodeData } from './graph-context';
import { nodeTypes } from './graph-nodes';
import {
  defaultEdgeOptions,
  MAX_GRAPH_NODES,
  parseDisplayValue,
} from './graph-utils';

type GraphViewProps = {
  data: unknown;
};

export function GraphView({ data }: GraphViewProps) {
  const resolvedTheme = useResolvedTheme();
  const updateValueAtPath = useParsleyStore((s) => s.updateValueAtPath);
  const storeDeleteAtPath = useParsleyStore((s) => s.deleteAtPath);
  const storeAddAtPath = useParsleyStore((s) => s.addAtPath);
  const storeRenameKeyAtPath = useParsleyStore((s) => s.renameKeyAtPath);
  const rootName = useParsleyStore((s) => s.rootName);
  const setRootName = useParsleyStore((s) => s.setRootName);
  const storeBulkRenameKey = useParsleyStore((s) => s.bulkRenameKey);
  const storeBulkDeleteKey = useParsleyStore((s) => s.bulkDeleteKey);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const onEditValue = useCallback(
    (path: string, rawValue: string) => {
      if (!path) {
        return;
      }
      const value = parseDisplayValue(rawValue);
      updateValueAtPath(path, value);
    },
    [updateValueAtPath],
  );

  const onDelete = useCallback(
    (path: string) => {
      if (!path || path === '$') {
        return;
      }
      storeDeleteAtPath(path);
    },
    [storeDeleteAtPath],
  );

  const onAdd = useCallback(
    (path: string, isArray: boolean) => {
      if (!path) {
        return;
      }
      if (isArray) {
        storeAddAtPath(path, '', null);
      } else {
        storeAddAtPath(path, 'newKey', null);
      }
    },
    [storeAddAtPath],
  );

  const onRenameKey = useCallback(
    (path: string, newKey: string) => {
      if (!path) {
        return;
      }
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
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const path = (node.data as NodeData).jsonPath;
    if (path) {
      setSelectedPath(path);
    }
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
    if (collapsedIds.size === 0) {
      return { computedNodes: allNodes, computedEdges: allEdges };
    }

    const childrenMap = new Map<string, Array<string>>();
    for (const edge of allEdges) {
      const children = childrenMap.get(edge.source) || [];
      children.push(edge.target);
      childrenMap.set(edge.source, children);
    }

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
    if (!searchQuery.trim()) {
      return new Set<string>();
    }
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
      if (searchableTexts.some((t) => t?.toLowerCase().includes(q))) {
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
                type="button"
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
            type="button"
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

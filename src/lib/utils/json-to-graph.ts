import type { Edge, Node } from '@xyflow/react';

import { getValueDisplay, isPrimitive, isSimpleKey } from '@/lib/utils/shared';

const NODE_WIDTH = 250;
const NODE_HEIGHT_BASE = 40;
const NODE_HEIGHT_PER_FIELD = 28;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 30;

type NodeData = {
  label: string;
  entries?: Array<{ key: string; value: string; type: string }>;
  itemCount?: number;
  value?: string;
  valueType?: string;
  jsonPath?: string;
  hasChildren?: boolean;
  [key: string]: unknown;
};

type LayoutResult = {
  nodes: Array<Node<NodeData>>;
  edges: Array<Edge>;
  height: number;
};

type GraphContext = {
  key: string;
  parentId: string | null;
  x: number;
  y: number;
  idCounter: { current: number };
  jsonPath: string;
};

function addEdge(
  edges: Array<Edge>,
  parentId: string | null,
  nodeId: string,
): void {
  if (parentId) {
    edges.push({
      id: `edge-${parentId}-${nodeId}`,
      source: parentId,
      target: nodeId,
    });
  }
}

function buildChildGraphs(
  items: Array<[string, unknown, string]>,
  parentNodeId: string,
  x: number,
  startY: number,
  idCounter: { current: number },
  nodes: Array<Node<NodeData>>,
  edges: Array<Edge>,
): number {
  let childY = startY;
  const childX = x + NODE_WIDTH + HORIZONTAL_GAP;
  for (const [childKey, childData, childPath] of items) {
    const childResult = buildGraph(
      childData,
      childKey,
      parentNodeId,
      childX,
      childY,
      idCounter,
      childPath,
    );
    nodes.push(...childResult.nodes);
    edges.push(...childResult.edges);
    childY += childResult.height + VERTICAL_GAP;
  }
  return childY;
}

function buildArrayGraph(
  data: Array<unknown>,
  nodeId: string,
  ctx: GraphContext,
): LayoutResult {
  const nodes: Array<Node<NodeData>> = [];
  const edges: Array<Edge> = [];

  nodes.push({
    id: nodeId,
    type: 'arrayNode',
    position: { x: ctx.x, y: ctx.y },
    data: {
      label: ctx.key,
      itemCount: data.length,
      jsonPath: ctx.jsonPath,
      hasChildren: data.length > 0,
    },
  });
  addEdge(edges, ctx.parentId, nodeId);

  const items: Array<[string, unknown, string]> = data.map((item, i) => [
    `[${i}]`,
    item,
    `${ctx.jsonPath}[${i}]`,
  ]);
  const childY = buildChildGraphs(
    items,
    nodeId,
    ctx.x,
    ctx.y,
    ctx.idCounter,
    nodes,
    edges,
  );
  const totalHeight = Math.max(
    NODE_HEIGHT_BASE + NODE_HEIGHT_PER_FIELD,
    childY - ctx.y,
  );
  return { nodes, edges, height: totalHeight };
}

function buildObjectGraph(
  data: Record<string, unknown>,
  nodeId: string,
  ctx: GraphContext,
): LayoutResult {
  const nodes: Array<Node<NodeData>> = [];
  const edges: Array<Edge> = [];

  const primitiveEntries: Array<{ key: string; value: string; type: string }> =
    [];
  const complexItems: Array<[string, unknown, string]> = [];

  for (const [k, v] of Object.entries(data)) {
    if (isPrimitive(v)) {
      const { display, type } = getValueDisplay(v);
      primitiveEntries.push({ key: k, value: display, type });
    } else {
      const childPath = isSimpleKey(k)
        ? `${ctx.jsonPath}.${k}`
        : `${ctx.jsonPath}["${k}"]`;
      complexItems.push([k, v, childPath]);
    }
  }

  const nodeHeight =
    NODE_HEIGHT_BASE + primitiveEntries.length * NODE_HEIGHT_PER_FIELD;
  nodes.push({
    id: nodeId,
    type: 'objectNode',
    position: { x: ctx.x, y: ctx.y },
    data: {
      label: ctx.key,
      entries: primitiveEntries,
      jsonPath: ctx.jsonPath,
      hasChildren: complexItems.length > 0,
    },
  });
  addEdge(edges, ctx.parentId, nodeId);

  const childY = buildChildGraphs(
    complexItems,
    nodeId,
    ctx.x,
    ctx.y,
    ctx.idCounter,
    nodes,
    edges,
  );
  const totalHeight = Math.max(nodeHeight, childY - ctx.y);
  return { nodes, edges, height: totalHeight };
}

function buildGraph(
  data: unknown,
  key: string,
  parentId: string | null,
  x: number,
  y: number,
  idCounter: { current: number },
  jsonPath: string = '$',
): LayoutResult {
  const nodeId = `node-${idCounter.current++}`;
  const ctx: GraphContext = { key, parentId, x, y, idCounter, jsonPath };

  if (isPrimitive(data)) {
    const { display, type } = getValueDisplay(data);
    const nodes: Array<Node<NodeData>> = [
      {
        id: nodeId,
        type: 'valueNode',
        position: { x, y },
        data: { label: key, value: display, valueType: type, jsonPath },
      },
    ];
    const edges: Array<Edge> = [];
    addEdge(edges, parentId, nodeId);
    return { nodes, edges, height: NODE_HEIGHT_BASE + NODE_HEIGHT_PER_FIELD };
  }

  if (Array.isArray(data)) {
    return buildArrayGraph(data, nodeId, ctx);
  }

  if (typeof data === 'object' && data !== null) {
    return buildObjectGraph(data as Record<string, unknown>, nodeId, ctx);
  }

  return { nodes: [], edges: [], height: 0 };
}

export function jsonToGraph(
  data: unknown,
  rootLabel = 'root',
): {
  nodes: Array<Node<NodeData>>;
  edges: Array<Edge>;
} {
  const idCounter = { current: 0 };
  const result = buildGraph(data, rootLabel, null, 0, 0, idCounter);
  return { nodes: result.nodes, edges: result.edges };
}

import type { Edge, Node } from '@xyflow/react';

import { isSimpleKey } from '@/lib/utils/shared';

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

function getValueDisplay(value: unknown): { display: string; type: string } {
  if (value === null) {
    return { display: 'null', type: 'null' };
  }
  if (value === undefined) {
    return { display: 'undefined', type: 'undefined' };
  }
  if (typeof value === 'string') {
    return { display: `"${value}"`, type: 'string' };
  }
  if (typeof value === 'number') {
    return { display: String(value), type: 'number' };
  }
  if (typeof value === 'boolean') {
    return { display: String(value), type: 'boolean' };
  }
  if (Array.isArray(value)) {
    return { display: `Array(${value.length})`, type: 'array' };
  }
  return { display: 'Object', type: 'object' };
}

function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: recursive graph builder
function buildGraph(
  data: unknown,
  key: string,
  parentId: string | null,
  x: number,
  y: number,
  idCounter: { current: number },
  jsonPath: string = '$',
): LayoutResult {
  const nodes: Array<Node<NodeData>> = [];
  const edges: Array<Edge> = [];
  const nodeId = `node-${idCounter.current++}`;

  if (isPrimitive(data)) {
    const { display, type } = getValueDisplay(data);
    const node: Node<NodeData> = {
      id: nodeId,
      type: 'valueNode',
      position: { x, y },
      data: { label: key, value: display, valueType: type, jsonPath },
    };
    nodes.push(node);
    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
      });
    }
    return { nodes, edges, height: NODE_HEIGHT_BASE + NODE_HEIGHT_PER_FIELD };
  }

  if (Array.isArray(data)) {
    const node: Node<NodeData> = {
      id: nodeId,
      type: 'arrayNode',
      position: { x, y },
      data: {
        label: key,
        itemCount: data.length,
        jsonPath,
        hasChildren: data.length > 0,
      },
    };
    nodes.push(node);
    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
      });
    }

    let childY = y;
    const childX = x + NODE_WIDTH + HORIZONTAL_GAP;

    for (let i = 0; i < data.length; i++) {
      const childResult = buildGraph(
        data[i],
        `[${i}]`,
        nodeId,
        childX,
        childY,
        idCounter,
        `${jsonPath}[${i}]`,
      );
      nodes.push(...childResult.nodes);
      edges.push(...childResult.edges);
      childY += childResult.height + VERTICAL_GAP;
    }

    const totalHeight = Math.max(
      NODE_HEIGHT_BASE + NODE_HEIGHT_PER_FIELD,
      childY - y,
    );
    return { nodes, edges, height: totalHeight };
  }

  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    const primitiveEntries: Array<{
      key: string;
      value: string;
      type: string;
    }> = [];
    const complexEntries: Array<[string, unknown]> = [];

    for (const [k, v] of entries) {
      if (isPrimitive(v)) {
        const { display, type } = getValueDisplay(v);
        primitiveEntries.push({ key: k, value: display, type });
      } else {
        complexEntries.push([k, v]);
      }
    }

    const nodeHeight =
      NODE_HEIGHT_BASE + primitiveEntries.length * NODE_HEIGHT_PER_FIELD;

    const node: Node<NodeData> = {
      id: nodeId,
      type: 'objectNode',
      position: { x, y },
      data: {
        label: key,
        entries: primitiveEntries,
        jsonPath,
        hasChildren: complexEntries.length > 0,
      },
    };
    nodes.push(node);
    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
      });
    }

    let childY = y;
    const childX = x + NODE_WIDTH + HORIZONTAL_GAP;

    for (const [k, v] of complexEntries) {
      const childPath = isSimpleKey(k)
        ? `${jsonPath}.${k}`
        : `${jsonPath}["${k}"]`;
      const childResult = buildGraph(
        v,
        k,
        nodeId,
        childX,
        childY,
        idCounter,
        childPath,
      );
      nodes.push(...childResult.nodes);
      edges.push(...childResult.edges);
      childY += childResult.height + VERTICAL_GAP;
    }

    const totalHeight = Math.max(nodeHeight, childY - y);
    return { nodes, edges, height: totalHeight };
  }

  return { nodes, edges, height: 0 };
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

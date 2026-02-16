import { MarkerType } from '@xyflow/react';

export const MAX_VALUE_LENGTH = 40;
export const MAX_GRAPH_NODES = 1000;

export const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  style: { strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
};

export function parseDisplayValue(display: string): unknown {
  if (display.startsWith('"') && display.endsWith('"')) {
    return display.slice(1, -1);
  }
  if (display === 'null') {
    return null;
  }
  if (display === 'true') {
    return true;
  }
  if (display === 'false') {
    return false;
  }
  if (display === 'undefined') {
    return undefined;
  }
  const num = Number(display);
  if (!Number.isNaN(num) && display.trim() !== '') {
    return num;
  }
  return display;
}

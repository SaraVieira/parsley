import { MarkerType } from '@xyflow/react';

export const MAX_VALUE_LENGTH = 40;
export const MAX_GRAPH_NODES = 1000;

export const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  style: { strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
};

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;

export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return unitIndex === 0
    ? `${size} ${BYTE_UNITS[unitIndex]}`
    : `${size.toFixed(1)} ${BYTE_UNITS[unitIndex]}`;
}

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

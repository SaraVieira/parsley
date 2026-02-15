import { createContext } from 'react';

export type NodeData = {
  label: string;
  jsonPath?: string;
  entries?: EntryData[];
  itemCount?: number;
  value?: string;
  valueType?: string;
  hasChildren?: boolean;
};

export type EntryData = { key: string; value: string; type: string };

export type GraphContextValue = {
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
};

export const GraphContext = createContext<GraphContextValue>({
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

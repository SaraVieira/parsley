import { AlertTriangle } from 'lucide-react';

import { JsonTreeView } from '@/lib/components/json-tree-view';
import { useParsleyStore } from '@/lib/stores/parsley-store';

import { DiffView } from './diff-view';
import { GraphView } from './graph-view';
import { TableView } from './table-view';
import { TypesView } from './types-view';

export function OutputPane() {
  const { transformedJson, transformError, viewMode } = useParsleyStore();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {transformError && (
        <div className="flex shrink-0 items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span className="truncate">Transform error: {transformError}</span>
        </div>
      )}
      <div className="min-h-0 flex-1">
        {viewMode === 'graph' && <GraphView data={transformedJson} />}
        {viewMode === 'tree' && <JsonTreeView data={transformedJson} />}
        {viewMode === 'types' && <TypesView data={transformedJson} />}
        {viewMode === 'table' && <TableView data={transformedJson} />}
        {viewMode === 'diff' && <DiffView />}
      </div>
    </div>
  );
}

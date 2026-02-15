import { JsonTreeView } from '@/lib/components/json-tree-view';
import { useParsleyStore } from '@/lib/stores/parsley-store';

import { DiffView } from './diff-view';
import { GraphView } from './graph-view';
import { TableView } from './table-view';
import { TypesView } from './types-view';

export function OutputPane() {
  const { transformedJson, viewMode } = useParsleyStore();

  return (
    <div className="h-full overflow-hidden">
      {viewMode === 'graph' && <GraphView data={transformedJson} />}
      {viewMode === 'tree' && <JsonTreeView data={transformedJson} />}
      {viewMode === 'types' && <TypesView data={transformedJson} />}
      {viewMode === 'table' && <TableView data={transformedJson} />}
      {viewMode === 'diff' && <DiffView />}
    </div>
  );
}

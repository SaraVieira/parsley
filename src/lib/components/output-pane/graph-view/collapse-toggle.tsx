import { ChevronDown, ChevronRight } from 'lucide-react';
import { useContext } from 'react';

import { GraphContext } from './graph-context';

export function CollapseToggle({
  nodeId,
  hasChildren,
}: {
  nodeId: string;
  hasChildren?: boolean;
}) {
  const { collapsedIds, toggleCollapse } = useContext(GraphContext);
  if (!hasChildren) {
    return null;
  }
  const isCollapsed = collapsedIds.has(nodeId);
  return (
    <button
      type="button"
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

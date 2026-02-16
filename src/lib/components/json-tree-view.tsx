import { ChevronDown, ChevronRight } from 'lucide-react';
import { useCallback, useState } from 'react';

import { getValueColor, isSimpleKey } from '@/lib/utils/shared';

type JsonTreeViewProps = {
  data: unknown;
  onSelect?: (path: string, value: unknown) => void;
};

export function JsonTreeView({ data, onSelect }: JsonTreeViewProps) {
  return (
    <div className="h-full overflow-auto p-2 font-mono text-xs">
      <TreeNode
        keyName="$"
        value={data}
        path="$"
        depth={0}
        onSelect={onSelect}
        defaultExpanded
      />
    </div>
  );
}

type TreeNodeProps = {
  keyName: string;
  value: unknown;
  path: string;
  depth: number;
  onSelect?: (path: string, value: unknown) => void;
  defaultExpanded?: boolean;
};

function getLeafDisplay(value: unknown): { display: string; type: string } {
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
  return { display: String(value), type: 'unknown' };
}

function LeafNode({
  keyName,
  display,
  colorClass,
  depth,
  onClick,
}: {
  keyName: string;
  display: string;
  colorClass: string;
  depth: number;
  onClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="flex items-center gap-1 py-0.5 hover:bg-muted/50 rounded px-1 cursor-pointer"
      style={{ paddingLeft: depth * 16 }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      }}
    >
      <span className="w-4" />
      <span className="text-muted-foreground">{keyName}:</span>
      <span className={colorClass}>{display}</span>
    </div>
  );
}

function TreeNode({
  keyName,
  value,
  path,
  depth,
  onSelect,
  defaultExpanded = false,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded || depth < 2);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      onSelect?.(path, value);
    },
    [path, value, onSelect],
  );

  // Primitive values
  if (value === null || value === undefined || typeof value !== 'object') {
    const { display, type } = getLeafDisplay(value);
    return (
      <LeafNode
        keyName={keyName}
        display={display}
        colorClass={getValueColor(type)}
        depth={depth}
        onClick={handleClick}
      />
    );
  }

  if (Array.isArray(value)) {
    return (
      <div>
        <div
          role="button"
          tabIndex={0}
          className="flex items-center gap-1 py-0.5 hover:bg-muted/50 rounded px-1 cursor-pointer"
          style={{ paddingLeft: depth * 16 }}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggle(e as unknown as React.MouseEvent);
            }
          }}
        >
          <button
            type="button"
            onClick={toggle}
            className="w-4 shrink-0 flex items-center justify-center"
          >
            {expanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </button>
          <span className="text-muted-foreground">{keyName}:</span>
          <span className="text-teal-400">Array({value.length})</span>
        </div>
        {expanded && (
          <div>
            {value.map((item, i) => {
              const childPath = `${path}[${i}]`;
              return (
                <TreeNode
                  key={childPath}
                  keyName={`[${i}]`}
                  value={item}
                  path={childPath}
                  depth={depth + 1}
                  onSelect={onSelect}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        className="flex items-center gap-1 py-0.5 hover:bg-muted/50 rounded px-1 cursor-pointer"
        style={{ paddingLeft: depth * 16 }}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle(e as unknown as React.MouseEvent);
          }
        }}
      >
        <button
          type="button"
          onClick={toggle}
          className="w-4 shrink-0 flex items-center justify-center"
        >
          {expanded ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
        </button>
        <span className="text-muted-foreground">{keyName}:</span>
        <span className="text-primary">{`{${entries.length}}`}</span>
      </div>
      {expanded && (
        <div>
          {entries.map(([k, v]) => {
            const childPath = isSimpleKey(k)
              ? `${path}.${k}`
              : `${path}["${k}"]`;
            return (
              <TreeNode
                key={childPath}
                keyName={k}
                value={v}
                path={childPath}
                depth={depth + 1}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

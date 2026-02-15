import { ChevronDown, ChevronRight } from 'lucide-react';
import { useCallback, useState } from 'react';

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
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect?.(path, value);
    },
    [path, value, onSelect],
  );

  if (value === null) {
    return (
      <div
        className="flex items-center gap-1 py-0.5 hover:bg-muted/50 rounded px-1 cursor-pointer"
        style={{ paddingLeft: depth * 16 }}
        onClick={handleClick}
      >
        <span className="w-4" />
        <span className="text-muted-foreground">{keyName}:</span>
        <span className="text-muted-foreground italic">null</span>
      </div>
    );
  }

  if (value === undefined) {
    return (
      <div
        className="flex items-center gap-1 py-0.5 hover:bg-muted/50 rounded px-1 cursor-pointer"
        style={{ paddingLeft: depth * 16 }}
        onClick={handleClick}
      >
        <span className="w-4" />
        <span className="text-muted-foreground">{keyName}:</span>
        <span className="text-muted-foreground italic">undefined</span>
      </div>
    );
  }

  if (typeof value === 'string') {
    return (
      <div
        className="flex items-center gap-1 py-0.5 hover:bg-muted/50 rounded px-1 cursor-pointer"
        style={{ paddingLeft: depth * 16 }}
        onClick={handleClick}
      >
        <span className="w-4" />
        <span className="text-muted-foreground">{keyName}:</span>
        <span className="text-emerald-500 dark:text-emerald-400 truncate max-w-[300px]">
          "{value}"
        </span>
      </div>
    );
  }

  if (typeof value === 'number') {
    return (
      <div
        className="flex items-center gap-1 py-0.5 hover:bg-muted/50 rounded px-1 cursor-pointer"
        style={{ paddingLeft: depth * 16 }}
        onClick={handleClick}
      >
        <span className="w-4" />
        <span className="text-muted-foreground">{keyName}:</span>
        <span className="text-blue-500 dark:text-blue-400">{value}</span>
      </div>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <div
        className="flex items-center gap-1 py-0.5 hover:bg-muted/50 rounded px-1 cursor-pointer"
        style={{ paddingLeft: depth * 16 }}
        onClick={handleClick}
      >
        <span className="w-4" />
        <span className="text-muted-foreground">{keyName}:</span>
        <span className="text-amber-500 dark:text-amber-400">
          {String(value)}
        </span>
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div>
        <div
          className="flex items-center gap-1 py-0.5 hover:bg-muted/50 rounded px-1 cursor-pointer"
          style={{ paddingLeft: depth * 16 }}
          onClick={toggle}
        >
          <button
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
          <span className="text-teal-600 dark:text-teal-400">
            Array({value.length})
          </span>
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

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <div>
        <div
          className="flex items-center gap-1 py-0.5 hover:bg-muted/50 rounded px-1 cursor-pointer"
          style={{ paddingLeft: depth * 16 }}
          onClick={toggle}
        >
          <button
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
              const childPath = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)
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

  return null;
}

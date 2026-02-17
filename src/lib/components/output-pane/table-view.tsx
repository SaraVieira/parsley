import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getValueColor } from '@/lib/utils/shared';
import {
  compareCells,
  findArrayPaths,
  formatCell,
  getColumns,
  getRowKey,
  getValueAtPath,
} from '@/lib/utils/table-utils';

type TableViewProps = {
  data: unknown;
};

type SortDir = 'asc' | 'desc';
type SortState = { column: string; dir: SortDir } | null;

export function TableView({ data }: TableViewProps) {
  const arrayPaths = findArrayPaths(data);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>(null);

  const activePath =
    selectedPath ?? (arrayPaths.length > 0 ? arrayPaths[0].path : null);
  const activeData = activePath ? getValueAtPath(data, activePath) : data;

  const { rows, columns, isTableData } = (() => {
    const d = activeData;
    if (!Array.isArray(d)) {
      if (typeof d === 'object' && d !== null) {
        const entries = Object.entries(d);
        return {
          rows: entries.map(([k, v]) => ({ key: k, value: v })),
          columns: ['key', 'value'],
          isTableData: true,
        };
      }
      return {
        rows: [] as Array<unknown>,
        columns: [] as Array<string>,
        isTableData: false,
      };
    }

    if (d.length === 0) {
      return {
        rows: [] as Array<unknown>,
        columns: [] as Array<string>,
        isTableData: true,
      };
    }

    if (d.every((item) => typeof item !== 'object' || item === null)) {
      return {
        rows: d.map((item, i) => ({ index: i, value: item })),
        columns: ['index', 'value'],
        isTableData: true,
      };
    }

    const cols = getColumns(d);
    return { rows: d, columns: cols, isTableData: true };
  })();

  const sortedRows = (() => {
    if (!sort) {
      return rows;
    }
    const { column, dir } = sort;
    return [...rows].sort((a, b) => {
      const va = (a as Record<string, unknown>)[column];
      const vb = (b as Record<string, unknown>)[column];
      const cmp = compareCells(va, vb);
      return dir === 'desc' ? -cmp : cmp;
    });
  })();

  const toggleSort = (col: string) => {
    setSort((prev) => {
      if (prev?.column !== col) {
        return { column: col, dir: 'asc' };
      }
      if (prev.dir === 'asc') {
        return { column: col, dir: 'desc' };
      }
      return null;
    });
  };

  if (!isTableData && arrayPaths.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Table view works best with arrays of objects. Use Text view for this
        data.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {arrayPaths.length > 1 && (
        <div className="flex items-center gap-2 border-b px-2 py-1">
          <span className="text-[10px] text-muted-foreground">Source:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xs" className="h-6 text-xs">
                {arrayPaths.find((p) => p.path === activePath)?.label ?? 'root'}
                <ChevronDown className="ml-1 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {arrayPaths.map((ap) => (
                <DropdownMenuItem
                  key={ap.path}
                  onClick={() => setSelectedPath(ap.path)}
                  className={ap.path === activePath ? 'bg-accent' : ''}
                >
                  <span className="font-mono text-xs">{ap.label}</span>
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    ({ap.length} items)
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Empty data - nothing to display.
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-muted/50">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap border-r border-border/40 px-3 py-2 text-left font-semibold text-foreground last:border-r-0"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {col}
                      {sort?.column === col ? (
                        sort.dir === 'asc' ? (
                          <ArrowUp className="size-3 text-primary" />
                        ) : (
                          <ArrowDown className="size-3 text-primary" />
                        )
                      ) : (
                        <ArrowUp className="size-3 opacity-0" />
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, i) => (
                <tr
                  key={getRowKey(row, i, columns)}
                  className="border-b border-border/30 even:bg-muted/15 hover:bg-muted/30 transition-colors"
                >
                  {columns.map((col) => {
                    const value = (row as Record<string, unknown>)[col];
                    const display = formatCell(value);
                    return (
                      <td
                        key={col}
                        className="whitespace-nowrap border-r border-border/20 px-3 py-1.5 text-foreground last:border-r-0"
                      >
                        <span
                          className={getValueColor(
                            value === null ? 'null' : typeof value,
                          )}
                        >
                          {display}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t px-3 py-1.5 text-[10px] text-muted-foreground">
            {rows.length} row{rows.length !== 1 ? 's' : ''} × {columns.length}{' '}
            column{columns.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}

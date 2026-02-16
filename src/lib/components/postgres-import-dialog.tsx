import { Database, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchTableData, listTables } from '@/lib/server/postgres';
import { useParsleyStore } from '@/lib/stores/parsley-store';

type PostgresImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Step = 'connect' | 'select' | 'importing';

export function PostgresImportDialog({
  open,
  onOpenChange,
}: PostgresImportDialogProps) {
  const { setJsonInput } = useParsleyStore();

  const [step, setStep] = useState<Step>('connect');
  const [connectionString, setConnectionString] = useState('');
  const [tables, setTables] = useState<Array<string>>([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setStep('connect');
    setConnectionString('');
    setTables([]);
    setSelectedTables(new Set());
    setError(null);
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!connectionString.trim()) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const result = await listTables({
        data: { connectionString: connectionString.trim() },
      });
      if (result.length === 0) {
        setError('No tables found in the public schema.');
        setLoading(false);
        return;
      }
      setTables(result);
      setStep('select');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to database.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (selectedTables.size === 0) {
      return;
    }
    setStep('importing');
    setError(null);

    try {
      const result = await fetchTableData({
        data: {
          connectionString: connectionString.trim(),
          tables: Array.from(selectedTables),
        },
      });
      setJsonInput(JSON.stringify(result, null, 2));
      onOpenChange(false);
      resetState();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch table data.',
      );
      setStep('select');
    }
  };

  const toggleTable = (table: string) => {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(table)) {
        next.delete(table);
      } else {
        next.add(table);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedTables.size === tables.length) {
      setSelectedTables(new Set());
    } else {
      setSelectedTables(new Set(tables));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          resetState();
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="size-4" />
            Import from PostgreSQL
          </DialogTitle>
          <DialogDescription>
            Connect to a PostgreSQL database and import table data as JSON.
          </DialogDescription>
        </DialogHeader>

        {step === 'connect' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="connection-string">Connection URL</Label>
              <Input
                id="connection-string"
                placeholder="postgresql://user:password@host:5432/database"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConnect();
                  }
                }}
                type="url"
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Connection is made server-side. Credentials are not stored.
              </p>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button
              onClick={handleConnect}
              disabled={!connectionString.trim() || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        )}

        {step === 'select' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {tables.length} table{tables.length !== 1 ? 's' : ''} found
              </span>
              <Button variant="ghost" size="xs" onClick={toggleAll}>
                {selectedTables.size === tables.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>

            <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border p-2">
              {tables.map((table) => (
                <div
                  key={table}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50"
                >
                  <Checkbox
                    id={`table-${table}`}
                    checked={selectedTables.has(table)}
                    onCheckedChange={() => toggleTable(table)}
                  />
                  <label
                    htmlFor={`table-${table}`}
                    className="font-mono text-xs cursor-pointer"
                  >
                    {table}
                  </label>
                </div>
              ))}
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('connect');
                  setError(null);
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedTables.size === 0}
                className="flex-1"
              >
                Import{' '}
                {selectedTables.size > 0 ? `(${selectedTables.size})` : ''}
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Fetching data from {selectedTables.size} table
              {selectedTables.size !== 1 ? 's' : ''}...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

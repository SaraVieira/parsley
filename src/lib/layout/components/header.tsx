import {
  Check,
  ChevronDown,
  Copy,
  Database,
  Download,
  FileText,
  Leaf,
  Sheet,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PostgresImportDialog } from '@/lib/components/postgres-import-dialog';
import { useParsleyStore } from '@/lib/stores/parsley-store';
import { jsonToCsv } from '@/lib/utils/json-to-csv';
import { jsonToTypeScript } from '@/lib/utils/json-to-types';

export const Header = () => {
  const { transformedJson, viewMode, setJsonInput } = useParsleyStore();
  const [copied, setCopied] = useState(false);
  const [pgDialogOpen, setPgDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    try {
      const text =
        viewMode === 'types'
          ? jsonToTypeScript(transformedJson)
          : JSON.stringify(transformedJson, null, 2);
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleImportJson = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setJsonInput(text);
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = '';
  };

  const handleExportJson = () => {
    const text = JSON.stringify(transformedJson, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csv = jsonToCsv(transformedJson);
    if (!csv) {
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTypes = () => {
    const text = jsonToTypeScript(transformedJson);
    const blob = new Blob([text], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'types.ts';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-3 h-10 shrink-0">
        <div className="flex items-center gap-1.5">
          <Leaf className="size-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight">parsley</span>

          <div className="ml-2 flex items-center gap-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="xs" className="h-6 text-xs">
                  File
                  <ChevronDown className="ml-0.5 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={handleImportJson}>
                  <Upload className="mr-2 size-3.5" />
                  Import JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJson}>
                  <Download className="mr-2 size-3.5" />
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCsv}>
                  <Sheet className="mr-2 size-3.5" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportTypes}>
                  <FileText className="mr-2 size-3.5" />
                  Export Types
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="xs" className="h-6 text-xs">
                  Import
                  <ChevronDown className="ml-0.5 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setPgDialogOpen(true)}>
                  <Database className="mr-2 size-3.5" />
                  PostgreSQL
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            title="Copy result to clipboard"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />

      <PostgresImportDialog
        open={pgDialogOpen}
        onOpenChange={setPgDialogOpen}
      />
    </>
  );
};

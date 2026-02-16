import { Check, ChevronDown, Palette, Search } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MONACO_THEMES } from '@/lib/utils/monaco-themes';

type ThemePickerProps = {
  monacoTheme: string;
  setMonacoTheme: (theme: string) => void;
};

export function ThemePicker({ monacoTheme, setMonacoTheme }: ThemePickerProps) {
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = search
    ? MONACO_THEMES.filter((t) =>
        t.label.toLowerCase().includes(search.toLowerCase()),
      )
    : MONACO_THEMES;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        setSearch('');
        if (open) {
          requestAnimationFrame(() => searchRef.current?.focus());
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="xs" className="h-6 text-xs">
          <Palette className="mr-0.5 size-3" />
          Theme
          <ChevronDown className="ml-0.5 size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="flex items-center gap-2 border-b px-2 pb-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search themes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-6 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-56 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              No themes found.
            </p>
          )}
          {filtered.map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => setMonacoTheme(theme.id)}
            >
              <Check
                className={`mr-2 size-3.5 ${monacoTheme === theme.id ? 'opacity-100 text-primary' : 'opacity-0'}`}
              />
              <span
                className={
                  monacoTheme === theme.id ? 'font-semibold text-primary' : ''
                }
              >
                {theme.label}
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { Loader2 } from 'lucide-react';

export function EditorLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading editor...
      </div>
    </div>
  );
}

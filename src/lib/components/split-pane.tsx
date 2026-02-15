import type { ReactNode } from 'react';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

type SplitPaneProps = {
  left: ReactNode;
  right: ReactNode;
};

export function SplitPane({ left, right }: SplitPaneProps) {
  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      <ResizablePanel defaultSize={40} minSize={20}>
        {left}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={60} minSize={20}>
        {right}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

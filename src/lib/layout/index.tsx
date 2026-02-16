import type { ReactNode } from 'react';

import { Toolbar } from '@/lib/components/toolbar';

import { Header } from './components/header';

type LayoutProps = {
  children: ReactNode;
};

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <Header />
      <Toolbar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
};

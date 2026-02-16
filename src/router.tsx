import { createRouter } from '@tanstack/react-router';

import Page404 from '@/lib/pages/404';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: () => (
      <div className="mx-auto">
        <p>Loading...</p>
      </div>
    ),
    defaultNotFoundComponent: () => <Page404 />,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

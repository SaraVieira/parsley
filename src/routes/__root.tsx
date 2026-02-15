import { createRootRoute, HeadContent, Outlet } from '@tanstack/react-router';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Layout } from '@/lib/layout';

const title = 'Parsley';
const description = 'A browser-based JSON editor and transformer for engineers';
const url = 'https://parsley.dotenv.dev';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        title,
      },
      {
        name: 'description',
        content: description,
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0',
      },
      {
        name: 'application-name',
        content: title,
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'default',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: title,
      },
      {
        name: 'theme-color',
        content: '#000000',
      },
      {
        name: 'og:type',
        content: 'website',
      },
      {
        name: 'og:url',
        content: url,
      },
      {
        name: 'og:title',
        content: title,
      },
      {
        name: 'og:description',
        content: description,
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:url',
        content: url,
      },
      {
        name: 'twitter:title',
        content: title,
      },
      {
        name: 'twitter:description',
        content: description,
      },
    ],
    links: [
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
  }),
  component: () => (
    <>
      <HeadContent />
      <TooltipProvider delayDuration={300}>
        <Layout>
          <Outlet />
        </Layout>
      </TooltipProvider>
    </>
  ),
});

'use client';

import * as React from 'react';
import {
  QueryClient,
  QueryClientProvider,
  HydrationBoundary,
  type DehydratedState,
} from '@tanstack/react-query';
import dynamic from 'next/dynamic';

const ReactQueryDevtools = dynamic(
  () =>
    import('@tanstack/react-query-devtools').then((m) => m.ReactQueryDevtools),
  { ssr: false, loading: () => null },
);

export function QueryProvider({
  children,
  state,
}: {
  children: React.ReactNode;
  state?: DehydratedState;
}) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={state}>{children}</HydrationBoundary>
      {process.env.NODE_ENV !== 'production' ? (
        <ReactQueryDevtools initialIsOpen={false} position="right" />
      ) : null}
    </QueryClientProvider>
  );
}

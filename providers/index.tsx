import { QueryProvider } from '@/providers/query-provider';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import React, { Suspense } from 'react';
import { Toaster } from 'sonner';
import type { DehydratedState } from '@tanstack/react-query';
import { headers } from 'next/headers';
import CustomLoader from '@/components/cms/admin/custom-loader';

const Providers = async ({
  children,
  dehydratedState,
}: {
  children: React.ReactNode;
  dehydratedState?: DehydratedState;
}) => {
  const xUrl = (await headers()).get('x-url') || '';

  return (
    <Suspense fallback={<CustomLoader />}>
      <QueryProvider state={dehydratedState}>
        <NuqsAdapter>
          {/* <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
        </ThemeProvider> */}
          {children}

          <Toaster />
        </NuqsAdapter>
      </QueryProvider>
    </Suspense>
  );
};

export default Providers;

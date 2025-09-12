'use client';

import type { DehydratedState } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import React, { Suspense } from 'react';
import { Toaster } from 'sonner';
import { QueryProvider } from './query-provider';
import CustomLoader from '../components/ui/custom-loader';

const OpacaProvider = ({
  children,
  dehydratedState,
}: {
  children: React.ReactNode;
  dehydratedState?: DehydratedState;
}) => {
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

export default OpacaProvider;

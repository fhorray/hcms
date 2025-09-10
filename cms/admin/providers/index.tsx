import { OpacaConfig } from '@/cms/types';
import CustomLoader from '@/components/cms/admin/custom-loader';
import { QueryProvider } from '@/providers/query-provider';
import type { DehydratedState } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import React, { Suspense } from 'react';
import { Toaster } from 'sonner';

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

'use client';

import CustomLoader from '@/components/cms/admin/custom-loader';
import { SanitizedConfig } from '@/new-cms/config/types';
import { $opaca, setOpacaConfig } from '@/new-cms/stores/context';
import { QueryProvider } from '@/providers/query-provider';
import { useStore } from '@nanostores/react';
import type { DehydratedState } from '@tanstack/react-query';
import { headers } from 'next/headers';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import React, { Suspense, useEffect } from 'react';
import { Toaster } from 'sonner';

const OpacaProvider = ({
  children,
  dehydratedState,
  config,
}: {
  children: React.ReactNode;
  dehydratedState?: DehydratedState;
  config: SanitizedConfig;
}) => {
  useEffect(() => {
    if (config) {
      setOpacaConfig(config);
    }
  }, []);
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

import type { ReactNode } from 'react';
import config from '@opaca-config';
import { MakeRootLayout } from '@opaca/next/views';
import '@opaca/next/styles.css';

export const dynamic = 'force-dynamic'; // Admin should not be statically generated

export default function Layout({ children }: { children: ReactNode }) {
  return <MakeRootLayout config={config}>{children}</MakeRootLayout>;
}

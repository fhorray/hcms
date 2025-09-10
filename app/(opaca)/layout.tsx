import type { ReactNode } from 'react';
import config from '@opaca-config';
import { MakeRootLayout } from '@/cms/next/views';
import '@/cms/next/styles.css';

export const dynamic = 'force-dynamic'; // Admin should not be statically generated

export default function Layout({ children }: { children: ReactNode }) {
  return <MakeRootLayout config={config}>{children}</MakeRootLayout>;
}

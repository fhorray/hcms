import type { ReactNode } from 'react';
import { client } from '@opaca-config';
import { MakeRootLayout } from '@opaca/client/next/views';
import '@opaca/client/next/styles.css';
import { OpacaBuiltConfig } from '@/opaca/types/config';

export const dynamic = 'force-dynamic'; // Admin should not be statically generated

export default function Layout({ children }: { children: ReactNode }) {
  return <MakeRootLayout config={client}>{children}</MakeRootLayout>;
}

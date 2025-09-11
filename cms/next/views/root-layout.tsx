import { BuiltOpacaConfig } from '@/cms/types';
import type { ReactNode } from 'react';
import OpacaProvider from '../providers';
import AdminLayoutView from './admin-layout-view';

type Props = {
  config: BuiltOpacaConfig;
  children: ReactNode;
};

export function MakeRootLayout({ config, children }: Props) {
  // Safe defaults for admin
  const lang = config?.admin?.appLang ?? 'en';
  const suppress = config?.admin?.suppressHydrationWarning ?? true;

  return (
    <html lang={lang} suppressHydrationWarning={suppress}>
      <body className="min-h-screen bg-background text-foreground">
        <OpacaProvider>
          <AdminLayoutView>{children}</AdminLayoutView>
        </OpacaProvider>
      </body>
    </html>
  );
}

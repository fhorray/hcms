import React from 'react';
import type { SanitizedConfig } from '../config/types';

import { APP_CONFIG } from '@/constants';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './styles.css';
import OpacaProvider from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// TODO: Promise here
export const metadata: Metadata = {
  title: APP_CONFIG.NAME,
  description: APP_CONFIG.DESCRIPTION,
};

export function MakeRootLayout(configPromise: Promise<SanitizedConfig>) {
  return async function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const config = await configPromise;

    // só dados serializáveis
    const clientConfig = {
      orm: config.orm,
      admin: config.admin,
      collections: config.collections,
    } satisfies Pick<SanitizedConfig, 'orm' | 'admin' | 'collections'>;

    return (
      <html lang="en">
        <head />
        <body>
          <OpacaProvider config={clientConfig as SanitizedConfig}>
            {children}
          </OpacaProvider>
        </body>
      </html>
    );
  };
}

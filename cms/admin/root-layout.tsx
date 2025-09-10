import { Geist, Geist_Mono } from 'next/font/google';
import React from 'react';
import { BuiltOpacaConfig } from '../types';
import OpacaProvider from './providers';
import './styles.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export function MakeRootLayout({
  config,
  children,
}: {
  config: BuiltOpacaConfig;
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head />
      <body>
        <OpacaProvider>{children}</OpacaProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import * as config from '@opaca-config';
import { importMap } from '../imports-map';
import { generateAdminMetadata, OpacaRootPage } from '@/opaca/client/next';

type Args = {
  params: Promise<{ paths?: string[]; segments?: string[] }>;
  searchParams: Promise<Record<string, string | string[]>>;
};

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

const { serverConfig } = config;

export function generateMetadata(args: Args): Promise<Metadata> {
  return generateAdminMetadata({ config: serverConfig, ...args });
}

export default function Page(args: Args) {
  return OpacaRootPage({ config: serverConfig, importMap, ...args });
}

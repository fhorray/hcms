import type { Metadata } from 'next';
import config from '@opaca-config';
import { importMap } from '../imports-map';
import { generateAdminMetadata, OpacaRootPage } from '@/cms/next';

type Args = {
  params: Promise<{ paths?: string[]; segments?: string[] }>;
  searchParams: Promise<Record<string, string | string[]>>;
};

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export function generateMetadata(args: Args): Promise<Metadata> {
  return generateAdminMetadata({ config, ...args });
}

export default function Page(args: Args) {
  return OpacaRootPage({ config, importMap, ...args });
}

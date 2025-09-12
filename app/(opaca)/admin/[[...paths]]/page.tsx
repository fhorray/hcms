import type { Metadata } from 'next';
import { client } from '@opaca-config';
import { importMap } from '../imports-map';
import { generateAdminMetadata, OpacaRootPage } from '@/opaca/client/next';
import { OpacaBuiltConfig } from '@/opaca/types/config';

type Args = {
  params: Promise<{ paths?: string[]; segments?: string[] }>;
  searchParams: Promise<Record<string, string | string[]>>;
};

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export function generateMetadata(args: Args): Promise<Metadata> {
  return generateAdminMetadata({
    config: client as OpacaBuiltConfig,
    ...args,
  });
}

export default function Page(args: Args) {
  return OpacaRootPage({
    config: client as OpacaBuiltConfig,
    importMap,
    ...args,
  });
}

// packages/opaca-next-admin/src/index.tsx
// Comments in English only.

import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import { BuiltOpacaConfig } from '../types';

/** Map of route keys to lazy views loaded at runtime */
export type ImportMap = Record<
  string,
  () => Promise<{ default: ComponentType<any> }>
>;

/** Public args expected by the app wrapper (catch-all page) */
type Args = {
  config: BuiltOpacaConfig;
  params: Promise<{ paths?: string[] }>;
  searchParams: Promise<Record<string, string | string[]>>;
};

/** Server component that resolves a view based on URL segments and renders it */
export async function OpacaRootPage({
  config,
  params,
  searchParams,
  importMap,
}: Args & { importMap: ImportMap }) {
  const { paths = [] } = await params;
  const qs = await searchParams;
  const routeKey = resolveRouteKey(paths);
  const View = await loadView(importMap, routeKey);

  // Render the resolved view and pass minimal context
  return <View config={config} paths={paths} searchParams={qs} />;
}

/** Minimal metadata builder, similar to Payload’s generatePageMetadata */
export async function generateAdminMetadata({
  config,
  params,
}: Args): Promise<Metadata> {
  const { paths = [] } = await params;
  const { collection, action } = parseSegments(paths);

  const baseTitle = config?.admin?.appName ?? 'Opaca Admin';
  const parts = [baseTitle];
  if (collection && collection !== 'dashboard') parts.push(collection);
  if (action && action !== 'home') parts.push(action);

  return { title: parts.join(' · ') };
}

// ----------------------- helpers (exported for testing/override) -----------------------

const TOP_LEVEL_ROUTES = new Set([
  'login',
  'forgot',
  'reset',
  'logout',
  'unauthorized',
]);

export function parseSegments(segments: string[]) {
  const [a, b, c] = segments ?? [];

  // Top-level admin routes: /admin/login, /admin/forgot, ...
  if (a && !b && TOP_LEVEL_ROUTES.has(a)) {
    return {
      collection: '',
      action: a as string,
      id: undefined as string | undefined,
    };
  }

  // /admin                  -> dashboard
  // /admin/:collection      -> list
  // /admin/:collection/:action -> action
  const collection = a ?? '';
  const action = b ?? (collection ? 'list' : 'home');
  const id = c;
  return { collection, action, id };
}

export function resolveRouteKey(segments: string[]) {
  const { collection, action } = parseSegments(segments);

  // Top-level routes become 'route:/<action>'
  if (!collection && action && TOP_LEVEL_ROUTES.has(action)) {
    return `route:/${action}`;
  }

  if (!collection) return 'route:/dashboard';
  if (action === 'list') return 'route:/:collection/list';

  // Contract: /admin/:collection/:action
  return 'route:/:collection/:action';
}

// Heuristic for "looks like an ID" (UUID / CUID / ULID / numeric / hex / mongo-like)
function isLikelyId(s: string) {
  if (!s) return false;
  if (/^\d{4,}$/.test(s)) return true; // 4+ digits
  if (/^[0-9a-f]{8,}$/i.test(s)) return true; // hex-ish 8+
  if (/^[0-9a-f-]{8,}$/i.test(s)) return true; // hex with dashes (uuid)
  if (/^[A-Za-z0-9_-]{10,}$/.test(s)) return true; // ulid/cuid-ish
  return false;
}

async function loadView(
  importMap: ImportMap,
  key: string,
): Promise<ComponentType<any>> {
  const modLoader = importMap[key];
  if (!modLoader) {
    // Graceful fallback when the key is not registered
    return (() => (
      <div style={{ padding: 24 }}>
        Missing view for key: <code>{key}</code>
      </div>
    )) as unknown as ComponentType<any>;
  }
  const mod = await modLoader();
  return (mod.default ??
    ((() => (
      <div style={{ padding: 24 }}>Invalid view module for key: {key}</div>
    )) as ComponentType<any>)) as ComponentType<any>;
}

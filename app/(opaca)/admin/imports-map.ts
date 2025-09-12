import type { ImportMap } from '@opaca/client/next'

/**
 * Map route keys -> lazy views, and UI keys -> lazy components.
 * You can override any entry by pointing to a local file instead of the library.
 */
export const importMap: ImportMap = {
  'route:/dashboard': () => import('@opaca/client/next/views/root-view'),
  'route:/login': () => import('@opaca/client/next/views/login-view'),
  'route:/:collection/list': () => import('@opaca/client/next/views/collection-view'),
  'route:/:collection/:action': () => import('@opaca/client/next/views/action-view'),

  // UI (optional)
  'ui:CollectionCard': () => import('@opaca/client/next/components/ui/collection-card'),
  'ui:CollectionList': () => import('@opaca/client/next/components/ui/collection-items-list'),
}
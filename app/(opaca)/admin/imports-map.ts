import type { ImportMap } from '@opaca/next'

/**
 * Map route keys -> lazy views, and UI keys -> lazy components.
 * You can override any entry by pointing to a local file instead of the library.
 */
export const importMap: ImportMap = {
  'route:/dashboard': () => import('@opaca/next/views/admin-root-page'),
  'route:/:collection/list': () => import('@opaca/next/views/collection-view'),
  'route:/:collection/:action': () => import('@opaca/next/views/collection-action-view'),

  // UI (optional)
  'ui:CollectionCard': () => import('@opaca/next/components/ui/collection-card'),
  'ui:CollectionList': () => import('@opaca/next/components/ui/collection-items-list'),
}


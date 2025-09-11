import type { ImportMap } from '@/cms/next'

/**
 * Map route keys -> lazy views, and UI keys -> lazy components.
 * You can override any entry by pointing to a local file instead of the library.
 */
export const importMap: ImportMap = {
  'route:/dashboard': () => import('@/cms/next/views/root-view'),
  'route:/login': () => import('@/cms/next/views/login-view'),
  'route:/:collection/list': () => import('@/cms/next/views/collection-view'),
  'route:/:collection/:action': () => import('@/cms/next/views/action-view'),

  // UI (optional)
  'ui:CollectionCard': () => import('@/cms/next/components/ui/collection-card'),
  'ui:CollectionList': () => import('@/cms/next/components/ui/collection-items-list'),
}


import { persistentAtom } from '@nanostores/persistent';

export type ViewMode = 'grid' | 'list';

export interface TableFilters {
  viewMode: ViewMode;
  favorites: string[];
  visibleColumns: Record<string, boolean>;
}

const defaultFilters: TableFilters = {
  viewMode: 'list',
  favorites: [],
  visibleColumns: {},
};

export const $tableFilters = persistentAtom<TableFilters>(
  'table-filters',
  defaultFilters,
  {
    encode: JSON.stringify,
    decode: (str) => {
      try {
        return JSON.parse(str) as TableFilters;
      } catch {
        return defaultFilters;
      }
    },
  }
);

// === Actions ===

const toggleViewMode = (view?: TableFilters['viewMode']) => {
  const current = $tableFilters.get();
  $tableFilters.set({
    ...current,
    viewMode: view ?? (current.viewMode === 'grid' ? 'list' : 'grid'),
  });
};

const toggleColumnVisibility = (columnId: string) => {
  const current = $tableFilters.get();
  const visibleColumns = { ...current.visibleColumns };
  visibleColumns[columnId] = !visibleColumns[columnId];
  $tableFilters.set({ ...current, visibleColumns });
};

const showAllColumns = (columns: string[]) => {
  const current = $tableFilters.get();
  const visibleColumns: Record<string, boolean> = {};
  for (const col of columns) {
    visibleColumns[col] = true;
  }
  $tableFilters.set({ ...current, visibleColumns });
};

export const preferencesActions = {
  toggleViewMode,
  toggleColumnVisibility,
  showAllColumns,
};

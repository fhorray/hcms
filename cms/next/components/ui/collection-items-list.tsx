'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { $tableFilters, preferencesActions } from '@/stores/preferences';
import { useStore } from '@nanostores/react';
import {
  DatabaseIcon,
  EditIcon,
  Grid3X3Icon,
  ListIcon,
  Trash2Icon,
  Columns3Icon,
} from 'lucide-react';
import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { OpacaField } from '@/cms/types';

// ---------------------------------------------
// Helpers
// ---------------------------------------------

// Creates a nice label from a key path (e.g. "meta.excerpt" -> "Excerpt")
function labelFromKeyPath(path: string) {
  const last = path.split('.').pop() ?? path;
  return last.charAt(0).toUpperCase() + last.slice(1).replaceAll('_', ' ');
}

// Gets deep value using dot-path (e.g., "meta.excerpt")
function getDeep(obj: any, path: string) {
  return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}

function isNumericKey(k: string) {
  return /^\d+$/.test(k);
}

// Check for plain-object rows
function isPlainObject(v: any): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Flattens schema fields into a list of column paths.
// If a field is a row, we expose children as "parent.child" keys.
function columnsFromSchema(fields?: OpacaField[]): string[] {
  if (!fields?.length) return [];
  const out: string[] = [];

  const walk = (prefix: string | null, f: OpacaField) => {
    const type = f.type as any;
    const name = prefix ? `${prefix}.${f.name}` : f.name;

    // Row container: expose children as columns
    if (
      type &&
      typeof type === 'object' &&
      'row' in type &&
      Array.isArray(type.row)
    ) {
      for (const child of type.row as OpacaField[]) {
        walk(name, child);
      }
      return;
    }

    out.push(name);
  };

  for (const f of fields) walk(null, f);
  return out;
}

// Builds a stable, ordered column list based on schema first, then data keys.
// We keep a single set to avoid duplicates.
export function buildAllColumns(items: any[], fields?: OpacaField[]) {
  const cols = new Set<string>();

  // 1) schema-driven (stable order)
  for (const c of columnsFromSchema(fields)) cols.add(c);

  // 2) data-driven (skip arrays and numeric keys)
  for (const row of items ?? []) {
    if (!isPlainObject(row)) continue; // <-- ignore arrays and primitives
    for (const k of Object.keys(row)) {
      if (isNumericKey(k)) continue; // <-- ignore "0","1","2",...
      cols.add(k);
    }
  }

  return Array.from(cols);
}

// ---------------------------------------------
// Filter component: Column visibility toggler
// ---------------------------------------------
function ColumnFilter({ allColumns }: { allColumns: string[] }) {
  const filters = useStore($tableFilters);

  const isVisible = (key: string) =>
    (filters.visibleColumns?.[key] ?? true) === true;

  const toggleColumn = (key: string) => {
    const current = $tableFilters.get();
    const next = {
      ...current.visibleColumns,
      [key]: !(current.visibleColumns?.[key] ?? true),
    };
    $tableFilters.set({ ...current, visibleColumns: next });
  };

  const setAll = (visible: boolean) => {
    const current = $tableFilters.get();
    const next: Record<string, boolean> = { ...current.visibleColumns };
    for (const c of allColumns) next[c] = visible;
    $tableFilters.set({ ...current, visibleColumns: next });
  };

  if (!allColumns.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 cursor-pointer"
        >
          <Columns3Icon className="w-4 h-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">
          Columns Visibility
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allColumns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col}
            checked={isVisible(col)}
            onCheckedChange={() => toggleColumn(col)}
            className="capitalize"
          >
            {labelFromKeyPath(col)}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <div className="w-full px-2 py-1.5 flex gap-2">
          <Button
            className="w-fit cursor-pointer"
            variant="ghost"
            size="sm"
            onClick={() => setAll(true)}
          >
            Show All
          </Button>
          <Button
            className="w-fit cursor-pointer"
            variant="ghost"
            size="sm"
            onClick={() => setAll(false)}
          >
            Hide All
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------
//  Main component
// ---------------------------------------------
type Props = {
  items: any[];
  // NEW: pass collection schema to define/flatten columns (OpacaField[])
  fields?: OpacaField[];
};

function CollectionItemsList({ items, fields }: Props) {
  const params = useParams() as { paths?: string };
  const slug = params.paths ?? 'items';

  const { viewMode, visibleColumns } = useStore($tableFilters);

  // Full column set: schema (flattened, incl. row children) + data keys
  const allColumns = useMemo(
    () => buildAllColumns(items, fields),
    [items, fields],
  );

  const isVisible = (key: string) => (visibleColumns?.[key] ?? true) === true;

  const renderedColumns = useMemo(
    () => allColumns.filter(isVisible),
    [allColumns, visibleColumns],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DatabaseIcon className="w-5 h-5" />
                {slug} Items
              </CardTitle>
              <CardDescription>
                Sample data from the {slug} collection.
              </CardDescription>
            </div>
          </div>

          {/* FILTERS */}
          <div className="flex items-center gap-2">
            {/* Column selector */}
            <ColumnFilter allColumns={allColumns} />

            {/* View mode */}
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => preferencesActions.toggleViewMode('list')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <ListIcon className="w-4 h-4" />
              Table
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => preferencesActions.toggleViewMode('grid')}
              className="flex items-center gap-2  cursor-pointer"
            >
              <Grid3X3Icon className="w-4 h-4" />
              Grid
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!items?.length && (
          <div className="text-sm text-muted-foreground">
            Sem dados para exibir.
          </div>
        )}

        {items?.length > 0 && viewMode === 'list' && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {renderedColumns.map((key) => (
                    <TableHead key={key} className="font-medium">
                      {labelFromKeyPath(key)}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    {renderedColumns.map((key) => {
                      const value = key.includes('.')
                        ? getDeep(item, key)
                        : (item as any)[key];

                      return (
                        <TableCell key={key} className="font-medium">
                          {key.endsWith('status') || key === 'status' ? (
                            <Badge
                              variant={
                                value === 'active' ? 'default' : 'secondary'
                              }
                            >
                              {String(value)}
                            </Badge>
                          ) : (
                            <span className="max-w-[240px] truncate block">
                              {typeof value === 'object' && value !== null
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* FIX: use slug instead of hardcoded "users" */}
                        <Link href={`/admin/${slug}/${(item as any).id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer"
                          >
                            <EditIcon className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          className="cursor-pointer"
                          variant="destructive"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {items?.length > 0 && viewMode === 'grid' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Item #{index + 1}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/${slug}/${(item as any).id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer"
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="cursor-pointer"
                        variant="destructive"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {renderedColumns.map((key) => {
                    const value = key.includes('.')
                      ? getDeep(item, key)
                      : (item as any)[key];

                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          {labelFromKeyPath(key)}
                        </span>
                        {key.endsWith('status') || key === 'status' ? (
                          <Badge
                            variant={
                              value === 'active' ? 'default' : 'secondary'
                            }
                            className="w-fit"
                          >
                            {String(value)}
                          </Badge>
                        ) : (
                          <span className="text-sm break-all">
                            {typeof value === 'object' && value !== null
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CollectionItemsList;

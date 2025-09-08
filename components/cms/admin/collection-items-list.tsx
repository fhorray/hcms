'use client';

import { zod } from '@/cms/helpers/drizzle';
import type { Tables, Select } from '@/cms/helpers/drizzle';

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
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Columns3Icon className="w-4 h-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">
          Visibilidade das colunas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allColumns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col}
            checked={isVisible(col)}
            onCheckedChange={() => toggleColumn(col)}
            className="capitalize"
          >
            {col.replaceAll('_', ' ')}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setAll(true)}>
            Mostrar tudo
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAll(false)}>
            Ocultar tudo
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------
//  Main component
// ---------------------------------------------
type Props<K extends Tables> = {
  items: Select<K>[];
};

export function CollectionItemsList<K extends Tables>({
  // collection,
  items,
}: Props<K>) {
  const params = useParams();
  const slug = params.collection;

  const { viewMode, visibleColumns } = useStore($tableFilters);

  // Schemas (caso queira validar/formatar em algum momento)
  const selectSchema = zod.select[slug as K];
  const insertSchema = zod.insert[slug as K];
  void selectSchema; // evitar TS unused caso não use agora
  void insertSchema;

  // Lista de colunas: união das chaves de todos os itens
  const allColumns = useMemo(() => {
    const s = new Set<string>();
    for (const row of (items ?? []) as any[]) {
      Object.keys(row ?? {}).forEach((k) => s.add(k));
    }
    return Array.from(s);
  }, [items]);

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
                      {key.charAt(0).toUpperCase() +
                        key.slice(1).replaceAll('_', ' ')}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    {renderedColumns.map((key) => {
                      const value = (item as any)[key];
                      return (
                        <TableCell key={key} className="font-medium">
                          {key === 'status' ? (
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
                        <Link href={`/admin/users/${(item as any).id}`}>
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
                    const value = (item as any)[key];
                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          {key.charAt(0).toUpperCase() +
                            key.slice(1).replaceAll('_', ' ')}
                        </span>
                        {key === 'status' ? (
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

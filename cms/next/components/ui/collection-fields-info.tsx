'use client';

import { BaseOpacaField, OpacaCollection, OpacaField } from '@/cms/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  CalendarIcon,
  DatabaseIcon,
  DatabaseZapIcon,
  FileTextIcon,
  HashIcon,
  LinkIcon,
  ListIcon,
  ToggleLeftIcon,
  TypeIcon,
} from 'lucide-react';
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

// ---------- Safe helpers & type guards ----------
function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

const hasKey = (obj: unknown, key: string): boolean =>
  isObject(obj) && key in obj;

function hasTypeObjectRow(field: any): boolean {
  return isObject(field?.type) && Array.isArray((field as any).type?.row);
}

function hasTopLevelRow(field: any): boolean {
  return isObject(field) && Array.isArray((field as any).row);
}

function isRowContainer(field: any): boolean {
  return hasTypeObjectRow(field) || hasTopLevelRow(field);
}

function getRowChildren(field: any): OpacaField[] {
  if (hasTypeObjectRow(field)) return (field as any).type.row;
  if (hasTopLevelRow(field)) return (field as any).row;
  return [];
}

function isRelationship(field: any): boolean {
  // new-shape relationship only (top-level or inside `type`)
  return hasKey(field, 'relationship') || hasKey(field?.type, 'relationship');
}

function isRelationLegacy(field: any): boolean {
  // legacy `relation` key
  return hasKey(field, 'relation') || hasKey(field?.type, 'relation');
}

function isSelect(field: any): boolean {
  // select may live on the top-level or inside `type`
  return hasKey(field, 'select') || hasKey(field?.type, 'select');
}

function primitiveTypeOf(field: any): string | undefined {
  if (typeof field === 'string') return field;
  if (typeof field?.type === 'string') return field.type;
  return undefined;
}

// ---------- Normalization for display/icon/badge ----------
type DisplayInfo = { type: string; details?: string };

const getFieldTypeDisplay = (field: any): DisplayInfo => {
  // We still detect row type, but flattened render will skip containers.
  if (isRowContainer(field)) {
    const len = getRowChildren(field).length;
    return { type: 'row', details: `${len} field${len === 1 ? '' : 's'}` };
  }

  // Relationship (new shape)
  if (isRelationship(field)) {
    const rel = (field.relationship ?? (field as any).type?.relationship) as {
      to: string;
      many?: boolean;
      through?: string;
    };
    const many = rel?.many ? ' (many)' : '';
    const through = rel?.through ? ` through ${rel.through}` : '';
    return { type: 'relationship', details: `→ ${rel?.to}${many}${through}` };
  }

  // Legacy relation (if present)
  if (isRelationLegacy(field)) {
    const rel = (field.relation ?? (field as any).type?.relation) as {
      to: string;
      many?: boolean;
      through?: string;
    };
    const many = rel?.many ? ' (many)' : '';
    const through = rel?.through ? ` through ${rel.through}` : '';
    return { type: 'relationship', details: `→ ${rel?.to}${many}${through}` };
  }

  // Select
  if (isSelect(field)) {
    const sel = (field.select ?? (field as any).type?.select) as {
      options: { label: string; value: string | number }[];
      multiple?: boolean;
      relationship?: { to: string; valueField: string };
    };
    const mult = sel?.multiple ? 'multiple' : 'single';
    const relInfo = sel?.relationship
      ? `, values from ${sel.relationship.to}.${sel.relationship.valueField}`
      : '';
    return {
      type: 'select',
      details: `${mult} | ${sel?.options?.length ?? 0} options${relInfo}`,
    };
  }

  // Primitive (string)
  const prim = primitiveTypeOf(field);
  if (prim) return { type: prim };

  // Fallback for complex/unknown
  return { type: 'complex' };
};

const getFieldIcon = (normalizedType: string) => {
  const map: Record<string, any> = {
    text: TypeIcon,
    email: TypeIcon,
    textarea: TypeIcon,
    'rich-text': FileTextIcon,
    code: FileTextIcon,
    json: FileTextIcon,

    number: HashIcon,
    int: HashIcon,
    float: HashIcon,

    checkbox: ToggleLeftIcon,
    switcher: ToggleLeftIcon,
    boolean: ToggleLeftIcon,

    date: CalendarIcon,
    datetime: CalendarIcon,

    'radio-group': ListIcon,
    select: ListIcon,
    array: ListIcon,

    relationship: LinkIcon,
    relation: LinkIcon,
    join: LinkIcon,

    upload: DatabaseIcon,
    group: DatabaseIcon,
    tabs: DatabaseIcon,
    ui: DatabaseIcon,
    point: DatabaseIcon,

    row: DatabaseZapIcon,
    complex: DatabaseIcon,
  };
  return map[normalizedType] || TypeIcon;
};

const getFieldBadgeColor = (t: string) => {
  const colors: Record<string, string> = {
    text: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    email: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    textarea: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'rich-text': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    code: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    json: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',

    number: 'bg-green-500/10 text-green-400 border-green-500/30',
    int: 'bg-green-500/10 text-green-400 border-green-500/30',
    float: 'bg-green-500/10 text-green-400 border-green-500/30',

    checkbox: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    switcher: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    boolean: 'bg-purple-500/10 text-purple-400 border-purple-500/30',

    date: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    datetime: 'bg-orange-500/10 text-orange-400 border-orange-500/30',

    'radio-group': 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    select: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    array: 'bg-pink-500/10 text-pink-400 border-pink-500/30',

    relationship: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    relation: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    join: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',

    upload: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    group: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    tabs: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    ui: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    point: 'bg-slate-500/10 text-slate-400 border-slate-500/30',

    row: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    complex: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  };
  return colors[t] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
};

// ---------- Flatten utility (rows -> list of leaves) ----------
type FlatEntry = { field: any; path: string[]; key: string; index: number };

/**
 * Flattens a field tree into a list of leaf fields (skips row containers).
 * - Preserves ordering: row children are inserted at the container position.
 * - Builds a stable key from the dotted path.
 */
function flattenFields(
  fields: any[],
  path: string[] = [],
  out: FlatEntry[] = [],
): FlatEntry[] {
  fields.forEach((field, i) => {
    if (isRowContainer(field)) {
      // Recurse into the row, do not push the container itself
      const rowName = (field as any)?.name ?? `row#${i}`;
      flattenFields(getRowChildren(field), [...path, rowName], out);
    } else {
      const name: string | undefined = (field as any)?.name;
      const key = name
        ? [...path, name].join('.')
        : [...path, `field#${i}`].join('.');
      out.push({ field, path, key, index: i });
    }
  });
  return out;
}

// ---------- Field card: always renders a leaf (never a container) ----------
function FieldCard({
  field,
  path,
  index,
}: {
  field: any;
  path: string[];
  index: number;
}) {
  const { type, details } = getFieldTypeDisplay(field);

  if (type === 'row') return null; // skip containers

  const Icon = getFieldIcon(type);
  const badgeColor = getFieldBadgeColor(type);

  // ✅ Use only the field name (fallback "(unnamed)")
  const name: string | undefined = (field as any)?.name;
  const label = name || '(unnamed)';

  const isRequired =
    isObject(field) &&
    !hasKey(field, 'enum') &&
    !hasKey(field, 'relation') &&
    !hasKey(field, 'relationship') &&
    (field as BaseOpacaField).required === true;

  const isUnique =
    isObject(field) &&
    !hasKey(field, 'enum') &&
    !hasKey(field, 'relation') &&
    !hasKey(field, 'relationship') &&
    (field as BaseOpacaField).unique === true;

  const hasDefault =
    isObject(field) &&
    !hasKey(field, 'enum') &&
    !hasKey(field, 'relation') &&
    !hasKey(field, 'relationship') &&
    (field as BaseOpacaField).default !== undefined;

  return (
    <div className="p-4 border border-border rounded-lg bg-cms-surface/30 hover:bg-cms-surface-hover/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-8 h-8 bg-background/80 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-lg">{label}</h3>
              <Badge className={`text-xs ${badgeColor}`}>{type}</Badge>
              {isRequired && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
              {isUnique && (
                <Badge variant="outline" className="text-xs">
                  Unique
                </Badge>
              )}
            </div>

            {details && (
              <p className="text-sm text-muted-foreground">{details}</p>
            )}

            {hasDefault && (
              <p className="text-xs text-muted-foreground">
                Default:{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                  {JSON.stringify((field as BaseOpacaField).default)}
                </code>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Main component (flat list render) ----------
const CollectionFieldsInfo = ({
  children,
  collection,
}: {
  children?: React.ReactNode;
  collection: OpacaCollection;
}) => {
  const fieldEntries = collection.fields;

  // Build the flat list once
  const flat = React.useMemo(
    () => flattenFields(fieldEntries, [collection.name]),
    [fieldEntries, collection.name],
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="cursor-pointer">
            <DatabaseZapIcon className="w-4 h-4 mr-2" />
            Fields
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="!max-w-[40vw] space-y-4 px-4">
        <SheetHeader className="px-0 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <DatabaseIcon className="w-5 h-5" />
            Collection Fields
          </SheetTitle>
          <SheetDescription>
            Field definitions and their configurations for the{' '}
            {collection.name.toLowerCase()} collection data.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-full w-full px-1">
          <div className="grid gap-4 overflow-y mb-20 pb-10">
            {flat.map(({ field, path, key, index }) => (
              <FieldCard key={key} field={field} path={path} index={index} />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default CollectionFieldsInfo;

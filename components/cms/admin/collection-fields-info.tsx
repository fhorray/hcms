import {
  Calendar as CalendarIcon,
  Hash as NumberIcon,
  ToggleLeft as BooleanIcon,
  Type as StringIcon,
  List as EnumIcon,
  Braces as JsonIcon,
  File as BlobIcon,
  HelpCircle as UnknownIcon,
  Key as PrimaryKeyIcon,
  Database as DatabaseIcon,
  DatabaseZap as DatabaseZapIcon,
} from 'lucide-react';

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

import type { TableCmsSchemaTyped, FieldKind } from '@/cms/builders';
import { GetFielfKindIconRecord } from '@/cms/client/ui/records';
import { Collection } from '@/new-cms/config/types';

const fieldUI: Record<FieldKind, { icon: React.ElementType; color: string }> = {
  string: {
    icon: StringIcon,
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  number: {
    icon: NumberIcon,
    color: 'bg-green-500/10 text-green-400 border-green-500/30',
  },
  boolean: {
    icon: BooleanIcon,
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  date: {
    icon: CalendarIcon,
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  },
  enum: {
    icon: EnumIcon,
    color: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  },
  json: {
    icon: JsonIcon,
    color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  },
  blob: {
    icon: BlobIcon,
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  },
  unknown: {
    icon: UnknownIcon,
    color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  },
};

export const CollectionFieldsInfo = ({
  children,
  collection,
}: {
  children?: React.ReactNode;
  collection: Collection;
}) => {
  const fields = collection.fields;

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

      <SheetContent className="!max-w-[30vw] space-y-4 px-4">
        <SheetHeader className="px-0 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <DatabaseIcon className="w-5 h-5" />
            Collection Fields
          </SheetTitle>
          <SheetDescription>
            Field definitions and their configurations for the{' '}
            <code>{collection.tableName}</code> collection.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4">
          {fields.map((field) => {
            const ui = fieldUI[field.kind] || fieldUI.unknown;
            const Icon = GetFielfKindIconRecord[field.kind] || UnknownIcon;

            return (
              <div
                key={field.name}
                className="p-4 border border-border rounded-lg bg-cms-surface/30 hover:bg-cms-surface-hover/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-background/80 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{field.name}</h3>
                      <Badge className={`text-xs ${ui.color}`}>
                        {field.kind}
                      </Badge>
                      {field.isPrimaryKey && (
                        <Badge
                          variant="outline"
                          className="text-xs flex items-center gap-1"
                        >
                          <PrimaryKeyIcon className="w-3 h-3" />
                          PK
                        </Badge>
                      )}
                      {!field.isNullable && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {field.hasDefault && (
                        <Badge variant="outline" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>

                    {field.enumValues && field.enumValues.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Options: {field.enumValues.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

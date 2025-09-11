import collections from '@/collections';
import { OpacaCollection, OpacaField } from '@/cms/types';
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

const getFieldIcon = (fieldType: string) => {
  const icons: Record<string, any> = {
    text: TypeIcon,
    int: HashIcon,
    float: HashIcon,
    boolean: ToggleLeftIcon,
    date: CalendarIcon,
    datetime: CalendarIcon,
    json: FileTextIcon,
    enum: ListIcon,
    relation: LinkIcon,
  };
  return icons[fieldType] || TypeIcon;
};

const getFieldTypeDisplay = (
  field: any,
): { type: string; details?: string } => {
  if (typeof field === 'string') {
    return { type: field };
  }

  if ('enum' in field) {
    return { type: 'enum', details: `Options: ${field.enum.join(', ')}` };
  }

  if ('relation' in field) {
    const many = field.relation.many ? ' (many)' : '';
    return { type: 'relation', details: `→ ${field.relation.to}${many}` };
  }

  if (field.type) {
    if (typeof field.type === 'string') {
      return { type: field.type };
    }

    if ('enum' in field.type) {
      return {
        type: 'enum',
        details: `Options: ${field.type.enum.join(', ')}`,
      };
    }

    if ('relation' in field.type) {
      const many = field.type.relation.many ? ' (many)' : '';
      return {
        type: 'relation',
        details: `→ ${field.type.relation.to}${many}`,
      };
    }
  }

  return { type: 'complex' };
};

const getFieldBadgeColor = (type: string) => {
  const colors: Record<string, string> = {
    text: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    int: 'bg-green-500/10 text-green-400 border-green-500/30',
    float: 'bg-green-500/10 text-green-400 border-green-500/30',
    boolean: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    date: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    datetime: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    json: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    enum: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    relation: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  };
  return colors[type] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
};

const CollectionFieldsInfo = ({
  children,
  collection,
}: {
  children?: React.ReactNode;
  collection: OpacaCollection;
}) => {
  const fieldEntries = Object.entries(collection.fields);

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
        <div className="grid gap-4">
          {fieldEntries.map(([fieldName, field]) => {
            const { type, details } = getFieldTypeDisplay(field);
            const FieldIcon = getFieldIcon(type);
            const badgeColor = getFieldBadgeColor(type);

            const isRequired =
              typeof field !== 'string' &&
              !('enum' in field) &&
              !('relation' in field) &&
              (field as OpacaField).required === true;

            const isUnique =
              typeof field !== 'string' &&
              !('enum' in field) &&
              !('relation' in field) &&
              (field as OpacaField).unique === true;

            const hasDefault =
              typeof field !== 'string' &&
              !('enum' in field) &&
              !('relation' in field) &&
              (field as OpacaField).default !== undefined;

            return (
              <div
                key={fieldName}
                className="p-4 border border-border rounded-lg bg-cms-surface/30 hover:bg-cms-surface-hover/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-8 h-8 bg-background/80 rounded-lg flex items-center justify-center">
                      <FieldIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{fieldName}</h3>
                        <Badge className={`text-xs ${badgeColor}`}>
                          {type}
                        </Badge>
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
                        <p className="text-sm text-muted-foreground">
                          {details}
                        </p>
                      )}
                      {hasDefault && (
                        <p className="text-xs text-muted-foreground">
                          Default:{' '}
                          <code className="bg-muted px-1 py-0.5 rounded text-xs">
                            {JSON.stringify(
                              typeof field !== 'string' &&
                                !('enum' in field) &&
                                !('relation' in field)
                                ? (field as OpacaField).default
                                : null,
                            )}
                          </code>
                        </p>
                      )}
                    </div>
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

export default CollectionFieldsInfo;

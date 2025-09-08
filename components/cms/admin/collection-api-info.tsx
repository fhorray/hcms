import collections from '@/cms/collections';
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

export const CollectionFieldsInfo = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const collectionData = collections.collections[0];

  const ApiEntries = [];

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="cursor-pointer">
            <DatabaseZapIcon className="w-4 h-4 mr-2" />
            API
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="!max-w-[40vw] space-y-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DatabaseIcon className="w-5 h-5" />
            Collection API
          </SheetTitle>
          <SheetDescription></SheetDescription>
        </SheetHeader>
        <div className="grid gap-4">API INFO</div>
      </SheetContent>
    </Sheet>
  );
};

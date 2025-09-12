import collections from '@/collections';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { DatabaseIcon, DatabaseZapIcon } from 'lucide-react';
import React from 'react';

const CollectionApiInfo = ({ children }: { children?: React.ReactNode }) => {
  const collectionData = {};

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

export default CollectionApiInfo;

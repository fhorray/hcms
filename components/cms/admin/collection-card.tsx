import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, DatabaseIcon } from 'lucide-react';
import Link from 'next/link';
import { TableCmsSchemaTyped } from '@/cms/builders';
import type { ColumnMeta, FieldKind } from '@/cms/builders';
import { GetFielfKindIconRecord } from '@/cms/client/ui/records';
import { humanize } from '@/lib/utils';
import { Collection } from '@/new-cms/config/types';

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const slug = collection.tableName?.toLowerCase();
  const Icon = DatabaseIcon;

  const fieldCount = collection.fields.length;
  const requiredFields = collection.fields.filter((f) => !f.isNullable).length;

  const fields = collection.fields as ColumnMeta[];
  const previewFields = fields.slice(0, 5);

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-gradient-to-br hover:scale-[1.02] border border-primary/20 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-background/80 backdrop-blur flex items-center justify-center rounded-md">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold capitalize">
                {humanize(collection.tableName as string)}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Collection: {slug}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {fieldCount} fields
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Required fields:</span>
          <span className="font-medium">{requiredFields}</span>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Field types:</p>
          <div className="flex flex-wrap gap-1">
            {previewFields.map((field) => {
              const FieldKindIcon =
                GetFielfKindIconRecord[field.kind as FieldKind];

              return (
                <Badge
                  key={field.name}
                  variant="outline"
                  className="text-xs py-0.5 px-1.5 capitalize"
                >
                  <FieldKindIcon className="w-3 h-3 mr-1 inline-block" />
                  {field.name === 'Id' ? 'ID' : humanize(field.name)}
                </Badge>
              );
            })}

            {fields.length > 4 && (
              <Badge variant="outline" className="text-xs py-0.5 px-1.5">
                +{fields.length - 5} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <Link href={`/admin/${slug}`} className="w-full cursor-pointer">
          <Button className="w-full group  cursor-pointer">
            Manage Collection
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

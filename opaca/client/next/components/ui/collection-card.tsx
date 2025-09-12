import { OpacaCollection } from '@opaca/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, DatabaseIcon } from 'lucide-react';
import Link from 'next/link';
import { getIconByPascal } from '../../utils/collections';

interface CollectionCardProps {
  collection: OpacaCollection;
}

function CollectionCard({ collection }: CollectionCardProps) {
  const slug =
    collection.slug?.toLowerCase() ||
    collection.name.toLowerCase().replace(/\s+/g, '-');
  const Icon = getIconByPascal(collection.icon) ?? DatabaseIcon;
  // const colorClass = getCollectionColor(slug);
  const fieldCount = collection.fields
    ? Object.keys(collection.fields).length
    : 0;
  const requiredFields = 0;

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-gradient-to-br hover:scale-[1.02] border border-primary/20 cursor-pointer`}
    >
      <CardHeader className="pb-3 !rounded-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-background/80 backdrop-blur flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {collection.name}
              </CardTitle>
              <CardDescription className="text-sm">
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
            {Object.entries(collection.fields)
              .slice(0, 4)
              .map(([fieldName, field]) => {
                let fieldType = 'complex';

                if (typeof field === 'string') {
                  fieldType = field;
                } else if ('enum' in field) {
                  fieldType = 'enum';
                } else if ('relation' in field) {
                  fieldType = 'relation';
                } else if (typeof field === 'object' && 'type' in field) {
                  if (typeof field.type === 'string') {
                    fieldType = field.type;
                  } else if ('enum' in field.type) {
                    fieldType = 'enum';
                  } else if ('relation' in field.type) {
                    fieldType = 'relation';
                  }
                }

                return (
                  <Badge
                    key={fieldName}
                    variant="outline"
                    className="text-xs py-0"
                  >
                    {fieldType}
                  </Badge>
                );
              })}
            {Object.keys(collection.fields).length > 4 && (
              <Badge variant="outline" className="text-xs py-0">
                +{Object.keys(collection.fields).length - 4} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <Link href={`/admin/${slug}`} className="w-full cursor-pointer">
          <Button className="w-full group cursor-pointer">
            Manage Collection
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default CollectionCard;

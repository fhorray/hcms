import { OpacaCollection, OpacaConfig } from '@opaca/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, FileText, Settings, TrendingUp } from 'lucide-react';
import CollectionCard from '../components/ui/collection-card';

type Props = {
  config: OpacaConfig;
};

export default function Dashboard({ config }: Props) {
  // Do NOT import from the app. Read from config injected by the wrapper.
  const collections = Object.values(config.collections) as OpacaCollection[];

  const totalCollections = collections.length;
  const totalFields = collections.reduce(
    (acc, c) => acc + Object.keys(c.fields).length,
    0,
  );

  const stats = [
    {
      title: 'Total Collections',
      value: totalCollections,
      description: 'Active content types',
      icon: Database,
      color: 'text-cms-accent-blue',
    },
    {
      title: 'Total Fields',
      value: totalFields,
      description: 'Across all collections',
      icon: FileText,
      color: 'text-cms-accent-purple',
    },
    {
      title: 'Configuration',
      value: 'Ready',
      description: 'CMS is configured',
      icon: Settings,
      color: 'text-cms-accent-green',
    },
    {
      title: 'Performance',
      value: 'Optimal',
      description: 'System status',
      icon: TrendingUp,
      color: 'text-cms-warning',
    },
  ] as const;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">CMS Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your content collections and system configuration
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color ?? ''}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Collections Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Collections</h2>
            <p className="text-muted-foreground">
              Manage your content types and their fields
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <CollectionCard key={collection.slug} collection={collection} />
          ))}
        </div>
      </div>
    </div>
  );
}

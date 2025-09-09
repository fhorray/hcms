'use client';

import { hcms } from '@/cms';
import { CollectionInput } from '@/cms/types';
import { CollectionCard } from '@/components/cms/admin/collection-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useOpaca } from '@/new-cms/hooks/use-opaca';
import { Database, FileText, Settings, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { collectionsList, stats: statsData } = useOpaca();

  const totalCollections = collectionsList?.length;
  const totalFields = statsData?.totalCollections;

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
    },
    {
      title: 'Performance',
      value: 'Optimal',
      description: 'System status',
      icon: TrendingUp,
      color: 'text-cms-warning',
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cms-accent-blue to-cms-accent-purple bg-clip-text text-transparent">
          CMS Dashboard
        </h1>
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
                <Icon className={`h-4 w-4 ${stat.color}`} />
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
          {collectionsList?.map((c) => (
            <CollectionCard key={c.tableName} collection={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

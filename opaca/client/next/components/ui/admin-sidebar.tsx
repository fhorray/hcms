'use client';

import { useOpaca } from '@opaca/client/hooks';
import collections from '@/collections';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { BarChart3, Database, DatabaseIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getIconByPascal } from '../../utils/collections';

function AdminSidebar() {
  const { admin } = useOpaca();
  const { state } = useSidebar();
  const pathname = usePathname();
  const collapsed = state === 'collapsed';

  const isCollectionActive = (slug: string) =>
    pathname.startsWith(`/admin/${slug}`);

  return (
    <Sidebar
      className="border-r border-gray-50/5 bg-sidebar"
      collapsible="icon"
    >
      {/* Header */}
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-cms-accent-blue to-cms-accent-purple rounded-lg flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {admin?.appName}
              </h2>
              <p className="text-xs text-muted-foreground">
                Content Management
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs font-medium px-2 mb-2">
            Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    href="/admin"
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
                      pathname === '/admin'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent',
                    )}
                  >
                    <BarChart3 className="w-4 h-4" />
                    {!collapsed && <span>Overview</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collections */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs font-medium px-2 mb-2">
            Collections
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-4">
              {Object.values(collections).map((collection) => {
                const slug =
                  collection.name.toLowerCase() ||
                  collection.name.toLowerCase().replace(/\s+/g, '-');
                const Icon = getIconByPascal(collection.icon) || DatabaseIcon;

                return (
                  <SidebarMenuItem key={collection.name}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={`/admin/${slug}`}
                        className={cn(
                          'flex items-center gap-3 rounded-lg transition-colors text-sm',
                          isCollectionActive(slug)
                            ? 'bg-primary text-primary-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent',
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {!collapsed && (
                          <div className="flex items-center gap-2 text-left">
                            <span className="block font-medium">
                              {collection.name}
                            </span>
                            <span className="text-xs opacity-70">
                              ({Object.keys(collection.fields).length} fields)
                            </span>
                          </div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AdminSidebar;

'use client';
import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { MenuIcon } from 'lucide-react';
import React from 'react';

export const AdminHeader = () => {
  const { open } = useSidebar();
  return (
    <header
      className={cn(
        'flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur',
        open ? 'h-19.5 ' : 'h-16 ',
      )}
    >
      <div className="flex items-center gap-4">
        <SidebarTrigger className="cursor-pointer">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-sidebar-accent "
          >
            <MenuIcon className="w-4 h-4" />
          </Button>
        </SidebarTrigger>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">Welcome to your CMS</div>
      </div>
    </header>
  );
};

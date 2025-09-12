'use client';

import React from 'react';

import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from '@opaca/client/next/components/ui/admin-sidebar';
import AdminHeader from '@opaca/client/next/components/ui/admin-header';

interface CMSLayoutProps {
  children: React.ReactNode;
}

export default function CMSLayout({ children }: CMSLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen w-full">
          <AdminSidebar />

          <div className="flex-1 flex flex-col">
            <AdminHeader />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}

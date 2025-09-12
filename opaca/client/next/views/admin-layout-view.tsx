'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import React from 'react';
import AdminSidebar from '../components/ui/admin-sidebar';
import AdminHeader from '../components/ui/admin-header';
import { usePathname } from 'next/navigation';

const AdminLayoutView = ({ children }: { children: React.ReactNode }) => {
  const path = usePathname();

  if (path === '/admin/login') {
    return <>{children}</>;
  }

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
};

export default AdminLayoutView;

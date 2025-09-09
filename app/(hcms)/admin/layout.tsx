import { AdminHeader } from '@/components/cms/admin/admin-header';
import { AdminSidebar } from '@/components/cms/admin/admin-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

interface CMSLayoutProps {
  children: React.ReactNode;
}

function CMSLayout({ children }: CMSLayoutProps) {
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

export default CMSLayout;

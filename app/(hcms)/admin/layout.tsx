import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { AdminSidebar } from '@/components/cms/admin/admin-sidebar';

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
            <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="cursor-pointer">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-sidebar-accent "
                  >
                    <Menu className="w-4 h-4" />
                  </Button>
                </SidebarTrigger>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Welcome to your CMS
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default CMSLayout;

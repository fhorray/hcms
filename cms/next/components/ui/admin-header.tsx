'use client';
import { useOpaca } from '@/cms/hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, MenuIcon } from 'lucide-react';
import React from 'react';

const AdminHeader = () => {
  const { open } = useSidebar();
  const { auth } = useOpaca();

  const session = auth.useSession().data;

  return (
    <header
      className={cn(
        'flex items-center justify-between px-6 border-b transition-all duration-300',
        'bg-header-bg border-header-border backdrop-blur-sm',
        open ? 'h-19.5' : 'h-16',
      )}
    >
      <div className="flex items-center gap-4">
        <SidebarTrigger className="cursor-pointer">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-sidebar-accent transition-colors"
          >
            <MenuIcon className="w-4 h-4" />
          </Button>
        </SidebarTrigger>
        <div className="text-xs text-header-text-muted">
          Welcome to your CMS
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <div className="text-sm font-medium text-header-text">
            {session?.user.name}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-auto px-2 rounded-full hover:bg-sidebar-accent transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 ring-2 ring-avatar-ring ring-offset-2 ring-offset-avatar-ring-offset transition-all hover:ring-primary-glow">
                  <AvatarImage
                    src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${session?.user.name}`}
                    alt={`${session?.user.name}'s profile`}
                    className="object-cover"
                  />
                </Avatar>
                <ChevronDownIcon className="h-3 w-3 text-header-text-muted" />
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session?.user.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user.name}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              Account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AdminHeader;

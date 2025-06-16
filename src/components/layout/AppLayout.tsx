
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Computer,
  Users,
  FileCode,
  TerminalSquare,
  Settings,
  LifeBuoy,
  Moon,
  Sun,
  Bot,
  Activity, // For Monitors
  KeyRound, // For Licenses
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/computers', label: 'Computers', icon: Computer },
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/procedures', label: 'Procedures', icon: FileCode },
  { href: '/monitors', label: 'Monitors', icon: Activity },
  { href: '/licenses', label: 'Software Licenses', icon: KeyRound },
  { href: '/commands', label: 'Custom Commands', icon: TerminalSquare },
];

const settingsNavItems = [
 { href: '/settings', label: 'Settings', icon: Settings },
];


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setIsDarkMode(storedTheme === 'dark');
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    localStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newIsDarkMode);
  };

  if (!mounted) {
    return (
      <div className="flex min-h-svh w-full bg-background">
        <div className="hidden md:flex flex-col w-[16rem] bg-sidebar p-4">
          <div className="flex items-center gap-2 px-2 py-4">
            <Bot className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold text-sidebar-foreground">Remote Manager</h1>
          </div>
          <Separator className="my-2 bg-sidebar-border" />
          <div className="flex-1 space-y-2 mt-4">
            {[...Array(navItems.length)].map((_, i) => ( 
              <SidebarMenuSkeleton key={i} showIcon />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-0">
          <div className="flex items-center justify-between p-2 group-data-[collapsible=icon]:justify-center">
            <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <Bot className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-semibold text-sidebar-foreground">Remote Manager</h1>
            </Link>
            <SidebarTrigger className="md:hidden" />
          </div>
        </SidebarHeader>
        <Separator className="my-0 bg-sidebar-border group-data-[collapsible=icon]:mx-2" />
        <SidebarContent className="p-2">
          <ScrollArea className="h-full">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                      tooltip={item.label}
                    >
                      <a>
                        <item.icon />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
        <Separator className="my-0 bg-sidebar-border group-data-[collapsible=icon]:mx-2" />
        <SidebarFooter className="p-2">
          <SidebarMenu>
             {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                      tooltip={item.label}
                    >
                      <a>
                        <item.icon />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            <SidebarMenuItem>
              <SidebarMenuButton onClick={toggleTheme} tooltip={isDarkMode ? "Light Mode" : "Dark Mode"}>
                {isDarkMode ? <Sun /> : <Moon />}
                <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Support">
                <LifeBuoy />
                <span>Support</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6 shadow-sm md:hidden">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Remote Manager</h1>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

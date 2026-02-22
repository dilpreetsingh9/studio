'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Bell,
  Calendar,
  HeartPulse,
  LayoutDashboard,
  MessageSquare,
  Settings,
  User,
  FileText,
  Languages,
} from 'lucide-react';
import { patientData } from '@/lib/data';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function DashboardLayout({ 
  children,
  onLanguageChange,
  currentLanguage = 'English'
}: { 
  children: React.ReactNode;
  onLanguageChange?: (lang: string) => void;
  currentLanguage?: string;
}) {
  const [localLangName, setLocalLangName] = useState('Local Language');

  useEffect(() => {
    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
      const localLang = displayNames.of(navigator.language.split('-')[0]);
      if (localLang) setLocalLangName(localLang);
    } catch (e) {
      console.warn('Language detection failed');
    }
  }, []);

  const sidebarNav = [
    { name: 'Dashboard', href: '#', icon: LayoutDashboard, current: true },
    { name: 'Health Records', href: '#', icon: FileText, current: false },
    { name: 'Vitals', href: '#', icon: HeartPulse, current: false },
    { name: 'Appointments', href: '#', icon: Calendar, current: false },
    { name: 'Messages', href: '#', icon: MessageSquare, current: false },
    { name: 'Profile', href: '#', icon: User, current: false },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo className="size-8 text-primary" />
            <span className="text-xl font-bold tracking-tight text-primary">HealthConnex</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {sidebarNav.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={item.current}
                  tooltip={item.name}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings">
                <Link href="#">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Your Profile">
                <Avatar className="size-6">
                  <AvatarImage src={patientData.avatarUrl} alt={patientData.name} />
                  <AvatarFallback>{patientData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{patientData.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-background/50 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
                  <Languages className="h-4 w-4" />
                  <span className="hidden sm:inline">{currentLanguage}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onLanguageChange?.('English')}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLanguageChange?.(localLangName)}>
                  {localLangName} (Auto-detected)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary/10">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

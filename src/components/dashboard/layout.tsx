
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
  Check,
} from 'lucide-react';
import { patientData } from '@/lib/data';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { t } from '@/lib/translations';

const COMMON_LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Chinese', code: 'zh' },
  { name: 'Arabic', code: 'ar' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'German', code: 'de' },
  { name: 'Japanese', code: 'ja' },
];

export function DashboardLayout({ 
  children,
  onLanguageChange,
  currentLanguage = 'English'
}: { 
  children: React.ReactNode;
  onLanguageChange?: (lang: string) => void;
  currentLanguage?: string;
}) {
  const [detectedLangName, setDetectedLangName] = useState<string | null>(null);

  useEffect(() => {
    const detectLanguage = () => {
      try {
        const langs = navigator.languages || [navigator.language];
        const primary = langs[0].split('-')[0];
        const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });

        if (primary === 'en' && langs.length > 1) {
          const secondary = langs.find(l => !l.startsWith('en'));
          if (secondary) {
            return displayNames.of(secondary.split('-')[0]) || null;
          }
          return 'French'; 
        }

        return displayNames.of(primary) || null;
      } catch (e) {
        return 'French';
      }
    };

    setDetectedLangName(detectLanguage());
  }, []);

  const sidebarNav = [
    { name: t('dashboard', currentLanguage), href: '#', icon: LayoutDashboard, current: true },
    { name: t('healthRecords', currentLanguage), href: '#', icon: FileText, current: false },
    { name: t('vitals', currentLanguage), href: '#', icon: HeartPulse, current: false },
    { name: t('appointments', currentLanguage), href: '#', icon: Calendar, current: false },
    { name: t('messages', currentLanguage), href: '#', icon: MessageSquare, current: false },
    { name: t('profile', currentLanguage), href: '#', icon: User, current: false },
  ];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="h-14 flex justify-center px-4">
          <div className="flex items-center gap-2">
            <Logo className="size-8 text-primary shrink-0" />
            <span className="text-xl font-bold tracking-tight text-primary group-data-[collapsible=icon]:hidden">HealthConnex</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="px-2">
            {sidebarNav.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={item.current}
                  tooltip={item.name}
                  className="h-10 transition-all hover:bg-primary/5 active:scale-95"
                >
                  <Link href={item.href}>
                    <item.icon className="size-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('settings', currentLanguage)} className="h-10 hover:bg-primary/5">
                <Link href="#">
                  <Settings className="size-5" />
                  <span>{t('settings', currentLanguage)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={t('profile', currentLanguage)} className="h-12 hover:bg-primary/5">
                <Avatar className="size-7">
                  <AvatarImage src={patientData.avatarUrl} alt={patientData.name} />
                  <AvatarFallback>{patientData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-bold text-sm">{patientData.name}</span>
                  <span className="text-[10px] text-muted-foreground">O+ Patient</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="overflow-hidden flex flex-col h-svh">
        <header className="flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-md sticky top-0 z-30 px-4 shrink-0">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="h-9 w-9" />
            <div className="md:hidden flex items-center gap-1.5 ml-1">
              <Logo className="size-6 text-primary" />
              <span className="text-lg font-bold tracking-tight text-primary">HealthConnex</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 rounded-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all px-3">
                  <Languages className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">{currentLanguage}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => onLanguageChange?.('English')} className="justify-between">
                  English {currentLanguage === 'English' && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
                
                {detectedLangName && detectedLangName !== 'English' && (
                  <DropdownMenuItem onClick={() => onLanguageChange?.(detectedLangName)} className="justify-between">
                    {detectedLangName} (Detected) {currentLanguage === detectedLangName && <Check className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span>More Languages</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                      {COMMON_LANGUAGES.map((lang) => (
                        <DropdownMenuItem 
                          key={lang.code} 
                          onClick={() => onLanguageChange?.(lang.name)}
                          className="justify-between"
                        >
                          {lang.name} {currentLanguage === lang.name && <Check className="h-4 w-4 text-primary" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2.5 h-2 w-2 bg-destructive rounded-full border-2 border-background" />
              <span className="sr-only">Notifications</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary/10 pb-10">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

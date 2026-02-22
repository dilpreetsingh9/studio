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

        // If primary is English, look for a secondary non-English language
        if (primary === 'en' && langs.length > 1) {
          const secondary = langs.find(l => !l.startsWith('en'));
          if (secondary) {
            return displayNames.of(secondary.split('-')[0]) || null;
          }
          // Regional fallbacks if only English is found (e.g., Canada context)
          // For demo purposes, we'll suggest a common secondary if only English is present
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
                <Button variant="outline" size="sm" className="gap-2 rounded-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all">
                  <Languages className="h-4 w-4" />
                  <span className="hidden sm:inline">{currentLanguage}</span>
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

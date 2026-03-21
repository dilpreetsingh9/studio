'use client';

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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Bell,
  Calendar,
  HeartPulse,
  LayoutDashboard,
  Settings,
  User,
  FileText,
  Languages,
  Check,
  Users,
  UserPlus,
  LogOut,
} from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

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
  currentLanguage = 'English',
  activeTab = 'overview',
  onTabChange,
  userProfile,
}: { 
  children: React.ReactNode;
  onLanguageChange?: (lang: string) => void;
  currentLanguage?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  userProfile?: any;
}) {
  const [detectedLangName, setDetectedLangName] = useState<string | null>(null);
  const { toast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    const detectLanguage = () => {
      try {
        const langs = navigator.languages || [navigator.language];
        const primary = langs[0].split('-')[0];
        const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
        return displayNames.of(primary) || null;
      } catch (e) {
        return 'English';
      }
    };
    setDetectedLangName(detectLanguage());
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const sidebarNav = [
    { id: 'overview', name: t('dashboard', currentLanguage), icon: LayoutDashboard },
    { id: 'records', name: t('healthRecords', currentLanguage), icon: FileText },
    { id: 'vitals', name: t('vitals', currentLanguage), icon: HeartPulse },
    { id: 'appointments', name: t('appointments', currentLanguage), icon: Calendar },
    { id: 'profile', name: t('profile', currentLanguage), icon: User },
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
          <SidebarGroup>
            <SidebarMenu className="px-2">
              {sidebarNav.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    tooltip={item.name}
                    className="h-10 transition-all hover:bg-primary/5 active:scale-95"
                    onClick={() => onTabChange?.(item.id === 'records' ? 'records' : 'overview')}
                  >
                    <item.icon className="size-5" />
                    <span className="font-medium">{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={t('profile', currentLanguage)} className="h-12 hover:bg-primary/5">
                <Avatar className="size-7">
                  <AvatarFallback>{userProfile?.firstName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-bold text-sm truncate">{userProfile?.firstName} {userProfile?.lastName}</span>
                  <span className="text-[10px] text-muted-foreground">{userProfile?.bloodType} Patient</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip="Logout" 
                className="h-10 hover:bg-destructive/5 text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="size-5" />
                <span>Logout</span>
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
                {COMMON_LANGUAGES.map((lang) => (
                  <DropdownMenuItem key={lang.code} onClick={() => onLanguageChange?.(lang.name)} className="justify-between">
                    {lang.name} {currentLanguage === lang.name && <Check className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative">
              <Bell className="h-5 w-5" />
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

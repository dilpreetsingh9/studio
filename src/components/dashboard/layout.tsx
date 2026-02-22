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
  MessageSquare,
  Settings,
  User,
  FileText,
  Languages,
  Check,
  Users,
  UserPlus,
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
import { useToast } from '@/hooks/use-toast';

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
}: { 
  children: React.ReactNode;
  onLanguageChange?: (lang: string) => void;
  currentLanguage?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}) {
  const [detectedLangName, setDetectedLangName] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleShareWithFamily = () => {
    toast({
      title: t('shareWithFamily', currentLanguage),
      description: t('sharingProgress', currentLanguage),
    });
  };

  const handleReferFriend = () => {
    toast({
      title: t('referFriend', currentLanguage),
      description: t('referralCopied', currentLanguage),
    });
  };

  const sidebarNav = [
    { id: 'overview', name: t('dashboard', currentLanguage), icon: LayoutDashboard },
    { id: 'records', name: t('healthRecords', currentLanguage), icon: FileText },
    { id: 'vitals', name: t('vitals', currentLanguage), icon: HeartPulse },
    { id: 'appointments', name: t('appointments', currentLanguage), icon: Calendar },
    { id: 'messages', name: t('messages', currentLanguage), icon: MessageSquare },
    { id: 'profile', name: t('profile', currentLanguage), icon: User },
  ];

  const communityActions = [
    { id: 'share', name: t('shareWithFamily', currentLanguage), icon: Users, onClick: handleShareWithFamily },
    { id: 'refer', name: t('referFriend', currentLanguage), icon: UserPlus, onClick: handleReferFriend },
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
                    isActive={activeTab === item.id || (item.id === 'overview' && ['vitals', 'appointments', 'messages', 'profile'].includes(activeTab))}
                    tooltip={item.name}
                    className="h-10 transition-all hover:bg-primary/5 active:scale-95"
                    onClick={() => {
                      if (['overview', 'records'].includes(item.id)) {
                        onTabChange?.(item.id);
                      } else {
                        onTabChange?.('overview');
                        // Optional: Scroll to specific section logic could go here
                      }
                    }}
                  >
                    <item.icon className="size-5" />
                    <span className="font-medium">{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="px-4">{t('community', currentLanguage)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-2">
                {communityActions.map((action) => (
                  <SidebarMenuItem key={action.id}>
                    <SidebarMenuButton
                      tooltip={action.name}
                      className="h-10 transition-all hover:bg-primary/5 active:scale-95"
                      onClick={action.onClick}
                    >
                      <action.icon className="size-5" />
                      <span className="font-medium">{action.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={t('settings', currentLanguage)} className="h-10 hover:bg-primary/5">
                <Settings className="size-5" />
                <span>{t('settings', currentLanguage)}</span>
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

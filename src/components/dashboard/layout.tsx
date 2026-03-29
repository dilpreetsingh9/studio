'use client';

import React from 'react';
import { 
  Sparkles, 
  Mic, 
  History, 
  User,
  LogOut,
  Languages,
  Check
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { t } from '@/lib/translations';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';

const COMMON_LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'Hindi', code: 'hi' },
];

export function DashboardLayout({ 
  children,
  onLanguageChange,
  currentLanguage = 'English',
  activeTab = 'today',
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
  const auth = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  const navItems = [
    { id: 'today', label: 'Today', icon: Sparkles },
    { id: 'log', label: 'Log', icon: Mic },
    { id: 'history', label: 'History', icon: History },
    { id: 'you', label: 'You', icon: User },
  ];

  return (
    <div className="flex flex-col h-svh bg-background overflow-hidden">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 shrink-0 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <span className="text-lg font-black tracking-tight text-primary">NITYA</span>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-full border-primary/10 bg-primary/5 text-primary hover:bg-primary/10 transition-all px-3">
                <Languages className="h-3.5 w-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{currentLanguage}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              {COMMON_LANGUAGES.map((lang) => (
                <DropdownMenuItem key={lang.code} onClick={() => onLanguageChange?.(lang.name)} className="justify-between text-xs font-bold">
                  {lang.name} {currentLanguage === lang.name && <Check className="h-3 w-3 text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={handleLogout} className="text-destructive font-bold text-xs">
                <LogOut className="h-3 w-3 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Avatar className="size-8 border-2 border-primary/10">
            <AvatarFallback className="bg-primary/5 text-primary font-black text-[10px]">
              {userProfile?.firstName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background pb-24">
        <div className="max-w-md mx-auto p-4 md:p-6 space-y-6">
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[rgba(0,0,0,0.08)] z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-[56px] max-w-md mx-auto px-4">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange?.(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-[3px] w-16 transition-colors duration-200",
                  isActive ? "text-primary" : "text-[#999999]"
                )}
              >
                <item.icon className={cn("size-[20px]", isActive && "fill-current")} />
                <span className="text-[10px] font-bold leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

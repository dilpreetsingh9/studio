'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LifeStage } from '@/lib/types';
import { 
  RefreshCw, 
  Smartphone,
  ClipboardList,
  Settings2,
  UserCircle,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function PatientProfile({ language = 'English', profile }: { language?: string; profile?: any }) {
  const [lifeStage, setLifeStage] = useState<LifeStage>(profile?.lifeStage || 'Regular');
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();

  const avatarImage = PlaceHolderImages.find(img => img.id === 'patient-saher');

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: "Biometrics Updated",
        description: "Synced latest temperature and sleep data.",
      });
    }, 2000);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <Card className="shadow-md border-primary/5 overflow-hidden bg-white rounded-[2rem]">
      <CardHeader className="pb-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-primary/10 shrink-0 overflow-hidden relative shadow-inner">
              {avatarImage && (
                <Image 
                  src={avatarImage.imageUrl}
                  alt={`${profile?.firstName} portrait`}
                  fill
                  className="object-cover"
                  priority
                  sizes="80px"
                  data-ai-hint={avatarImage.imageHint}
                />
              )}
              <AvatarFallback className="text-2xl font-black">{profile?.firstName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <CardTitle className="text-2xl font-black tracking-tight">{profile?.firstName} {profile?.lastName}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] font-black px-2 py-0.5">
                  {profile?.gender}
                </Badge>
                <span className="text-xs font-bold text-muted-foreground">
                  {profile?.dateOfBirth ? `${new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear()} years` : '...'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className={cn(
                "h-12 gap-2 rounded-2xl border-primary/10 shadow-sm transition-all",
                isSyncing && "bg-primary/5 animate-pulse"
              )}
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin text-primary" /> : <Smartphone className="h-4 w-4 text-primary" />}
              <span className="text-xs font-black uppercase tracking-widest">Sync Patterns</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-12 gap-2 rounded-2xl border-destructive/10 text-destructive hover:bg-destructive/5 transition-all shadow-sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-muted/20 p-5 rounded-3xl border border-muted/30 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
              <Settings2 className="h-3 w-3" />
              Identity Mode
            </label>
            <Select value={lifeStage} onValueChange={(v) => setLifeStage(v as LifeStage)}>
              <SelectTrigger className="h-12 rounded-2xl border-primary/5 bg-white shadow-sm font-bold text-sm">
                <SelectValue placeholder="Select Mode" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="Regular">Regular Intelligence</SelectItem>
                <SelectItem value="TTC">Trying to Conceive</SelectItem>
                <SelectItem value="Pregnancy">Pregnancy Support</SelectItem>
                <SelectItem value="Perimenopause">Perimenopause Tracking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
              <ClipboardList className="h-3 w-3" />
              Medical Context
            </label>
            <div className="bg-white p-4 rounded-2xl border border-primary/5 text-sm italic text-foreground leading-relaxed shadow-sm">
              "{profile?.allergies?.length ? `Sensitivities: ${profile.allergies.join(', ')}. ` : ''} 
              Type ${profile?.bloodType}. Focus: ${profile?.healthFocus || 'General balance'}."
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Badge({ children, variant, className }: { children: React.ReactNode, variant?: any, className?: string }) {
  return (
    <div className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors",
      variant === 'secondary' ? "border-transparent bg-secondary text-secondary-foreground" : "border-foreground",
      className
    )}>
      {children}
    </div>
  )
}

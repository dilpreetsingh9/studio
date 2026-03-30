
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RelationshipState, Medication, Report } from '@/lib/types';
import { 
  Pill, 
  Microscope, 
  Target, 
  Bell, 
  ChevronRight, 
  LogOut,
  Sparkles,
  Loader2,
  Settings2,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, collection } from 'firebase/firestore';
import { generateYouSynthesis } from '@/ai/flows/generate-you-synthesis';

export default function PatientProfile({ language = 'English', profile }: { language?: string; profile?: any }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [jeivaSynthesis, setJeivaSynthesis] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();

  const avatarImage = PlaceHolderImages.find(img => img.id === 'patient-saher');

  // Load relationship state
  const relRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid, 'relationship', 'state') : null;
  }, [user, db]);
  const { data: relationship } = useDoc<RelationshipState>(relRef);

  // Load medications for streak calculation
  const medsRef = useMemoFirebase(() => {
    return user ? collection(db, 'users', user.uid, 'medications') : null;
  }, [user, db]);
  const { data: medications } = useCollection<Medication>(medsRef);

  // Load reports for count
  const reportsRef = useMemoFirebase(() => {
    return user ? collection(db, 'users', user.uid, 'records') : null;
  }, [user, db]);
  const { data: reports } = useCollection<Report>(reportsRef);

  const daysActive = useMemo(() => {
    if (relationship?.days_active) return relationship.days_active;
    if (!profile?.createdAt) return 1;
    const createdDate = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
    return Math.max(1, Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24)));
  }, [relationship, profile?.createdAt]);

  const routineStreak = useMemo(() => {
    if (!medications || medications.length === 0) return 0;
    return Math.max(...medications.map(m => m.streak || 0));
  }, [medications]);

  const reportsCount = reports?.length || 0;

  useEffect(() => {
    const fetchSynthesis = async () => {
      if (!profile || jeivaSynthesis || isSynthesizing) return;
      setIsSynthesizing(true);
      try {
        const res = await generateYouSynthesis({
          daysActive,
          relationshipMaturity: relationship?.relationship_maturity || 'new',
          mostConsistent: relationship?.most_consistent_behaviour || null,
          biggestChange: relationship?.biggest_change || null,
          targetLanguage: language
        });
        setJeivaSynthesis(res.content);
      } catch (error) {
        console.error('Jeiva synthesis failed', error);
      } finally {
        setIsSynthesizing(false);
      }
    };
    fetchSynthesis();
  }, [profile, daysActive, relationship, language]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: "Biometrics Updated",
        description: "Synced latest health patterns.",
      });
    }, 2000);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const resolveField = (value: any, fallback: string) => {
    if (!value || (typeof value === 'string' && value.startsWith('$'))) return fallback;
    return value;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* ── Profile header ──────────────────────────────── */}
      <div className="flex items-center gap-5 p-2">
        <Avatar className="h-20 w-20 border-4 border-primary/10 shadow-sm relative overflow-hidden">
          {avatarImage && (
            <Image 
              src={avatarImage.imageUrl}
              alt="Profile"
              fill
              className="object-cover"
              sizes="80px"
              data-ai-hint="woman portrait"
            />
          )}
          <AvatarFallback className="text-2xl font-black bg-primary/5 text-primary">
            {profile?.firstName?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h1 className="greeting-name text-primary">{resolveField(profile?.firstName, 'You')}</h1>
          <p className="text-label font-black text-muted-foreground uppercase tracking-widest">
            With Jeiva for {daysActive} {daysActive === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>

      {/* ── Relationship stats ───────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile value={daysActive} label="Days together" />
        <StatTile value={routineStreak} label="Routine streak" />
        <StatTile value={reportsCount} label="Reports scanned" />
      </div>

      {/* ── Jeiva synthesis card ─────────────────────────── */}
      <Card className="shadow-lg border-none bg-primary text-primary-foreground overflow-hidden rounded-[2rem] relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Sparkles className="h-16 w-16" />
        </div>
        <CardContent className="p-6 space-y-4 relative z-10">
          <p className="text-label font-black text-white/40 uppercase tracking-[0.2em]">Jeiva on your journey</p>
          {isSynthesizing ? (
            <div className="flex items-center gap-3 text-white/60 italic synthesis-body">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding the right words...
            </div>
          ) : (
            <p className="synthesis-body text-white/90 italic leading-relaxed">
              "{jeivaSynthesis || "Welcome to the beginning of our health navigation together."}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Data menu ────────────────────────────────────── */}
      <Card className="shadow-md border-primary/5 rounded-[2rem] overflow-hidden bg-white">
        <CardContent className="p-0 divide-y divide-primary/5">
          <div className="px-6 py-4 bg-muted/5">
            <p className="text-label font-black text-muted-foreground uppercase tracking-[0.2em]">Your Data</p>
          </div>
          
          <MenuItem 
            icon={<Pill className="h-4 w-4" />} 
            label="Routine" 
            meta={`${medications?.length || 0} active`} 
          />
          
          <MenuItem 
            icon={<Microscope className="h-4 w-4" />} 
            label="Lab Observations" 
            meta={`${reportsCount} reports`} 
          />
          
          <MenuItem 
            icon={<Target className="h-4 w-4" />} 
            label="Health Focus" 
            meta={resolveField(profile?.healthFocus, 'General balance')} 
          />
          
          <MenuItem 
            icon={<Bell className="h-4 w-4" />} 
            label="Notifications" 
            meta="Manage" 
            isLast 
          />
        </CardContent>
      </Card>

      {/* ── Actions ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <Button 
          variant="outline" 
          className={cn(
            "h-14 rounded-2xl border-primary/10 gap-3 font-ui text-label font-black uppercase tracking-widest",
            isSyncing && "bg-primary/5 animate-pulse"
          )}
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? <RefreshCw className="h-5 w-5 animate-spin text-primary" /> : <Smartphone className="h-5 w-5 text-primary" />}
          Sync Patterns
        </Button>
        
        <Button 
          variant="ghost" 
          className="h-14 rounded-2xl text-destructive hover:bg-destructive/5 font-ui text-label font-black uppercase tracking-widest gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <Card className="bg-white border-primary/5 shadow-sm rounded-3xl overflow-hidden group">
      <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
        <span className="font-content text-metric font-bold text-primary group-hover:scale-110 transition-transform">{value}</span>
        <span className="text-[10px] font-black text-muted-foreground uppercase leading-tight tracking-tight px-1">{label}</span>
      </CardContent>
    </Card>
  );
}

function MenuItem({ icon, label, meta, isLast = false }: { icon: React.ReactNode; label: string; meta: string; isLast?: boolean }) {
  return (
    <div className="flex items-center justify-between p-5 hover:bg-muted/5 transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-xl bg-primary/5 text-primary/60 group-hover:bg-primary group-hover:text-white transition-all">
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="text-body font-bold text-foreground">{label}</p>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{meta}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:translate-x-1 group-hover:text-primary transition-all" />
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { RelationshipState, Medication, Report } from '@/lib/types';
import { 
  Pill, 
  Microscope, 
  Target, 
  Bell, 
  Loader2,
  ChevronRight,
  Settings,
  ShieldCheck,
  Info
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, collection, updateDoc } from 'firebase/firestore';
import { generateYouSynthesis } from '@/ai/flows/generate-you-synthesis';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import MedicationReminder from './medication-reminder';
import LabResults from './lab-results';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const FOCUS_OPTIONS = [
  "Energy and how I feel day to day",
  "Hormonal balance and my cycle",
  "Weight and metabolism",
  "Sleep and recovery",
  "Stress and mental clarity",
  "General prevention — I just want to stay ahead"
];

export default function PatientProfile({ language = 'English', profile }: { language?: string; profile?: any }) {
  const [jeivaSynthesis, setJeivaSynthesis] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [activeSheet, setActiveSheet] = useState<'routine' | 'labs' | 'focus' | 'notifications' | null>(null);
  
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const avatarImage = PlaceHolderImages.find(img => img.id === 'patient-saher');

  // Load relationship state
  const relRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid, 'relationship', 'state') : null;
  }, [user, db]);
  const { data: relationship } = useDoc<RelationshipState>(relRef);

  // Load medications
  const medsRef = useMemoFirebase(() => {
    return user ? collection(db, 'users', user.uid, 'medications') : null;
  }, [user, db]);
  const { data: medications } = useCollection<Medication>(medsRef);

  // Load reports
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

  const handleUpdateFocus = async (focus: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { healthFocus: focus });
      setActiveSheet(null);
      toast({ title: "Focus updated", description: "Jeiva will now prioritize this in your insights." });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const resolveField = (value: any, fallback: string) => {
    if (!value || (typeof value === 'string' && value.startsWith('$'))) return fallback;
    return value;
  };

  const daysLabel = daysActive === 1
    ? 'With Jeiva for 1 day'
    : `With Jeiva for ${daysActive} days`;

  const displayName = resolveField(profile?.firstName, 'You');

  if (!profile && isSynthesizing) {
    return (
      <div className="you-skeleton">
        <div className="skeleton skeleton--avatar" />
        <div className="skeleton skeleton--name" />
        <div className="skeleton skeleton--stats" />
        <div className="skeleton skeleton--card" />
      </div>
    );
  }

  return (
    <div className="you-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Profile header ──────────────────────────────── */}
      <div className="profile-header">
        <div className="profile-avatar relative">
          {avatarImage ? (
            <Image 
              src={avatarImage.imageUrl}
              alt="Profile"
              fill
              className="object-cover"
              sizes="52px"
              data-ai-hint="woman portrait"
            />
          ) : (
            <span>{displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{displayName}</h1>
          <p className="profile-since">{daysLabel}</p>
        </div>
      </div>

      {/* ── Relationship stats ───────────────────────────── */}
      <div className="stat-grid">
        <StatTile value={daysActive} label="Days together" />
        <StatTile value={routineStreak} label="Routine streak" />
        <StatTile value={reportsCount} label="Reports scanned" />
      </div>

      {/* ── Jeiva synthesis card ─────────────────────────── */}
      <div className="jeiva-card">
        <div className="jeiva-card-label">Jeiva on your journey</div>
        {isSynthesizing ? (
          <div className="flex items-center gap-2 text-white/60 italic synthesis-body text-[13px]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Finding the right words...
          </div>
        ) : (
          <p className="jeiva-card-body">
            "{jeivaSynthesis || "Welcome to the beginning of our health navigation together."}"
          </p>
        )}
      </div>

      {/* ── Data menu ────────────────────────────────────── */}
      <div className="menu-card">
        <div className="menu-section-label">Your data</div>

        <MenuItem
          icon={<Pill className="h-3.5 w-3.5 text-primary/60" />}
          label="Routine"
          meta={`${medications?.length || 0} active`}
          onClick={() => setActiveSheet('routine')}
        />

        <MenuItem
          icon={<Microscope className="h-3.5 w-3.5 text-primary/60" />}
          label="Lab observations"
          meta={`${reportsCount} reports`}
          onClick={() => setActiveSheet('labs')}
        />

        <MenuItem
          icon={<Target className="h-3.5 w-3.5 text-primary/60" />}
          label="Health focus"
          meta={resolveField(profile?.healthFocus, 'General balance')}
          onClick={() => setActiveSheet('focus')}
        />

        <MenuItem
          icon={<Bell className="h-3.5 w-3.5 text-primary/60" />}
          label="Notifications"
          meta="Manage"
          isLast
          onClick={() => setActiveSheet('notifications')}
        />
      </div>

      <div className="menu-card">
        <div className="menu-section-label">Account</div>
        <MenuItem
          icon={<ShieldCheck className="h-3.5 w-3.5 text-primary/60" />}
          label="Privacy & Security"
          meta="Encrypted"
        />
        <MenuItem
          icon={<Settings className="h-3.5 w-3.5 text-primary/60" />}
          label="Settings"
          meta="Advanced"
          isLast
        />
      </div>

      {/* ── Sign out ─────────────────────────────────────── */}
      <button className="signout-btn mt-2" onClick={handleLogout}>
        Sign out
      </button>

      {/* ── Routine Sheet ────────────────────────────────── */}
      <Sheet open={activeSheet === 'routine'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-[3rem] h-[85vh] p-0 overflow-hidden border-none shadow-2xl">
          <div className="h-full flex flex-col p-6">
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="text-2xl font-black">Your Routine</SheetTitle>
              <SheetDescription>Daily sustenance and rituals Jeiva is tracking.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto pb-12">
              <MedicationReminder 
                medications={medications || []} 
                language={language}
                relationshipMaturity={relationship?.relationship_maturity || 'developing'}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Labs Sheet ──────────────────────────────────── */}
      <Sheet open={activeSheet === 'labs'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-[3rem] h-[85vh] p-0 overflow-hidden border-none shadow-2xl">
          <div className="h-full flex flex-col p-6">
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="text-2xl font-black">Lab Observations</SheetTitle>
              <SheetDescription>Translating clinical data into plain language.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto pb-12">
              <LabResults profile={profile} language={language} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Focus Sheet ──────────────────────────────────── */}
      <Sheet open={activeSheet === 'focus'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-[3rem] h-[auto] min-h-[50vh] p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-8 space-y-6">
            <SheetHeader className="text-left">
              <SheetTitle className="text-2xl font-black">Change your focus</SheetTitle>
              <SheetDescription>Jeiva uses this to decide what signals to surface first.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-3">
              {FOCUS_OPTIONS.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className={cn(
                    "h-auto py-4 px-6 justify-start text-left rounded-2xl border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all",
                    profile?.healthFocus === option && "border-primary bg-primary/5"
                  )}
                  onClick={() => handleUpdateFocus(option)}
                >
                  <span className="text-sm font-bold">{option}</span>
                </Button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Notifications Sheet ──────────────────────────── */}
      <Sheet open={activeSheet === 'notifications'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-[3rem] h-[auto] p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-8 space-y-6">
            <SheetHeader className="text-left">
              <SheetTitle className="text-2xl font-black">Notifications</SheetTitle>
              <SheetDescription>How Jeiva reaches out to you.</SheetDescription>
            </SheetHeader>
            <div className="space-y-4">
              <div className="bg-primary/5 p-5 rounded-3xl border border-primary/10 flex gap-4 items-start">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-primary italic">Soft Reminders</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Jeiva uses "Soft Reminders" to protect your privacy. Instead of medical details, notifications will say "Upcoming event" or "A quick check-in."
                  </p>
                </div>
              </div>
              <Button className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest" variant="outline">
                Manage Device Settings
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="stat-tile">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function MenuItem({ icon, label, meta, isLast = false, onClick }: { icon: React.ReactNode; label: string; meta: string; isLast?: boolean; onClick?: () => void }) {
  return (
    <div className={cn(
      "menu-row",
      isLast && "menu-row--last",
      onClick && "cursor-pointer active:opacity-60 transition-opacity"
    )} onClick={onClick}>
      <div className="menu-icon">{icon}</div>
      <div className="menu-label">{label}</div>
      <div className="menu-meta">{meta}</div>
      <div className="menu-caret">›</div>
    </div>
  );
}

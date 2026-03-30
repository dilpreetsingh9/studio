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
  Settings2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, collection } from 'firebase/firestore';
import { generateYouSynthesis } from '@/ai/flows/generate-you-synthesis';

export default function PatientProfile({ language = 'English', profile }: { language?: string; profile?: any }) {
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
        />

        <MenuItem
          icon={<Microscope className="h-3.5 w-3.5 text-primary/60" />}
          label="Lab observations"
          meta={`${reportsCount} reports`}
        />

        <MenuItem
          icon={<Target className="h-3.5 w-3.5 text-primary/60" />}
          label="Health focus"
          meta={resolveField(profile?.healthFocus, 'General balance')}
        />

        <MenuItem
          icon={<Bell className="h-3.5 w-3.5 text-primary/60" />}
          label="Notifications"
          meta="Manage"
          isLast
        />
      </div>

      {/* ── Sign out ─────────────────────────────────────── */}
      <button className="signout-btn mt-2" onClick={handleLogout}>
        Sign out
      </button>
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

function MenuItem({ icon, label, meta, isLast = false }: { icon: React.ReactNode; label: string; meta: string; isLast?: boolean }) {
  return (
    <div className={`menu-row ${isLast ? 'menu-row--last' : ''}`}>
      <div className="menu-icon">{icon}</div>
      <div className="menu-label">{label}</div>
      <div className="menu-meta">{meta}</div>
      <div className="menu-caret">›</div>
    </div>
  );
}

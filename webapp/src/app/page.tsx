'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import PatientProfile from '@/components/dashboard/patient-profile';
import CycleIntelligence from '@/components/dashboard/cycle-intelligence';
import RecoveryIntelligence from '@/components/dashboard/recovery-intelligence';
import SymptomTracker from '@/components/dashboard/symptom-tracker';
import LifestyleGuidance from '@/components/dashboard/lifestyle-guidance';
import HealthRecords from '@/components/dashboard/health-records';
import HealthJournal from '@/components/dashboard/health-journal';
import WeeklyInsightLetter from '@/components/dashboard/weekly-insight-letter';
import VitalsMonitor from '@/components/dashboard/vitals-monitor';
import { RoutineStrip } from '@/components/dashboard/routine-strip';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, orderBy, query } from 'firebase/firestore';
import { LoginScreen } from '@/components/auth/login-screen';
import { ProfileSetup } from '@/components/auth/profile-setup';
import { ECGLoader } from '@/components/ecg-loader';
import { Report, Medication } from '@/lib/types';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const profileRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [user, db]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const recordsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(collection(db, 'users', user.uid, 'records'), orderBy('scan_date', 'desc'));
  }, [user, db]);

  const { data: recordsData, isLoading: isRecordsLoading } = useCollection<Report>(recordsQuery);

  const medsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return collection(db, 'users', user.uid, 'medications');
  }, [user, db]);

  const { data: medications } = useCollection<Medication>(medsQuery);

  const [activeTab, setActiveTab] = useState('today');
  const [language, setLanguage] = useState('English');

  const daysWithJeiva = useMemo(() => {
    if (!profile?.createdAt) return 1;
    const createdDate = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
    const diffMs = new Date().getTime() - createdDate.getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 3600 * 24)));
  }, [profile?.createdAt]);

  // Routine Intelligence Logic
  const routineStripState = useMemo(() => {
    if (!medications) return { state: 'none' as const };
    
    const WINDOW_MINUTES = 30;
    const now = new Date();

    const parseTime = (timeStr: string) => {
      const parts = timeStr.split(' ');
      if (parts.length !== 2) return new Date();
      const [time, modifier] = parts;
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    const isSameDay = (d1: Date, d2: Date) => {
      return d1.getDate() === d2.getDate() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getFullYear() === d2.getFullYear();
    };

    for (const med of medications) {
      const scheduledTime = parseTime(med.reminderTime);
      const diffMs = now.getTime() - scheduledTime.getTime();
      const minutesDiff = diffMs / 60000;
      
      const takenToday = med.lastTaken && isSameDay(new Date(med.lastTaken), now);

      if (takenToday) continue;

      if (minutesDiff >= -WINDOW_MINUTES && minutesDiff <= WINDOW_MINUTES) {
        return { state: 'due' as const, medication: med };
      }

      if (minutesDiff > WINDOW_MINUTES && minutesDiff < 360) {
        return { state: 'missed' as const, medication: med };
      }
    }

    return { state: 'none' as const };
  }, [medications]);

  if (isUserLoading || (user && isProfileLoading)) {
    return <ECGLoader />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!profile && !isProfileLoading) {
    return <ProfileSetup />;
  }

  const isMale = profile?.gender === 'Male';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'today':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            {/* Header Identity strip */}
            <div className="px-1 space-y-0.5">
              <h1 className="greeting-name">{profile?.firstName}</h1>
              <p className="text-label font-bold text-primary uppercase tracking-[0.2em]">With Jeiva for {daysWithJeiva} days</p>
            </div>

            {/* ROUTINE STRIP */}
            {routineStripState.state !== 'none' && routineStripState.medication && (
              <RoutineStrip 
                state={routineStripState.state} 
                medication={routineStripState.medication} 
                firstName={profile?.firstName || 'Priya'}
              />
            )}

            {/* 1. SYNTHESIS CARD */}
            <LifestyleGuidance profile={profile} />

            {/* 2. VITALS CARD */}
            <VitalsMonitor language={language} isStrip />

            {/* 3. CYCLE/RECOVERY CARD */}
            {!isMale ? (
              <CycleIntelligence language={language} profile={profile} />
            ) : (
              <RecoveryIntelligence language={language} profile={profile} />
            )}

            {/* 4. CHECK-IN CARD */}
            <SymptomTracker profile={profile} />

            {/* Weekly Insight Letter */}
            <WeeklyInsightLetter profile={profile} language={language} />
          </div>
        );

      case 'scan':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <HealthRecords 
              records={recordsData || []} 
              isLoading={isRecordsLoading}
              language={language}
            />
          </div>
        );

      case 'you':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            <PatientProfile language={language} profile={profile} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout 
      onLanguageChange={setLanguage} 
      currentLanguage={language} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      userProfile={profile}
    >
      {renderTabContent()}
    </DashboardLayout>
  );
}

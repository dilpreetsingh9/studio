'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import PatientProfile from '@/components/dashboard/patient-profile';
import CycleIntelligence from '@/components/dashboard/cycle-intelligence';
import RecoveryIntelligence from '@/components/dashboard/recovery-intelligence';
import SymptomTracker from '@/components/dashboard/symptom-tracker';
import LifestyleGuidance from '@/components/dashboard/lifestyle-guidance';
import HealthRecords from '@/components/dashboard/health-records';
import LabResults from '@/components/dashboard/lab-results';
import MedicationReminder from '@/components/dashboard/medication-reminder';
import HealthJournal from '@/components/dashboard/health-journal';
import WeeklyInsightLetter from '@/components/dashboard/weekly-insight-letter';
import VitalsMonitor from '@/components/dashboard/vitals-monitor';
import { MedicalRecord } from '@/lib/types';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { LoginScreen } from '@/components/auth/login-screen';
import { ProfileSetup } from '@/components/auth/profile-setup';
import { ECGLoader } from '@/components/ecg-loader';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const profileRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [user, db]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [activeTab, setActiveTab] = useState('today');
  const [language, setLanguage] = useState('English');

  const daysWithJeiva = useMemo(() => {
    if (!profile?.createdAt) return 1;
    const createdDate = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
    const diffMs = new Date().getTime() - createdDate.getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 3600 * 24)));
  }, [profile?.createdAt]);

  if (isUserLoading || (user && isProfileLoading)) {
    return <ECGLoader />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!profile && !isProfileLoading) {
    return <ProfileSetup />;
  }

  const handleRecordScanned = (newRecord: Omit<MedicalRecord, 'id' | 'capturedAt'>) => {
    const record: MedicalRecord = {
      id: new Date().toISOString(),
      capturedAt: new Date(),
      ...newRecord,
    };
    setRecords((prev) => [record, ...prev]);
  };

  const isMale = profile?.gender === 'Male';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'today':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            {/* Header Identity strip */}
            <div className="px-1 space-y-0.5">
              <h1 className="text-2xl font-black tracking-tight">{profile?.firstName}</h1>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">With Jeiva for {daysWithJeiva} days</p>
            </div>

            {/* 1. SYNTHESIS CARD (Indigo Card) */}
            <LifestyleGuidance profile={profile} />

            {/* 2. VITALS CARD (3-tile strip) */}
            <VitalsMonitor language={language} isStrip />

            {/* 3. CYCLE/RECOVERY CARD */}
            {!isMale ? (
              <CycleIntelligence language={language} profile={profile} />
            ) : (
              <RecoveryIntelligence language={language} profile={profile} />
            )}

            {/* 4. CHECK-IN CARD (Always last) */}
            <SymptomTracker />

            {/* Weekly Insight Letter (Contextual addition) */}
            <WeeklyInsightLetter profile={profile} language={language} />
          </div>
        );
      
      case 'log':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <HealthJournal language={language} profile={profile} />
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <HealthRecords 
              records={records} 
              onRecordScanned={handleRecordScanned}
              language={language}
            />
          </div>
        );

      case 'you':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            <PatientProfile language={language} profile={profile} />
            <MedicationReminder language={language} />
            <LabResults language={language} />
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

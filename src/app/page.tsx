'use client';

import { useState } from 'react';
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Nitya's Daily Synthesis HERO Card */}
            <LifestyleGuidance profile={profile} />

            {/* Weekly Insight Letter */}
            <WeeklyInsightLetter profile={profile} language={language} />

            {/* Intelligence Card */}
            {!isMale ? (
              <CycleIntelligence language={language} profile={profile} />
            ) : (
              <RecoveryIntelligence language={language} profile={profile} />
            )}
          </div>
        );
      
      case 'log':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <HealthJournal language={language} profile={profile} />
            <SymptomTracker />
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
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

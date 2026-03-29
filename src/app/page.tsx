'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import PatientProfile from '@/components/dashboard/patient-profile';
import CycleIntelligence from '@/components/dashboard/cycle-intelligence';
import SymptomTracker from '@/components/dashboard/symptom-tracker';
import LifestyleGuidance from '@/components/dashboard/lifestyle-guidance';
import HealthRecords from '@/components/dashboard/health-records';
import LabResults from '@/components/dashboard/lab-results';
import MedicationReminder from '@/components/dashboard/medication-reminder';
import HealthJournal from '@/components/dashboard/health-journal';
import QuickActions from '@/components/dashboard/quick-actions';
import WeeklyInsightLetter from '@/components/dashboard/weekly-insight-letter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MedicalRecord } from '@/lib/types';
import { FileText, Sparkles, Mail } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('overview');
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

  return (
    <DashboardLayout 
      onLanguageChange={setLanguage} 
      currentLanguage={language} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      userProfile={profile}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/50 border shadow-none p-1 rounded-2xl">
            <TabsTrigger value="overview" className="gap-2 rounded-xl data-[state=active]:shadow-md">
              <Sparkles className="h-4 w-4" />
              Intelligence
            </TabsTrigger>
            <TabsTrigger value="records" className="gap-2 rounded-xl data-[state=active]:shadow-md">
              <FileText className="h-4 w-4" />
              Clinical
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6 mt-0">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Nitya's Daily Synthesis HERO Card */}
              <LifestyleGuidance profile={profile} />

              {/* Weekly Insight Letter - New Retention Component */}
              <WeeklyInsightLetter profile={profile} language={language} />

              <PatientProfile language={language} profile={profile} />
              
              {!isMale && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CycleIntelligence language={language} profile={profile} />
                  <SymptomTracker />
                </div>
              )}

              <QuickActions 
                onRecordScanned={handleRecordScanned} 
                onNavigateToRecords={() => setActiveTab('records')}
                language={language}
              />

              <div id="medication-section">
                <MedicationReminder language={language} />
              </div>
              
              <HealthJournal language={language} />
            </div>
            
            <div className="space-y-6 lg:col-span-1">
              <LabResults language={language} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="records" className="mt-0">
          <HealthRecords 
            records={records} 
            onRecordScanned={handleRecordScanned}
            language={language}
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

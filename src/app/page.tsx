'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import PatientProfile from '@/components/dashboard/patient-profile';
import LabResults from '@/components/dashboard/lab-results';
import HealthRecords from '@/components/dashboard/health-records';
import CareNavigation from '@/components/dashboard/care-navigation';
import HealthGoals from '@/components/dashboard/health-goals';
import MedicationReminder from '@/components/dashboard/medication-reminder';
import QuickActions from '@/components/dashboard/quick-actions';
import HealthJournal from '@/components/dashboard/health-journal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MedicalRecord } from '@/lib/types';
import { FileText, LayoutDashboard } from 'lucide-react';
import { t } from '@/lib/translations';

export default function Home() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [language, setLanguage] = useState('English');

  const handleRecordScanned = (newRecord: Omit<MedicalRecord, 'id' | 'capturedAt'>) => {
    const record: MedicalRecord = {
      id: new Date().toISOString(),
      capturedAt: new Date(),
      ...newRecord,
    };
    setRecords((prev) => [record, ...prev]);
  };

  return (
    <DashboardLayout 
      onLanguageChange={setLanguage} 
      currentLanguage={language} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-background border shadow-sm">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              {t('dashboard', language)}
            </TabsTrigger>
            <TabsTrigger value="records" className="gap-2">
              <FileText className="h-4 w-4" />
              {t('healthRecords', language)}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6 mt-0">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <PatientProfile language={language} />
              <LabResults language={language} />
              <QuickActions 
                onRecordScanned={handleRecordScanned} 
                onNavigateToRecords={() => setActiveTab('records')}
                language={language}
              />
              <div id="medication-section">
                <MedicationReminder language={language} />
              </div>
              <HealthGoals language={language} />
              <HealthJournal language={language} />
            </div>
            <div className="space-y-6 lg:col-span-1">
              <CareNavigation language={language} />
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

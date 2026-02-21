import { DashboardLayout } from '@/components/dashboard/layout';
import PatientProfile from '@/components/dashboard/patient-profile';
import VitalsMonitor from '@/components/dashboard/vitals-monitor';
import HealthRecords from '@/components/dashboard/health-records';
import CareNavigation from '@/components/dashboard/care-navigation';
import HealthGoals from '@/components/dashboard/health-goals';
import SecureMessaging from '@/components/dashboard/secure-messaging';
import MedicationReminder from '@/components/dashboard/medication-reminder';
import QuickActions from '@/components/dashboard/quick-actions';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PatientProfile />
          <QuickActions />
          <HealthRecords />
          <VitalsMonitor />
        </div>
        <div className="space-y-6 lg:col-span-1">
          <div id="medication-section">
            <MedicationReminder />
          </div>
          <HealthGoals />
          <CareNavigation />
          <SecureMessaging />
        </div>
      </div>
    </DashboardLayout>
  );
}

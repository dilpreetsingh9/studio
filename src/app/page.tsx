import { DashboardLayout } from '@/components/dashboard/layout';
import PatientProfile from '@/components/dashboard/patient-profile';
import VitalsMonitor from '@/components/dashboard/vitals-monitor';
import AiInsights from '@/components/dashboard/ai-insights';
import CareNavigation from '@/components/dashboard/care-navigation';
import HealthGoals from '@/components/dashboard/health-goals';
import SecureMessaging from '@/components/dashboard/secure-messaging';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PatientProfile />
          <AiInsights />
          <VitalsMonitor />
        </div>
        <div className="space-y-6 lg:col-span-1">
          <CareNavigation />
          <HealthGoals />
          <SecureMessaging />
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Video, MapPin } from 'lucide-react';
import { patientData } from '@/lib/data';
import { t } from '@/lib/translations';

interface CareNavigationProps {
  language?: string;
}

export default function CareNavigation({ language = 'English' }: CareNavigationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {t('careNavigation', language)}
        </CardTitle>
        <CardDescription>Your upcoming appointments and care team.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="text-sm font-bold text-primary">{t('upcomingAppointments', language)}</h3>
        <ul className="space-y-3">
          {patientData.appointments.filter(a => a.status === 'upcoming').map((apt) => (
            <li key={apt.id} className="flex items-center justify-between rounded-xl border p-4 bg-card hover:shadow-sm transition-all group">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{apt.doctor}</p>
                  <p className="text-xs text-muted-foreground font-medium">{apt.specialty}</p>
                  <p className="text-xs text-primary font-semibold mt-0.5">
                    {mounted ? new Date(apt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '...'}, {apt.time}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
                <Video className="h-5 w-5" />
              </Button>
            </li>
          ))}
        </ul>
        <Button className="w-full h-11 rounded-xl" variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Schedule New Appointment
        </Button>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Video } from 'lucide-react';
import { patientData } from '@/lib/data';

export default function CareNavigation() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Care Navigation</CardTitle>
        <CardDescription>Your upcoming appointments and care team.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="text-sm font-semibold">Upcoming Appointments</h3>
        <ul className="space-y-3">
          {patientData.appointments.filter(a => a.status === 'upcoming').map((apt) => (
            <li key={apt.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <Calendar className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-semibold">{apt.doctor}</p>
                  <p className="text-sm text-muted-foreground">{apt.specialty}</p>
                  <p className="text-sm text-muted-foreground">{new Date(apt.date).toDateString()}, {apt.time}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon"><Video className="h-5 w-5" /></Button>
            </li>
          ))}
        </ul>
        <Button className="w-full" variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Schedule New Appointment
        </Button>
      </CardContent>
    </Card>
  );
}

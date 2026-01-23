import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { patientData } from '@/lib/data';

export default function PatientProfile() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 border">
            <AvatarImage src={patientData.avatarUrl} alt={patientData.name} data-ai-hint="woman portrait" />
            <AvatarFallback>{patientData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-3xl font-bold">{patientData.name}</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {patientData.details.age} years old · {patientData.details.gender} · Blood Type: {patientData.details.bloodType}
            </CardDescription>
            <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="font-medium">Allergies:</span>
                {patientData.details.allergies.map(allergy => (
                    <Badge key={allergy} variant="secondary">{allergy}</Badge>
                ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Medical History Summary: </span>
            {patientData.medicalHistory}
        </p>
      </CardContent>
    </Card>
  );
}

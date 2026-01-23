import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { patientData } from '@/lib/data';

export default function HealthGoals() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Goals</CardTitle>
        <CardDescription>Your progress towards a healthier you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {patientData.healthGoals.map((goal) => (
          <div key={goal.id}>
            <div className="mb-1 flex justify-between text-sm">
              <p className="font-medium">{goal.name}</p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{goal.current.toLocaleString()}</span>
                / {goal.target.toLocaleString()} {goal.unit}
              </p>
            </div>
            <Progress value={(goal.current / goal.target) * 100} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

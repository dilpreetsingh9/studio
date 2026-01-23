import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { patientData } from '@/lib/data';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  const className = "h-4 w-4 text-muted-foreground";
  if (trend === 'up') return <ArrowUp className={className} />;
  if (trend === 'down') return <ArrowDown className={className} />;
  return <ArrowRight className={className} />;
};

export default function VitalsMonitor() {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Vitals Monitor</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {patientData.vitals.map((vital) => (
                <Card key={vital.name} className="flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">{vital.name}</p>
                    <vital.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="mt-2">
                    <span className="text-2xl font-bold">{vital.value}</span>
                    <span className="ml-1 text-xs text-muted-foreground">{vital.unit}</span>
                </div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                    <TrendIcon trend={vital.trend} />
                    <span className="ml-1 capitalize">{vital.trend}</span>
                </div>
                </Card>
            ))}
            </div>
      </CardContent>
    </Card>
  );
}

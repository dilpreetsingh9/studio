'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { patientData } from '@/lib/data';
import { ArrowDown, ArrowRight, ArrowUp, Activity } from 'lucide-react';
import { t } from '@/lib/translations';

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  const className = "h-4 w-4 text-muted-foreground";
  if (trend === 'up') return <ArrowUp className={className} />;
  if (trend === 'down') return <ArrowDown className={className} />;
  return <ArrowRight className={className} />;
};

interface VitalsMonitorProps {
  language?: string;
}

export default function VitalsMonitor({ language = 'English' }: VitalsMonitorProps) {
  return (
    <Card className="shadow-sm border-primary/10">
        <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {t('vitalsMonitor', language)}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {patientData.vitals.map((vital) => (
                <Card key={vital.name} className="flex flex-col justify-between p-4 border-primary/5 bg-primary/5 hover:bg-primary/10 transition-colors cursor-default">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{vital.name}</p>
                    <vital.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2">
                    <span className="text-2xl font-black">{vital.value}</span>
                    <span className="ml-1 text-[10px] text-muted-foreground font-medium">{vital.unit}</span>
                </div>
                <div className="mt-1 flex items-center text-[10px] text-muted-foreground font-medium">
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

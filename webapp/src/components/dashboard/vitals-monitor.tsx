
'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { patientData } from '@/lib/data';
import { ArrowDown, ArrowRight, ArrowUp, HeartPulse, Zap, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  const className = "h-3 w-3 text-muted-foreground";
  if (trend === 'up') return <ArrowUp className={className} />;
  if (trend === 'down') return <ArrowDown className={className} />;
  return <ArrowRight className={className} />;
};

interface VitalsMonitorProps {
  language?: string;
  isStrip?: boolean;
}

export default function VitalsMonitor({ isStrip = false }: VitalsMonitorProps) {
  // Use mock data for current state, would be driven by Firestore in production
  const vitals = [
    { name: 'RHR', value: '64', unit: 'bpm', icon: HeartPulse, trend: 'stable' },
    { name: 'Sleep', value: '7.5', unit: 'hrs', icon: Moon, trend: 'up' },
    { name: 'HRV', value: '55', unit: 'ms', icon: Zap, trend: 'up' },
  ];

  const bmiValue = Number(patientData.details.weight || 0) / Math.pow(Number(patientData.details.height || 165) / 100, 2);
  const bmiDisplay = bmiValue > 60 ? "Check your input" : bmiValue.toFixed(1);

  if (isStrip) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {vitals.map((vital) => (
          <Card key={vital.name} className="bg-white border-primary/5 shadow-sm rounded-3xl overflow-hidden group">
            <CardContent className="p-4 flex flex-col gap-1 relative">
              <div className="flex items-center justify-between">
                <vital.icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                <TrendIcon trend={vital.trend as any} />
              </div>
              <div className="mt-1">
                <p className="font-content text-metric tracking-tight leading-none">{vital.value}</p>
                <p className="text-label font-black text-muted-foreground uppercase tracking-widest mt-1 font-ui">{vital.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="shadow-md border-primary/10 bg-white rounded-[2rem] overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {vitals.map((vital) => (
            <div key={vital.name} className="p-4 rounded-3xl bg-secondary/10 border border-secondary/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <vital.icon className="h-5 w-5 text-primary" />
                <TrendIcon trend={vital.trend as any} />
              </div>
              <div>
                <span className="font-content text-metric leading-none">{vital.value}</span>
                <span className="text-label font-bold text-muted-foreground ml-1 uppercase tracking-widest font-ui">{vital.unit}</span>
                <p className="text-label font-black text-muted-foreground uppercase tracking-widest mt-0.5 font-ui">{vital.name}</p>
              </div>
            </div>
          ))}
          <div className="p-4 rounded-3xl bg-accent/5 border border-accent/10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-label font-black text-accent uppercase tracking-widest font-ui">BMI Analysis</span>
            </div>
            <div>
              <span className={cn(
                "font-content leading-tight block",
                bmiValue > 60 ? "text-voice text-destructive" : "text-metric"
              )}>
                {bmiDisplay}
              </span>
              {bmiValue <= 60 && <span className="text-label font-bold text-muted-foreground uppercase tracking-widest font-ui">kg/m²</span>}
              <p className="text-label font-black text-muted-foreground uppercase tracking-widest mt-0.5 font-ui">Your Metric</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

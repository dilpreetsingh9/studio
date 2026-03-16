
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Sparkles, Droplets, Zap, Sun, Moon } from 'lucide-react';
import { patientData } from '@/lib/data';
import { CyclePhase } from '@/lib/types';
import { cn } from '@/lib/utils';

const phaseConfig: Record<CyclePhase, { 
  color: string; 
  icon: any; 
  label: string; 
  desc: string;
  advice: string;
}> = {
  Menstrual: { 
    color: 'bg-red-100 text-red-700 border-red-200', 
    icon: Droplets, 
    label: 'Menstrual Phase', 
    desc: 'Days 1-5 · Shedding',
    advice: 'Prioritize rest and warm nourishing foods.'
  },
  Follicular: { 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    icon: Zap, 
    label: 'Follicular Phase', 
    desc: 'Days 6-12 · Growth',
    advice: 'High energy. Great for creative work and intense exercise.'
  },
  Ovulatory: { 
    color: 'bg-amber-100 text-amber-700 border-amber-200', 
    icon: Sun, 
    label: 'Ovulatory Phase', 
    desc: 'Days 13-16 · Peak Fertility',
    advice: 'Social energy is high. Peak strength and libido.'
  },
  Luteal: { 
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200', 
    icon: Moon, 
    label: 'Luteal Phase', 
    desc: 'Days 17-28 · Preparation',
    advice: 'Slow down. Focus on grounding tasks and gentle movement.'
  },
};

export default function CycleIntelligence({ language = 'English' }) {
  const { currentDay, avgCycleLength, predictedPhase } = patientData.cycleData;
  const config = phaseConfig[predictedPhase];
  const progress = (currentDay / avgCycleLength) * 100;

  return (
    <Card className="shadow-md border-primary/5 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Cycle Intelligence
          </CardTitle>
          <Badge variant="outline" className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", config.color)}>
            {config.label}
          </Badge>
        </div>
        <CardDescription>Your biometrics correlated with your hormonal phase.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative pt-4">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-4xl font-black">Day {currentDay}</span>
              <span className="text-muted-foreground ml-2 text-sm">of {avgCycleLength}</span>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-muted-foreground uppercase">Next Period</p>
              <p className="text-sm font-semibold">in {avgCycleLength - currentDay} days</p>
            </div>
          </div>
          <Progress value={progress} className="h-3 rounded-full bg-secondary/30" />
          
          <div className="grid grid-cols-4 gap-1 mt-2">
            {Object.keys(phaseConfig).map((p) => (
              <div key={p} className={cn(
                "h-1 rounded-full",
                p === predictedPhase ? "bg-primary" : "bg-muted"
              )} />
            ))}
          </div>
        </div>

        <div className="bg-secondary/10 p-4 rounded-2xl border border-secondary/20 flex gap-4 items-start">
          <div className={cn("p-3 rounded-xl", config.color)}>
            <config.icon className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm mb-1">Phase Insight</h4>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              "{config.advice}"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

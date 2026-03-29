'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Droplets, Zap, Sun, Moon, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { patientData } from '@/lib/data';
import { CyclePhase } from '@/lib/types';
import { cn } from '@/lib/utils';
import { generateCycleInsights, GenerateCycleInsightsOutput } from '@/ai/flows/generate-cycle-insights';

const phaseConfig: Record<CyclePhase, { 
  color: string; 
  icon: any; 
  label: string; 
}> = {
  Menstrual: { 
    color: 'bg-red-100 text-red-700 border-red-200', 
    icon: Droplets, 
    label: 'Menstrual Phase', 
  },
  Follicular: { 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    icon: Zap, 
    label: 'Follicular Phase', 
  },
  Ovulatory: { 
    color: 'bg-amber-100 text-amber-700 border-amber-200', 
    icon: Sun, 
    label: 'Ovulatory Phase', 
  },
  Luteal: { 
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200', 
    icon: Moon, 
    label: 'Luteal Phase', 
  },
};

export default function CycleIntelligence({ language = 'English', profile }: { language?: string; profile?: any }) {
  const [insight, setInsight] = useState<GenerateCycleInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentDay, avgCycleLength, predictedPhase } = patientData.cycleData;
  const config = phaseConfig[predictedPhase];
  const progress = (currentDay / avgCycleLength) * 100;
  const isIrregular = profile?.cycleRegularity === 'irregular';

  // Mock logic for transition day: typically day 1, 6, 14, or 17 in a 28 day cycle
  const isTransitionDay = currentDay === 1 || currentDay === 6 || currentDay === 14 || currentDay === 17;

  const fetchCycleInsight = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const result = await generateCycleInsights({
        cycleDay: currentDay,
        cycleLength: avgCycleLength,
        phase: predictedPhase,
        isTransitionDay,
        daysUntilPeriod: avgCycleLength - currentDay,
        biometrics: {
          rhr: { value: Number(patientData.vitals[0].value), trend: patientData.vitals[0].trend as any },
          bbt: { value: Number(patientData.vitals[1].value), trend: patientData.vitals[1].trend as any },
          sleepHrs: Number(patientData.vitals[2].value),
        },
        logs: {
          energy: patientData.symptoms[0]?.value,
          mood: patientData.symptoms[1]?.value,
          painLevel: patientData.symptoms.find(s => s.type === 'Pain')?.value,
          symptoms: patientData.symptoms.map(s => s.type),
        },
        cycleRegularity: profile.cycleRegularity || 'regular',
        targetLanguage: language
      });
      setInsight(result);
    } catch (error) {
      console.error('Failed to fetch cycle insight:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCycleInsight();
  }, [profile, language]);

  return (
    <Card className="shadow-md border-primary/5 overflow-hidden bg-white">
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
        <CardDescription>
          {isIrregular 
            ? "Observing today's unique biometric signals." 
            : "Your signals correlated with your hormonal phase."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative pt-4">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-4xl font-black">Day {currentDay}</span>
              <span className="text-muted-foreground ml-2 text-sm">of {avgCycleLength}</span>
            </div>
            {!isIrregular && (
              <div className="text-right">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Next Period</p>
                <p className="text-sm font-semibold">in {avgCycleLength - currentDay} days</p>
              </div>
            )}
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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground bg-muted/5 rounded-2xl border-2 border-dashed">
            <Loader2 className="h-6 w-6 animate-spin mb-2 opacity-50 text-primary" />
            <p className="text-xs italic">Nitya is reading your signals...</p>
          </div>
        ) : insight && (
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex gap-4 items-start relative overflow-hidden group">
            <div className={cn("p-3 rounded-xl shrink-0", config.color)}>
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium leading-relaxed italic text-foreground">
                "{insight.insight}"
              </p>
            </div>
          </div>
        )}

        {isIrregular && (
          <div className="p-3 bg-secondary/10 rounded-xl border border-secondary/20 flex gap-3 items-center">
            <AlertCircle className="h-4 w-4 text-primary" />
            <p className="text-[10px] font-medium text-muted-foreground">
              I am focusing on what your signals are telling me today. Patterns are more useful than predictions for irregular cycles.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

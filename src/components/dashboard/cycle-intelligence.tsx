
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { patientData } from '@/lib/data';
import { CyclePhase } from '@/lib/types';
import { cn } from '@/lib/utils';
import { generateCycleInsights, GenerateCycleInsightsOutput } from '@/ai/flows/generate-cycle-insights';

const phaseConfig: Record<CyclePhase, { color: string; label: string; }> = {
  Menstrual: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Menstrual' },
  Follicular: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Follicular' },
  Ovulatory: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Ovulatory' },
  Luteal: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: 'Luteal' },
};

export default function CycleIntelligence({ language = 'English', profile }: { language?: string; profile?: any }) {
  const [insight, setInsight] = useState<GenerateCycleInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentDay, avgCycleLength, predictedPhase } = patientData.cycleData;
  const config = phaseConfig[predictedPhase];
  const progress = (currentDay / avgCycleLength) * 100;

  // C-1 Caching: 24 hour check
  useEffect(() => {
    const cachedData = localStorage.getItem(`jeiva_c1_${profile?.id}`);
    if (cachedData) {
      const { value, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        setInsight(value);
      }
    }
  }, [profile?.id]);

  const fetchCycleInsight = async () => {
    if (!profile || insight) return;
    setIsLoading(true);
    try {
      const result = await generateCycleInsights({
        cycleDay: currentDay,
        cycleLength: avgCycleLength,
        phase: predictedPhase,
        biometrics: {
          rhr: { value: Number(patientData.vitals[0].value), trend: patientData.vitals[0].trend as any },
          bbt: { value: Number(patientData.vitals[1].value), trend: patientData.vitals[1].trend as any },
        },
        logs: { energy: 4, painLevel: 1, symptoms: ['clear skin'] },
        targetLanguage: language
      });
      setInsight(result);
      localStorage.setItem(`jeiva_c1_${profile.id}`, JSON.stringify({ value: result, timestamp: Date.now() }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCycleInsight();
  }, [profile, language]);

  return (
    <Card className="shadow-md border-primary/5 bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Cycle Intelligence</CardTitle>
          <Badge variant="outline" className={cn("px-3 py-1 rounded-full text-label font-bold uppercase", config.color)}>{config.label}</Badge>
        </div>
        <CardDescription className="font-ui text-small">Biometric signals correlated with your phase.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative pt-4">
          <div className="flex justify-between items-end mb-2">
            <div><span className="text-display font-content">Day {currentDay}</span><span className="text-muted-foreground ml-2 text-label font-bold uppercase tracking-widest">of {avgCycleLength}</span></div>
          </div>
          <Progress value={progress} className="h-3 rounded-full bg-secondary/30" />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground bg-muted/5 rounded-2xl border-2 border-dashed">
            <Loader2 className="h-6 w-6 animate-spin mb-2 text-primary opacity-50" />
            <p className="text-small italic">Reading signals...</p>
          </div>
        ) : insight && (
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex gap-4 items-start">
            <div className={cn("p-3 rounded-xl shrink-0", config.color)}><MessageSquare className="h-5 w-5" /></div>
            <p className="font-content text-voice italic">"{insight.insight}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

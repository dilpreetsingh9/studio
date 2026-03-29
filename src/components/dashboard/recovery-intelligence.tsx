'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Activity, Zap, Loader2, Battery, TrendingUp, TrendingDown } from 'lucide-react';
import { patientData } from '@/lib/data';
import { cn } from '@/lib/utils';
import { generateRecoveryInsights, GenerateRecoveryInsightsOutput } from '@/ai/flows/generate-recovery-insights';

export default function RecoveryIntelligence({ language = 'English', profile }: { language?: string; profile?: any }) {
  const [insight, setInsight] = useState<GenerateRecoveryInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use mock data for current state, would be driven by real longitudinal data in prod
  const hrv = { value: 55, trend: 'up' };
  const rhr = { value: 64, trend: 'stable' };
  const sleepAvg = 7.2;

  const fetchRecoveryInsight = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const result = await generateRecoveryInsights({
        hrv,
        rhr,
        sleepAvg,
        daysSinceWorkout: 1,
        activityDays: 4,
        energyScore: patientData.symptoms[0]?.value || 3,
        stressScore: patientData.symptoms.find(s => s.type === 'Stress')?.value || 2,
        targetLanguage: language
      });
      setInsight(result);
    } catch (error) {
      console.error('Failed to fetch recovery insight:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecoveryInsight();
  }, [profile, language]);

  const isPositive = hrv.trend === 'up';

  return (
    <Card className="shadow-md border-primary/5 overflow-hidden bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Battery className="h-5 w-5 text-primary" />
            Energy & Recovery
          </CardTitle>
          <Badge variant="outline" className={cn(
            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
            isPositive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"
          )}>
            {isPositive ? 'Recharging' : 'Steady State'}
          </Badge>
        </div>
        <CardDescription>
          Using HRV to understand your body's readiness for the day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">HRV</span>
              {hrv.trend === 'up' ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-amber-500" />}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black">{hrv.value}</span>
              <span className="text-xs text-muted-foreground font-medium">ms</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Internal balance signal</p>
          </div>
          <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">RHR</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black">{rhr.value}</span>
              <span className="text-xs text-muted-foreground font-medium">bpm</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Baseline rhythm</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground bg-muted/5 rounded-2xl border-2 border-dashed">
            <Loader2 className="h-6 w-6 animate-spin mb-2 opacity-50 text-primary" />
            <p className="text-xs italic">Jeiva is reading your energy...</p>
          </div>
        ) : insight && (
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex gap-4 items-start relative overflow-hidden group">
            <div className="p-3 rounded-xl shrink-0 bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium leading-relaxed italic text-foreground">
                "{insight.insight}"
              </p>
            </div>
          </div>
        )}

        <div className="p-3 bg-accent/5 rounded-xl border border-accent/10 flex gap-3 items-center">
          <Zap className="h-4 w-4 text-primary" />
          <p className="text-[10px] font-medium text-muted-foreground">
            HRV tells us about your nervous system. A higher number generally means your body is responding well to life's demands.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

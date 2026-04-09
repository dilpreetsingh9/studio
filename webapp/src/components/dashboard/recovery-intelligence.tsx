'use client';

import { useState, useEffect, useMemo } from 'react';
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

  // Recovery score 0–100
  // Weighted: HRV 50%, Sleep 30%, RHR 20%
  const recoveryScore = useMemo(() => {
    const hrvScore = Math.min(100, (hrv.value / 65) * 100);        // 65ms = baseline
    const sleepScore = Math.min(100, (sleepAvg / 8) * 100);       // 8hrs = baseline
    const rhrScore = Math.max(0, 100 - ((rhr.value - 50) * 2));   // 50bpm = baseline

    return Math.round(
      (hrvScore * 0.5) + (sleepScore * 0.3) + (rhrScore * 0.2)
    );
  }, [hrv.value, rhr.value, sleepAvg]);

  const fetchRecoveryInsight = async () => {
    if (!profile || insight) return;
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

  const isPositive = recoveryScore >= 70;

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
          Using biometrics to understand your body's readiness.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* RECOVERY SCORE HERO GAUGE */}
        <div className="flex flex-col items-center justify-center py-6 bg-primary/5 rounded-[2rem] border border-primary/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(61,48,96,0.05),transparent_70%)]" />
          <div className="relative flex items-center justify-center h-32 w-32">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-primary/10"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - recoveryScore / 100)}
                strokeLinecap="round"
                className="text-primary transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-black tracking-tighter text-primary">{recoveryScore}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">Score</span>
            </div>
          </div>
          <div className="mt-4 flex flex-col items-center gap-1">
            <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em]">Body Recovery</p>
            <p className="text-[11px] font-bold text-muted-foreground italic">
              {recoveryScore > 85 ? "Optimal readiness" : (recoveryScore > 65 ? "Steady state" : "Rest recommended")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">HRV</span>
              {hrv.trend === 'up' ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-amber-500" />}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black">{hrv.value}</span>
              <span className="text-xs text-muted-foreground font-medium">ms</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Internal balance</p>
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
          <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
            Recovery uses HRV, Sleep, and RHR to score your nervous system. A higher number indicates your body is handling life's demands well.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

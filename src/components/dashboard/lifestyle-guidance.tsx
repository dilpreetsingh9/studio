'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Apple, Dumbbell, Wind, Sparkles, Loader2, MessageSquare, Briefcase, Users } from 'lucide-react';
import { patientData } from '@/lib/data';
import { generateHealthRecommendations, GenerateHealthRecommendationsOutput } from '@/ai/flows/generate-health-recommendations';
import { generatePhaseGuidance, GeneratePhaseGuidanceOutput } from '@/ai/flows/generate-phase-guidance';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const iconMap: Record<string, any> = {
  Nutrition: Apple,
  Movement: Dumbbell,
  Work: Briefcase,
  Social: Users,
  Rest: Wind,
};

export default function LifestyleGuidance({ profile }: { profile: any }) {
  const [nityaInsight, setNityaInsight] = useState<GenerateHealthRecommendationsOutput | null>(null);
  const [phaseGuidance, setPhaseGuidance] = useState<GeneratePhaseGuidanceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuidanceLoading, setIsGuidanceLoading] = useState(false);

  const fetchNityaInsight = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const result = await generateHealthRecommendations({
        clinicalData: {
          firstName: profile.firstName,
          timeOfDay: new Date().getHours() < 12 ? 'Morning' : 'Afternoon',
          cycleDay: patientData.cycleData.currentDay,
          cycleLength: patientData.cycleData.avgCycleLength,
          phase: patientData.cycleData.predictedPhase,
          vitals: {
            rhr: { value: Number(patientData.vitals[0].value), trend: patientData.vitals[0].trend },
            sleep: { value: Number(patientData.vitals[2].value), trend: patientData.vitals[2].trend },
            hrv: { value: Number(patientData.vitals[3].value), trend: patientData.vitals[3].trend },
            bmiStatus: 'Optimal'
          },
          logs: {
            energy: patientData.symptoms[0]?.value || 3,
            mood: patientData.symptoms[1]?.value || 3,
            journalSnippet: patientData.journalEntries?.[0]?.content,
            missedMedsCount: 0,
            daysSinceWorkout: 1
          },
          medicalHistory: profile.medicalHistory || patientData.medicalHistory,
        },
        relationshipState: {
          daysActive: 12,
          dataRichnessScore: 0.3,
          recentInsightThemes: [],
          relationshipMaturity: 'developing',
          targetLanguage: 'English'
        }
      });
      setNityaInsight(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPhaseGuidance = async () => {
    if (!profile) return;
    setIsGuidanceLoading(true);
    try {
      const result = await generatePhaseGuidance({
        phase: patientData.cycleData.predictedPhase,
        energyScore: patientData.symptoms[0]?.value || 3,
        moodScore: patientData.symptoms[1]?.value || 3,
        occupationType: 'unknown',
        fastingToday: false,
        culturalContext: 'none',
        energyHistory: [3, 4, 3], // Mocked for now
        targetLanguage: 'English'
      });
      setPhaseGuidance(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGuidanceLoading(false);
    }
  };

  useEffect(() => {
    fetchNityaInsight();
    fetchPhaseGuidance();
  }, [profile]);

  return (
    <Card className="shadow-lg border-primary/10 overflow-hidden bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            Nitya's Daily Synthesis
          </CardTitle>
          <CardDescription>Small steps, achievable in under 2 minutes.</CardDescription>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
          <Sparkles className="h-3 w-3" />
          {nityaInsight?.tierReached || 'Synthesis'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/5">
            <Loader2 className="h-8 w-8 animate-spin mb-3 opacity-50 text-primary" />
            <p className="text-xs font-medium italic">Nitya is reflecting on your rhythm...</p>
          </div>
        ) : nityaInsight && (
          <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Sparkles className="h-20 w-20" />
            </div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-primary/10 p-3 rounded-2xl shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-3 flex-1">
                <p className="text-base font-medium leading-relaxed italic text-foreground">
                  "{nityaInsight.observation}"
                </p>
                {nityaInsight.dialogueQuestion && (
                  <div className="flex gap-3 items-start mt-3 pt-4 border-t border-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary mt-0.5 opacity-60" />
                    <p className="text-xs text-muted-foreground font-medium italic">
                      {nityaInsight.dialogueQuestion}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Phase Invitations</p>
            {isGuidanceLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          
          {phaseGuidance?.introMessage && (
            <p className="text-xs text-primary font-medium italic bg-primary/5 p-2 rounded-lg border border-primary/10 mb-1">
              {phaseGuidance.introMessage}
            </p>
          )}

          {phaseGuidance?.guidance.map((rec) => {
            const Icon = iconMap[rec.domain] || Sparkles;
            return (
              <div key={rec.domain} className="flex gap-4 p-4 rounded-2xl bg-secondary/5 border border-secondary/10 group hover:bg-secondary/10 transition-all">
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-secondary/20 group-hover:scale-110 transition-transform h-fit">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest">{rec.domain}</p>
                  <p className="text-sm leading-relaxed text-foreground font-semibold">{rec.invitation}</p>
                </div>
              </div>
            );
          })}
          
          {!phaseGuidance && !isGuidanceLoading && (
            <div className="text-center py-6 text-muted-foreground italic text-xs">
              Waiting for my lens to focus on your day...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

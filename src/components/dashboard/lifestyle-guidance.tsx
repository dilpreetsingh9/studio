'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Apple, Dumbbell, Coffee, Wind, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { patientData } from '@/lib/data';
import { generateHealthRecommendations, GenerateHealthRecommendationsOutput } from '@/ai/flows/generate-health-recommendations';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const staticGuidance = {
  Follicular: [
    { type: 'Nourishment', icon: Apple, text: 'A handful of soaked almonds with your morning tea for steady energy.' },
    { type: 'Movement', icon: Dumbbell, text: 'A 2-minute brisk walk after your rajma-chawal lunch.' },
  ],
  Menstrual: [
    { type: 'Nourishment', icon: Apple, text: 'Warm khichdi with a little ghee. Comforting and easy on the gut.' },
    { type: 'Rest', icon: Wind, text: 'A simple stretch while the chai water boils. Nothing strenuous.' },
  ],
};

export default function LifestyleGuidance() {
  const [nityaInsight, setNityaInsight] = useState<GenerateHealthRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const currentPhase = patientData.cycleData.predictedPhase;
  const recommendations = staticGuidance[currentPhase as keyof typeof staticGuidance] || staticGuidance.Follicular;

  const fetchNityaInsight = async () => {
    setIsLoading(true);
    try {
      const result = await generateHealthRecommendations({
        medicalRecords: "Endometriosis history, regular cycles.",
        patientDetails: `28y Female, ${patientData.cycleData.predictedPhase} phase. Sensitivities: Peanuts.`,
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

  useEffect(() => {
    fetchNityaInsight();
  }, []);

  return (
    <Card className="shadow-md border-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            Nitya's Invitations
          </CardTitle>
          <CardDescription>Small steps, achievable in under 2 minutes.</CardDescription>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 px-2">
          <Sparkles className="h-3 w-3" />
          Insight
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <p className="text-xs italic">Reflecting on your rhythm...</p>
          </div>
        ) : nityaInsight && (
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium leading-relaxed italic text-foreground">
                  "{nityaInsight.observation}"
                </p>
                {nityaInsight.dialogueQuestion && (
                  <div className="flex gap-2 items-start mt-2 pt-2 border-t border-primary/10">
                    <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5" />
                    <p className="text-xs text-muted-foreground italic">
                      {nityaInsight.dialogueQuestion}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {recommendations.map((rec) => (
            <div key={rec.type} className="flex gap-4 p-4 rounded-2xl bg-secondary/5 border border-secondary/10 group hover:bg-secondary/10 transition-colors">
              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-secondary/20 group-hover:scale-110 transition-transform">
                <rec.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{rec.type}</p>
                <p className="text-sm leading-relaxed text-foreground font-medium">{rec.text}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

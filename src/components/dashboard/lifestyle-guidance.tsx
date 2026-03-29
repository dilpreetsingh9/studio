
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Apple, Dumbbell, Wind, Sparkles, Loader2, MessageSquare, Briefcase, Users, HelpCircle, CheckCircle2, Home, HandHeart, ChevronRight, AlertCircle, CalendarHeart, Coffee } from 'lucide-react';
import { patientData } from '@/lib/data';
import { generateHealthRecommendations, GenerateHealthRecommendationsOutput } from '@/ai/flows/generate-health-recommendations';
import { generatePhaseGuidance, GeneratePhaseGuidanceOutput } from '@/ai/flows/generate-phase-guidance';
import { generateReengagementNote } from '@/ai/flows/generate-reengagement-note';
import { generateDayOneWelcome } from '@/ai/flows/generate-day-one-welcome';
import { analyzeMedicationGap } from '@/ai/flows/analyze-medication-gap';
import { generateRelationshipMilestone } from '@/ai/flows/generate-relationship-milestone';
import { generateMorningNudge } from '@/ai/flows/generate-morning-nudge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const iconMap: Record<string, any> = {
  Nutrition: Apple,
  Movement: Dumbbell,
  Work: Briefcase,
  Social: Users,
  Rest: Wind,
};

export default function LifestyleGuidance({ profile }: { profile: any }) {
  const [nityaInsight, setNityaInsight] = useState<GenerateHealthRecommendationsOutput | null>(null);
  const [reengagementNote, setReengagementNote] = useState<string | null>(null);
  const [dayOneNote, setDayOneNote] = useState<string | null>(null);
  const [milestoneNote, setMilestoneNote] = useState<string | null>(null);
  const [morningNudge, setMorningNudge] = useState<string | null>(null);
  const [medicationGapInsight, setMedicationGapInsight] = useState<string | null>(null);
  const [phaseGuidance, setPhaseGuidance] = useState<GeneratePhaseGuidanceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuidanceLoading, setIsGuidanceLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  // H-1 Caching: Check if already loaded in this session
  useEffect(() => {
    const cached = sessionStorage.getItem(`nitya_h1_${profile?.id}`);
    if (cached) {
      setNityaInsight(JSON.parse(cached));
    }
  }, [profile?.id]);

  const fetchNityaInsight = async () => {
    if (!profile || nityaInsight) return; // Respect session cache
    setIsLoading(true);
    try {
      let daysActive = 0;
      if (profile.createdAt) {
        const createdDate = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
        daysActive = Math.max(1, Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24)));
      }

      const userRef = doc(db, 'users', profile.id);
      const maturity = daysActive > 30 ? 'established' : (daysActive > 7 ? 'developing' : 'new');

      // Day One Logic
      if (daysActive <= 1) {
        const welcome = await generateDayOneWelcome({
          firstName: profile.firstName,
          healthFocus: profile.healthFocus || 'overall balance',
          timeOfDay: new Date().getHours() < 12 ? 'Morning' : 'Afternoon',
          cityTier: profile.cityTier || 'unknown',
          targetLanguage: 'English'
        });
        setDayOneNote(welcome.welcomeNote);
      } else {
        // Morning Nudge (N-1) - Never cached
        const isMorning = new Date().getHours() >= 5 && new Date().getHours() < 12;
        if (isMorning) {
          const nudgeResult = await generateMorningNudge({
            firstName: profile.firstName,
            daysActive,
            relationshipMaturity: maturity as any,
            yesterdayTheme: 'Sleep Rhythms',
            targetLanguage: 'English'
          });
          setMorningNudge(nudgeResult.nudge);
        }

        // Milestone Logic
        const milestones = [30, 60, 90, 180, 365];
        if (milestones.includes(daysActive)) {
          const milestoneResult = await generateRelationshipMilestone({
            firstName: profile.firstName,
            daysActive,
            milestoneDays: daysActive,
            mostConsistent: 'your morning ritual',
            visibleChange: 'your HRV recovery levels',
            targetLanguage: 'English'
          });
          setMilestoneNote(milestoneResult.note);
        }
      }

      // Main Synthesis (H-1)
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
          },
          logs: {
            energy: patientData.symptoms[0]?.value || 3,
            mood: patientData.symptoms[1]?.value || 3,
            journalSnippet: patientData.journalEntries?.[0]?.content,
          },
          medicalHistory: profile.medicalHistory,
        },
        relationshipState: {
          daysActive: daysActive,
          relationshipMaturity: maturity as any,
          daysSinceDialogue: 3, 
          targetLanguage: 'English',
          toneMode: profile.toneMode
        }
      });
      setNityaInsight(result);
      sessionStorage.setItem(`nitya_h1_${profile.id}`, JSON.stringify(result));
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
        targetLanguage: 'English'
      });
      setPhaseGuidance(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGuidanceLoading(false);
    }
  };

  const handleDialogueResponse = async (choice: 'external' | 'internal') => {
    if (!profile?.id) return;
    setIsResponding(true);
    try {
      const toneMode = choice === 'external' ? 'practical' : 'supportive';
      const userRef = doc(db, 'users', profile.id);
      await updateDoc(userRef, { toneMode, lastDialogueResponseDate: serverTimestamp() });
      toast({ title: "Noted.", description: "Tomorrow's read will reflect this." });
      sessionStorage.removeItem(`nitya_h1_${profile.id}`); // Clear cache to allow refresh
      fetchNityaInsight();
    } catch (error) {
      console.error(error);
    } finally {
      setIsResponding(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchNityaInsight();
      fetchPhaseGuidance();
    }
  }, [profile]);

  return (
    <Card className="shadow-lg border-primary/10 overflow-hidden bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black tracking-tight">Nitya's Daily Synthesis</CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            {morningNudge && <span className="text-primary font-bold animate-in fade-in">{morningNudge}</span>}
          </CardDescription>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
          <Sparkles className="h-3 w-3" />
          {nityaInsight?.tierReached || 'Synthesis'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/5">
            <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary opacity-50" />
            <p className="text-xs font-medium italic">Nitya is reflecting...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {milestoneNote && (
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 animate-in fade-in slide-in-from-bottom-4">
                <p className="text-base font-medium leading-relaxed italic">"{milestoneNote}"</p>
              </div>
            )}

            {nityaInsight?.dialogueMoment ? (
              <div className="bg-accent/10 p-6 rounded-3xl border border-accent/20 text-center animate-in fade-in slide-in-from-bottom-4">
                <p className="text-lg font-bold mb-4">{nityaInsight.dialogueMoment.question}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="rounded-2xl text-xs h-12" onClick={() => handleDialogueResponse('external')}>{nityaInsight.dialogueMoment.optionA}</Button>
                  <Button variant="outline" className="rounded-2xl text-xs h-12" onClick={() => handleDialogueResponse('internal')}>{nityaInsight.dialogueMoment.optionB}</Button>
                </div>
              </div>
            ) : nityaInsight?.observation ? (
              <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 group">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 p-3 rounded-2xl shrink-0"><Sparkles className="h-5 w-5 text-primary" /></div>
                  <div className="space-y-3 flex-1">
                    <p className="text-base font-medium leading-relaxed italic">"{nityaInsight.observation}"</p>
                    {nityaInsight.actionLine && (
                      <Button variant="ghost" className="w-full justify-between h-12 bg-white/50 border-primary/5 rounded-2xl px-4 text-primary">
                        <span className="text-sm font-bold">{nityaInsight.actionLine}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="grid gap-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Phase Invitations</p>
          {phaseGuidance?.guidance.map((rec) => {
            const Icon = iconMap[rec.domain] || Sparkles;
            return (
              <div key={rec.domain} className="flex gap-4 p-4 rounded-2xl bg-secondary/5 border border-secondary/10">
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-secondary/20 h-fit"><Icon className="h-5 w-5 text-primary" /></div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest">{rec.domain}</p>
                  <p className="text-sm leading-relaxed font-semibold">{rec.invitation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

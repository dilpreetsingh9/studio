
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Apple, Dumbbell, Wind, Sparkles, Loader2, MessageSquare, Briefcase, Users, HelpCircle, CheckCircle2, Home, HandHeart, ChevronRight } from 'lucide-react';
import { patientData } from '@/lib/data';
import { generateHealthRecommendations, GenerateHealthRecommendationsOutput } from '@/ai/flows/generate-health-recommendations';
import { generatePhaseGuidance, GeneratePhaseGuidanceOutput } from '@/ai/flows/generate-phase-guidance';
import { generateReengagementNote, GenerateReengagementNoteOutput } from '@/ai/flows/generate-reengagement-note';
import { generateDayOneWelcome, GenerateDayOneWelcomeOutput } from '@/ai/flows/generate-day-one-welcome';
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
  const [phaseGuidance, setPhaseGuidance] = useState<GeneratePhaseGuidanceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuidanceLoading, setIsGuidanceLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  const fetchNityaInsight = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      let daysActive = 0;
      if (profile.createdAt) {
        const createdDate = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
        daysActive = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
      }

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
        let daysAway = 0;
        if (profile.lastOpenDate) {
          const lastDate = profile.lastOpenDate.toDate ? profile.lastOpenDate.toDate() : new Date(profile.lastOpenDate);
          daysAway = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        }

        if (daysAway >= 3 && daysAway <= 14) {
          const reNote = await generateReengagementNote({
            firstName: profile.firstName,
            daysAway,
            relationshipMaturity: 'developing',
            reEngagementCount: profile.reEngagementCount || 0,
            targetLanguage: 'English'
          });
          setReengagementNote(reNote.note);
          
          const userRef = doc(db, 'users', profile.id);
          await updateDoc(userRef, { 
            reEngagementCount: (profile.reEngagementCount || 0) + 1,
            lastOpenDate: serverTimestamp()
          });
        }
      }

      const userRef = doc(db, 'users', profile.id);
      await updateDoc(userRef, { lastOpenDate: serverTimestamp() });

      let daysSinceDialogue = 100;
      if (profile.lastDialogueResponseDate) {
        const lastDate = profile.lastDialogueResponseDate.toDate ? profile.lastDialogueResponseDate.toDate() : new Date(profile.lastDialogueResponseDate);
        daysSinceDialogue = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      }

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
          daysActive: daysActive,
          dataRichnessScore: daysActive > 7 ? 0.4 : 0.1,
          recentInsightThemes: [],
          relationshipMaturity: daysActive > 30 ? 'established' : (daysActive > 7 ? 'developing' : 'new'),
          daysSinceDialogue: daysSinceDialogue,
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
        energyHistory: [3, 4, 3], 
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
      const userRef = doc(db, 'users', profile.id);
      await updateDoc(userRef, {
        lastDialogueResponse: choice,
        lastDialogueResponseDate: serverTimestamp(),
      });
      toast({
        title: "I hear you.",
        description: choice === 'external' ? "Practical rhythms for the next few days." : "Gentle support for the next few days.",
      });
      fetchNityaInsight();
    } catch (error) {
      console.error('Failed to save dialogue response', error);
    } finally {
      setIsResponding(false);
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
          {dayOneNote ? 'Our Beginning' : (reengagementNote ? 'Welcome Home' : (nityaInsight?.tierReached || 'Synthesis'))}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/5">
            <Loader2 className="h-8 w-8 animate-spin mb-3 opacity-50 text-primary" />
            <p className="text-xs font-medium italic">Nitya is reflecting on your rhythm...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dayOneNote && (
              <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <HandHeart className="h-24 w-24 text-primary" />
                </div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="bg-white p-3 rounded-2xl shadow-sm shrink-0 border border-primary/5">
                    <HandHeart className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-base font-medium leading-relaxed italic text-foreground">
                      "{dayOneNote}"
                    </p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                      Our Promise: One easy choice at a time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {reengagementNote && !dayOneNote && (
              <div className="bg-accent/10 p-6 rounded-3xl border border-accent/20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Home className="h-20 w-20 text-primary" />
                </div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="bg-white/80 p-3 rounded-2xl shadow-sm shrink-0">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-bold text-foreground leading-tight italic">
                      "{reengagementNote}"
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                      Coming back is what matters.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!dayOneNote && (
              nityaInsight?.dialogueMoment ? (
                <div className="bg-accent/10 p-6 rounded-3xl border border-accent/20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <HelpCircle className="h-20 w-20 text-primary" />
                  </div>
                  <div className="space-y-4 relative z-10 text-center">
                    <div className="bg-white/50 w-fit mx-auto p-2 rounded-full mb-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-lg font-bold text-foreground leading-tight px-4">
                      {nityaInsight.dialogueMoment.question}
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        className="h-12 rounded-2xl border-primary/20 hover:bg-primary/5 font-bold text-xs"
                        onClick={() => handleDialogueResponse('external')}
                        disabled={isResponding}
                      >
                        {isResponding ? <Loader2 className="h-3 w-3 animate-spin" /> : nityaInsight.dialogueMoment.optionA}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-12 rounded-2xl border-primary/20 hover:bg-primary/5 font-bold text-xs"
                        onClick={() => handleDialogueResponse('internal')}
                        disabled={isResponding}
                      >
                        {isResponding ? <Loader2 className="h-3 w-3 animate-spin" /> : nityaInsight.dialogueMoment.optionB}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                      I'm just curious. This helps me find the right tone for us.
                    </p>
                  </div>
                </div>
              ) : nityaInsight?.observation ? (
                <div className={cn(
                  "bg-primary/5 p-6 rounded-3xl border border-primary/10 relative overflow-hidden group",
                  reengagementNote && "opacity-80 scale-95"
                )}>
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Sparkles className="h-20 w-20" />
                  </div>
                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-2xl shrink-0">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-3 flex-1">
                        <p className="text-base font-medium leading-relaxed italic text-foreground">
                          "{nityaInsight.observation}"
                        </p>
                        {profile?.lastDialogueResponse && (
                          <div className="flex gap-3 items-start mt-3 pt-4 border-t border-primary/10">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 opacity-60" />
                            <p className="text-[10px] text-muted-foreground font-medium italic leading-tight">
                              {profile.lastDialogueResponse === 'external' 
                                ? "Life sounds full right now — keeping things practical today." 
                                : "Staying quiet and supportive today as you focus inward."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {nityaInsight.actionLine && (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between h-12 bg-white/50 hover:bg-white border-primary/5 rounded-2xl px-4 text-primary group/action"
                      >
                        <span className="text-sm font-bold tracking-tight">{nityaInsight.actionLine}</span>
                        <ChevronRight className="h-4 w-4 group-hover/action:translate-x-1 transition-transform" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : null
            )}
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
        </div>
      </CardContent>
    </Card>
  );
}

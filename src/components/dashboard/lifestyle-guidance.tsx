'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Apple, Dumbbell, Wind, Sparkles, Loader2, MessageSquare, Briefcase, Users, ChevronRight, BrainCircuit } from 'lucide-react';
import { patientData } from '@/lib/data';
import { generateHealthRecommendations, GenerateHealthRecommendationsOutput } from '@/ai/flows/generate-health-recommendations';
import { generatePhaseGuidance, GeneratePhaseGuidanceOutput } from '@/ai/flows/generate-phase-guidance';
import { generateDayOneWelcome } from '@/ai/flows/generate-day-one-welcome';
import { generateRelationshipMilestone } from '@/ai/flows/generate-relationship-milestone';
import { generateMorningNudge } from '@/ai/flows/generate-morning-nudge';
import { generatePatternCheckin } from '@/ai/flows/generate-pattern-checkin';
import { generatePregnancySynthesis } from '@/ai/flows/generate-pregnancy-synthesis';
import { generatePregnancyMilestone } from '@/ai/flows/generate-pregnancy-milestone';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const iconMap: Record<string, any> = {
  Nutrition: Apple,
  Movement: Dumbbell,
  Work: Briefcase,
  Social: Users,
  Rest: Wind,
};

export default function LifestyleGuidance({ profile }: { profile: any }) {
  const db = useFirestore();
  const { toast } = useToast();

  const synthesisRef = useMemoFirebase(() => {
    return profile?.id ? doc(db, 'users', profile.id, 'synthesis', 'today') : null;
  }, [profile?.id, db]);

  const { data: firestoreSynthesis, isLoading: isFSLoding } = useDoc(synthesisRef);

  const [jeivaInsight, setJeivaInsight] = useState<string | null>(null);
  const [tierReached, setTierReached] = useState<string | null>(null);
  const [actionLine, setActionLine] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<any>(null);
  
  const [dayOneNote, setDayOneNote] = useState<string | null>(null);
  const [milestoneNote, setMilestoneNote] = useState<string | null>(null);
  const [morningNudge, setMorningNudge] = useState<string | null>(null);
  const [patternCheckin, setPatternCheckin] = useState<string | null>(null);
  const [pregnancyMilestone, setPregnancyMilestone] = useState<string | null>(null);
  const [phaseGuidance, setPhaseGuidance] = useState<GeneratePhaseGuidanceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuidanceLoading, setIsGuidanceLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const fetchJeivaInsight = async () => {
    if (!profile || firestoreSynthesis) return; 
    setIsLoading(true);
    try {
      const createdDate = profile.createdAt?.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt || Date.now());
      const daysActive = Math.max(1, Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24)));
      const maturity = daysActive > 30 ? 'established' : (daysActive > 7 ? 'developing' : 'new');

      // 1. Check for Pregnancy Mode
      if (profile.lifeStage === 'Pregnancy' || profile.healthFocus?.toLowerCase().includes('pregnancy')) {
        const currentWeek = profile.pregnancyWeek || 14;
        const trimester = currentWeek <= 12 ? 1 : (currentWeek <= 26 ? 2 : 3);

        const pregnancyResult = await generatePregnancySynthesis({
          firstName: profile.firstName,
          currentWeek,
          trimester,
          weeksRemaining: 40 - currentWeek,
          vitals: {
            rhr: 78,
            sleepHours: 7.2,
            weightKg: 64,
          },
          checkin: {
            nausea: 2,
            energy: 3,
            movementFelt: true,
          },
          daysActive,
          targetLanguage: 'English'
        });
        setJeivaInsight(pregnancyResult.synthesis);
        setTierReached('Pregnancy');

        // Check for Pregnancy Weekly Milestone
        // For MVP, we assume any day that is "Day 1" of a week triggers this
        if (daysActive % 7 === 1 || daysActive === 1) {
          const milestoneResult = await generatePregnancyMilestone({
            firstName: profile.firstName,
            currentWeek,
            trimester,
            targetLanguage: 'English'
          });
          setPregnancyMilestone(milestoneResult.milestoneNote);
        }

        setIsLoading(false);
        return;
      }

      // 2. SC-1 Pattern Checkin (Potential State Change)
      const cycleDay = patientData.cycleData.currentDay;
      if (cycleDay > 32) {
        const checkinResult = await generatePatternCheckin({
          missedPeriod: true,
          hrvChange: true,
          tempShift: true,
          daysSinceLastPeriod: cycleDay,
          targetLanguage: 'English'
        });
        setPatternCheckin(checkinResult.checkInNote);
      }

      // 3. Day 1 Welcome
      if (daysActive <= 1) {
        const welcome = await generateDayOneWelcome({
          firstName: profile.firstName,
          healthFocus: profile.healthFocus || 'overall balance',
          timeOfDay: new Date().getHours() < 12 ? 'Morning' : 'Afternoon',
          targetLanguage: 'English'
        });
        setDayOneNote(welcome.welcomeNote);
      } else {
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

        const milestones = [30, 60, 90];
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

      // 4. Standard Synthesis
      const result = await generateHealthRecommendations({
        clinicalData: {
          firstName: profile.firstName,
          timeOfDay: new Date().getHours() < 12 ? 'Morning' : 'Afternoon',
          cycleDay: patientData.cycleData.currentDay,
          phase: patientData.cycleData.predictedPhase,
          vitals: {
            rhr: { value: 64, trend: 'stable' },
            sleep: { value: 7.2, trend: 'up' },
            hrv: { value: 55, trend: 'up' },
          },
          logs: {
            energy: 3,
            mood: 4,
          },
        },
        relationshipState: {
          daysActive: daysActive,
          relationshipMaturity: maturity as any,
          targetLanguage: 'English',
          toneMode: profile.toneMode || 'supportive'
        }
      });
      setJeivaInsight(result.observation || null);
      setTierReached(result.tierReached);
      setActionLine(result.actionLine || null);
      setDialogue(result.dialogueMoment || null);
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
        energyScore: 3,
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
      toast({ title: "Noted.", description: "Jeiva will reflect this in tomorrow's synthesis." });
      setDialogue(null);
      fetchJeivaInsight();
    } catch (error) {
      console.error(error);
    } finally {
      setIsResponding(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchJeivaInsight();
      fetchPhaseGuidance();
    }
  }, [profile, firestoreSynthesis]);

  const displayObservation = patternCheckin || firestoreSynthesis?.content || jeivaInsight || dayOneNote;
  const isReturn = profile?.reEngagementCount > 0 && !displayObservation;

  return (
    <Card className="shadow-xl border-none bg-primary text-primary-foreground overflow-hidden rounded-[2rem]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            Jeiva's Daily Read
          </CardTitle>
          <CardDescription className="text-white/60 font-medium synthesis-body text-voice">
            {morningNudge || "Listening to your patterns"}
          </CardDescription>
        </div>
        <Badge variant="outline" className="bg-white/10 text-white border-white/20 gap-1 px-3 py-1 rounded-full text-label font-bold uppercase tracking-widest">
          {patternCheckin ? 'Pattern Check-In' : (tierReached || 'Synthesis')}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading || isFSLoding ? (
          <div className="flex flex-col items-center justify-center py-10 text-white/40 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
            <Loader2 className="h-8 w-8 animate-spin mb-3 text-secondary opacity-50" />
            <p className="text-xs font-medium italic">Finding the threads...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pregnancyMilestone && (
              <div className="bg-secondary/20 p-5 rounded-3xl border border-secondary/20 animate-in fade-in slide-in-from-bottom-4">
                <p className="synthesis-body italic-voice text-white italic leading-relaxed">
                  "{pregnancyMilestone}"
                </p>
              </div>
            )}

            {milestoneNote && (
              <div className="bg-secondary/20 p-5 rounded-3xl border border-secondary/20 animate-in fade-in slide-in-from-bottom-4">
                <p className="synthesis-body italic-voice text-white italic">"{milestoneNote}"</p>
              </div>
            )}

            {isReturn && (
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <p className="synthesis-body leading-relaxed italic text-white/90 italic-voice">
                  "Welcome back. The body keeps its rhythm even when we aren't watching. Ready to check in?"
                </p>
              </div>
            )}

            {!displayObservation && !milestoneNote && !isReturn && !pregnancyMilestone && (
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col items-center text-center gap-3">
                <BrainCircuit className="h-8 w-8 text-white/20" />
                <p className="synthesis-body text-white/60 italic italic-voice">
                  "Our patterns are still quiet. Share a thought in your journal to help Jeiva learn your rhythm today."
                </p>
              </div>
            )}

            {dialogue && (
              <div className="bg-white/10 p-6 rounded-3xl border border-white/20 text-center animate-in fade-in slide-in-from-bottom-4">
                <p className="font-content text-display font-bold mb-4">{dialogue.question}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="rounded-2xl font-ui text-label h-12 bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={() => handleDialogueResponse('external')}>{dialogue.optionA}</Button>
                  <Button variant="outline" className="rounded-2xl font-ui text-label h-12 bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={() => handleDialogueResponse('internal')}>{dialogue.optionB}</Button>
                </div>
              </div>
            )}

            {displayObservation && !dialogue && (
              <div className="space-y-4 animate-in fade-in duration-700">
                <p className={cn(
                  "synthesis-body leading-relaxed text-white/90 pr-4",
                  (patternCheckin || dayOneNote || milestoneNote || tierReached === 'Pregnancy') && "italic-voice"
                )}>
                  "{displayObservation}"
                </p>
                {actionLine && !patternCheckin && (
                  <Button variant="ghost" className="w-full justify-between h-14 bg-white/10 border-white/5 hover:bg-white/20 rounded-3xl px-5 text-white group">
                    <span className="font-ui text-label font-black uppercase tracking-widest">{actionLine}</span>
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
                {patternCheckin && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button variant="outline" className="rounded-2xl font-ui text-label h-12 bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={() => { setPatternCheckin(null); toast({ title: "Noted.", description: "Jeiva will hold this observation quietly." }); }}>Yes</Button>
                    <Button variant="outline" className="rounded-2xl font-ui text-label h-12 bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={() => { setPatternCheckin(null); toast({ title: "Noted.", description: "Jeiva will update your patterns." }); }}>No</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {phaseGuidance && tierReached !== 'Pregnancy' && (
          <div className="pt-4 border-t border-white/10 space-y-3">
            <p className="text-label font-black text-white/40 uppercase tracking-[0.2em] px-1">Phase Invitations</p>
            <div className="grid grid-cols-2 gap-2">
              {phaseGuidance.guidance.slice(0, 2).map((rec) => {
                const Icon = iconMap[rec.domain] || Sparkles;
                return (
                  <div key={rec.domain} className="p-4 rounded-3xl bg-white/5 border border-white/10 flex flex-col gap-2">
                    <Icon className="h-4 w-4 text-secondary" />
                    <p className="font-content text-small leading-snug text-white/80">{rec.invitation}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
